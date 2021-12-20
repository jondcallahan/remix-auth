import { ActionFunction, json } from "remix";
import invariant from "tiny-invariant";
import { authenticateUser } from "~/utils/auth/authSession.server";
import { signUserIn } from "~/utils/auth/signUserIn";
import { authenticator } from "~/utils/auth/twoFactor.server";
import type { MetaFunction } from "remix";
import { SignUpSignInForm } from "~/components/SignUpSignInForm";
import { badRequest } from "~/utils/net";
import { db } from "~/utils/prisma.server";

export const meta: MetaFunction = () => {
  return {
    title: "Sign in",
  };
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  const twoFactorToken = form.get("token");
  const redirectTo = form.get("redirectTo") || "/";

  const fieldErrors = { email: "", password: "" };

  if (!email) {
    fieldErrors.email = "Email address required";
  }

  if (!password) {
    fieldErrors.password = "Password required";
  }

  // TODO: Check if token was submitted but it's empty. If so show a fieldError

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors });
  }
  invariant(typeof email === "string");
  invariant(typeof password === "string");
  invariant(typeof redirectTo === "string");

  const { userId } = await authenticateUser({
    email,
    rawPassword: password,
  });

  if (userId) {
    // User email and password are now correct

    // Now check if user has 2FA
    const stored2faTokens = await db.twoFactorAuthTokens.findUnique({
      where: { userId },
    });
    const needs2faToken = !!stored2faTokens;

    if (needs2faToken) {
      if (!twoFactorToken) {
        // Complete 2fa flow
        console.log("🔐 Need to add 2fa flow");
        return json({
          needs2faToken,
        });
      } else {
        invariant(typeof twoFactorToken === "string");
        const isTokenValid = authenticator.check(
          twoFactorToken,
          stored2faTokens.secret
        );
        if (isTokenValid) {
          return await signUserIn(userId, redirectTo, request);
        } else {
          return json({
            fieldErrors: { token: "Invalid token" },
            needs2faToken,
          });
        }
      }
    }
    return await signUserIn(userId, redirectTo, request);
  } else {
    return badRequest({
      formError: "Invalid password or incorrect email address",
    });
  }
};

export default function Signin() {
  return (
    <main className="container">
      <h1>Sign in to our App!</h1>
      <SignUpSignInForm buttonText="Sign in!" />
      <a href="/auth/forgot-password">Forgot password?</a>
    </main>
  );
}
