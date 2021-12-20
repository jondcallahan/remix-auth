import { PrismaClient } from "@prisma/client";
import {
  ActionFunction,
  Form,
  json,
  Link,
  MetaFunction,
  useActionData,
  useParams,
} from "remix";
import invariant from "tiny-invariant";
import { hashPassword, hashToken } from "~/utils/hash.server";
import { db } from "~/utils/prisma.server";

export const meta: MetaFunction = () => {
  return {
    title: "Reset password",
  };
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const token = await form.get("token");
  const password = await form.get("password");

  if (!token) {
    return { error: "Missing token" };
  }
  invariant(typeof token === "string");

  if (!password) {
    return { fieldError: "Password is required" };
  }
  invariant(typeof password === "string");

  const hashedToken = hashToken(token);
  const hashedPassword = await hashPassword(password);

  try {
    const success = await db.$transaction(async (prisma: PrismaClient) => {
      const storedToken = await prisma.passwordResetTokens.findUnique({
        where: {
          hashedToken,
        },
      });
      if (!storedToken) {
        throw json({
          error: "Token not found. Please try forgot password again.",
        });
      }
      if (storedToken.tokenExpiry < new Date()) {
        throw json({
          error: "Token has expired. Please try forgot password again.",
        });
      }
      await prisma.passwordResetTokens.deleteMany({
        where: {
          userId: storedToken.userId,
        },
      });
      return await prisma.user.update({
        where: {
          id: storedToken.userId,
        },
        data: {
          hashedPassword,
        },
      });
    });
    console.log("Success!", success);
    return { success: true };
  } catch (error) {
    console.error("error", error);
    return error;
  }
};

export default function ForgotPasswordReset() {
  const params = useParams();
  const formData = useActionData();
  return (
    <main className="container">
      <h1>Reset your password!</h1>
      {formData?.success || (
        <Form method="post">
          <input
            type="hidden"
            value={params["token"] || undefined}
            name="token"
          />
          {formData?.fieldError && <mark>{formData.fieldError}</mark>}
          <label htmlFor="password">
            <input type="password" placeholder="New password" name="password" />
          </label>
          <button type="submit">Set new password</button>
        </Form>
      )}
      {formData?.error && (
        <>
          <mark>{formData.error}</mark>
          <br />
          <Link to="/signin">Sign in</Link>
        </>
      )}
      {formData?.success && (
        <p>
          Password has been reset. <Link to="/signin">Sign in</Link>
        </p>
      )}
    </main>
  );
}
