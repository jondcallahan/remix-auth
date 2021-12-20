import { Form, useActionData, useSearchParams, useTransition } from "remix";

export function SignUpSignInForm({ buttonText }: { buttonText: string }) {
  const [searchParams] = useSearchParams();
  const formData = useActionData();
  console.log("formData", formData);
  const submission = useTransition();

  return (
    <>
      {formData?.formError && <mark>{formData.formError}</mark>}
      <Form method="post">
        <input
          type="hidden"
          name="redirectTo"
          value={searchParams.get("redirectTo") ?? undefined}
        />

        {formData?.fieldErrors?.email && (
          <mark>{formData.fieldErrors.email}</mark>
        )}
        <label htmlFor="email" aria-required>
          Email address
        </label>
        <input
          type="email"
          name="email"
          aria-invalid={!!formData?.fieldErrors?.email || undefined}
          disabled={
            submission.state === "submitting" || submission.state === "loading"
          }
        />

        {formData?.fieldErrors?.password && (
          <mark>{formData.fieldErrors.password}</mark>
        )}
        <label htmlFor="password" aria-required>
          Password
        </label>
        <input
          type="password"
          name="password"
          aria-invalid={!!formData?.fieldErrors?.password || undefined}
          disabled={
            submission.state === "submitting" || submission.state === "loading"
          }
        />

        {formData?.fieldErrors?.token && (
          <mark>{formData.fieldErrors.token}</mark>
        )}
        {formData?.needs2faToken && (
          <>
            <label htmlFor="token" aria-required>
              Two factor authentication token
            </label>
            <input
              type="text"
              name="token"
              placeholder="123456"
              autoComplete="one-time-code"
              aria-invalid={!!formData?.fieldErrors?.token || undefined}
              disabled={
                submission.state === "submitting" ||
                submission.state === "loading"
              }
            />
          </>
        )}

        <button
          type="submit"
          aria-busy={
            submission.state === "submitting" || submission.state === "loading"
          }
          disabled={
            submission.state === "submitting" || submission.state === "loading"
          }
        >
          {buttonText}
        </button>
      </Form>
    </>
  );
}
