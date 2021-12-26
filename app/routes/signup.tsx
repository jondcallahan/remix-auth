import { ActionFunction, Form, json, useSearchParams } from "remix";
import invariant from "tiny-invariant";
import { createUser } from "~/utils/auth/authSession.server";
import { sendVerificationEmail } from "~/utils/mail.server";
import type { MetaFunction } from "remix";
import { SignUpSignInForm } from "~/components/SignUpSignInForm";
import { signUserIn } from "~/utils/auth/signUserIn";
import { badRequest } from "~/utils/net";
import AppShell from "~/components/AppShell";

export const meta: MetaFunction = () => {
  return {
    title: "Sign up",
  };
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email");
  const rawPassword = form.get("password");
  const redirectTo = form.get("redirectTo") || "/";

  const fieldErrors = { email: "", password: "" };

  if (!email) {
    fieldErrors.email = "Email address required";
  }

  if (!rawPassword) {
    fieldErrors.password = "Password required";
  }
  // TODO: Validate password

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors });
  }
  invariant(typeof email === "string");
  invariant(typeof rawPassword === "string");
  invariant(typeof redirectTo === "string");

  try {
    const user = await createUser({ email, rawPassword });

    await sendVerificationEmail(email);
    return signUserIn(
      { userId: user.id, emailAddress: email },
      redirectTo,
      request
    );
  } catch (error) {
    console.error("error", error);
    return badRequest({
      formError: "Invalid password or email address already in use",
    });
  }
};

export default function Signup() {
  return (
    <AppShell>
      <h1>Sign up for our App!</h1>
      <SignUpSignInForm buttonText="Sign up!" />
    </AppShell>
  );
}
