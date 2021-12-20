import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  MetaFunction,
  useActionData,
  useTransition,
} from "remix";
import {
  authenticateUser,
  updateUserPassword,
} from "~/utils/auth/authSession.server";
import { requireUser } from "~/utils/auth/user.server";
import { badRequest } from "~/utils/net";

export const meta: MetaFunction = () => {
  return {
    title: "Update password",
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const { user, newResponseHeaders } = await requireUser(
    request,
    "/signin?redirectTo=/auth/update-password"
  );
  return json({ user }, { headers: newResponseHeaders });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, newResponseHeaders } = await requireUser(
    request,
    "/signin?redirectTo=/auth/update-password"
  );
  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");

  const fieldErrors = { newPassword: "", currentPassword: "" };

  if (!newPassword) {
    fieldErrors.newPassword = "New password required";
  }

  if (!currentPassword) {
    fieldErrors.currentPassword = "Current password required";
  }

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors });
  }

  const { userId } = await authenticateUser({
    email: user.emailAddress,
    rawPassword: currentPassword,
  });

  if (userId) {
    const success = await updateUserPassword(
      user.emailAddress,
      currentPassword,
      newPassword
    );
    if (success) {
      return json({ success }, { headers: newResponseHeaders });
    } else {
      console.log("/////68");

      return badRequest({
        formError:
          "Error updating password. Check your current password and try again.",
      });
    }
  } else {
    console.log("/////76");
    return badRequest({
      formError:
        "Error updating password. Check your current password and try again.",
    });
  }
};

export default function UpdatePassword() {
  const formData = useActionData();
  const submission = useTransition();

  // TODO: Require 2fa code if user has it

  return (
    <main className="container">
      <h1>Update your password!</h1>
      {formData?.formError && <mark>{formData.formError}</mark>}
      <Form method="post">
        {formData?.fieldErrors?.currentPassword && (
          <mark>{formData.fieldErrors.currentPassword}</mark>
        )}
        <label htmlFor="currentPassword">Current password</label>
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          aria-invalid={!!formData?.fieldErrors?.currentPassword || undefined}
          disabled={
            submission.state === "submitting" || submission.state === "loading"
          }
        />
        {formData?.fieldErrors?.newPassword && (
          <mark>{formData.fieldErrors.newPassword}</mark>
        )}
        <label htmlFor="newPassword">New password</label>
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          aria-invalid={!!formData?.fieldErrors?.newPassword || undefined}
          disabled={
            submission.state === "submitting" || submission.state === "loading"
          }
        />
        <button
          type="submit"
          disabled={
            submission.state === "submitting" || submission.state === "loading"
          }
          aria-busy={
            submission.state === "submitting" || submission.state === "loading"
          }
        >
          Save new password
        </button>
      </Form>
      {formData?.success && <p>Your password has been updated.</p>}
    </main>
  );
}
