import { addHours } from "date-fns";
import {
  ActionFunction,
  Form,
  json,
  MetaFunction,
  redirect,
  useActionData,
  useNavigate,
  useTransition,
} from "remix";
import invariant from "tiny-invariant";
import { createResetPasswordToken } from "~/utils/auth/tokens.server";
import { hashToken } from "~/utils/hash.server";
import { sendForgotPasswordEmail } from "~/utils/mail.server";
import { db } from "~/utils/prisma.server";

export const meta: MetaFunction = () => ({
  title: "Forgot password",
});
export const action: ActionFunction = async function ({ request }) {
  const form = await request.formData();
  const email = form.get("email");

  if (!email) {
    return { fieldErrors: { email: "Email address is required" } };
  }
  invariant(typeof email === "string");

  // Lookup userId by email
  const user = await db.user.findUnique({
    where: {
      emailAddress: email,
    },
  });
  if (user) {
    // Create a random token to use for forgot password
    const token = createResetPasswordToken();
    // Store a hash of the token in the DB tied to the user and an expiration
    const tokenHash = hashToken(token);
    const tokenExpiry = addHours(new Date(), 24);

    try {
      await db.passwordResetTokens.create({
        data: {
          userId: user.id,
          hashedToken: tokenHash,
          tokenExpiry,
        },
      });
      // Send user an email with the token (not hash) in a link back to the site
      await sendForgotPasswordEmail(email, token);
      // Send back success even if user was not found for security
    } catch (error) {
      // Swallow errors for security
      console.error("error", error);
    }
    return json({
      alert: `If an account exists for ${email}, we will email you instructions for resetting your password.`,
    });
  }

  return json({
    alert: `If an account exists for ${email}, we will email you instructions for resetting your password.`,
  });
};

export default function ForgotPassword() {
  const submission = useTransition();
  const formData = useActionData();
  return (
    <main className="container">
      <Form method="post">
        {formData?.fieldErrors?.email && (
          <mark>{formData.fieldErrors.email}</mark>
        )}
        <label htmlFor="email">
          Email address
          <input
            type="email"
            placeholder="my.name@example.com"
            name="email"
            disabled={submission.state === "submitting"}
            aria-invalid={!!formData?.fieldErrors?.email || undefined}
          />
        </label>
        <button
          type="submit"
          aria-busy={
            submission.state === "submitting" || submission.state === "loading"
          }
          disabled={submission.state === "submitting"}
        >
          Send forgot password link
        </button>
      </Form>
      {formData?.alert && <p>{formData.alert}</p>}
    </main>
  );
}
