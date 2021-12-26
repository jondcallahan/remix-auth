import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  MetaFunction,
  useActionData,
  useLoaderData,
  useTransition,
} from "remix";
import AppShell from "~/components/AppShell";
import {
  authenticateUser,
  updateUserPassword,
} from "~/utils/auth/authSession.server";
import { requireUser } from "~/utils/auth/user.server";
import { badRequest } from "~/utils/net";
import { db } from "~/utils/prisma.server";

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
  const has2fa = await db.twoFactorAuthTokens.findFirst({
    where: {
      userId: user.id,
    },
  });

  return json({ user, has2fa: !!has2fa }, { headers: newResponseHeaders });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, newResponseHeaders } = await requireUser(
    request,
    "/signin?redirectTo=/auth/update-password"
  );
  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const token = formData.get("token");

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

  try {
    const success = await updateUserPassword(
      user.emailAddress,
      currentPassword,
      newPassword,
      token
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
  } catch (error: any) {
    if (error?.errorType) {
      switch (error.errorType) {
        case "INCORRECT_PASSWORD":
          return json({
            fieldErrors: { currentPassword: "Incorrect password" },
          });
        case "MISSING_TOKEN":
          return json({
            fieldErrors: { token: "Token required" },
          });
        case "INVALID_TOKEN":
          return json({
            fieldErrors: { token: "Incorrect token" },
          });
      }
    }
    console.error("error", error);
  }
};

export default function UpdatePassword() {
  const formData = useActionData();
  const submission = useTransition();
  const { user, has2fa } = useLoaderData();
  const disabled =
    submission.state === "submitting" ||
    (submission.state === "loading" && submission.type === "actionRedirect");

  return (
    <AppShell user={user}>
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
          disabled={disabled}
        />
        {formData?.fieldErrors?.token && (
          <mark>{formData.fieldErrors.token}</mark>
        )}
        {has2fa && (
          <>
            <label htmlFor="token">2FA token</label>
            <input
              type="text"
              name="token"
              autoComplete="one-time-code"
              aria-invalid={!!formData?.fieldErrors?.token || undefined}
              disabled={disabled}
              required
            />
          </>
        )}
        {formData?.fieldErrors?.newPassword && (
          <mark>{formData.fieldErrors.newPassword}</mark>
        )}
        <label htmlFor="newPassword">New password</label>
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          aria-invalid={!!formData?.fieldErrors?.newPassword || undefined}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled} aria-busy={disabled}>
          Save new password
        </button>
      </Form>
      {formData?.success && <p>Your password has been updated.</p>}
    </AppShell>
  );
}
