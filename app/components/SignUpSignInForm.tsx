import { useEffect, useRef } from "react";
import {
  Form,
  useActionData,
  useSearchParams,
  useSubmit,
  useTransition,
} from "remix";

export function SignUpSignInForm({ buttonText }: { buttonText: string }) {
  const [searchParams] = useSearchParams();
  const formData = useActionData();
  const submission = useTransition();
  const submit = useSubmit();
  const tokenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formData?.needs2faToken) {
      tokenInputRef.current?.focus();
    }
  }, [formData?.needs2faToken]);

  const disabled =
    submission.state === "submitting" ||
    (submission.state === "loading" && submission.type === "actionRedirect");

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
          disabled={disabled}
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
          disabled={disabled}
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
              disabled={disabled}
              ref={tokenInputRef}
              onPaste={(e) => {
                const value = e.clipboardData.getData("Text");
                // If user pastes the token, automatically submit the form
                if (value.length === 6) {
                  // Manually set the value to the pasted value since onPaste fires before the value changes
                  e.currentTarget.value = value;

                  submit(e.currentTarget.form);
                }
              }}
            />
          </>
        )}

        <button type="submit" aria-busy={disabled} disabled={disabled}>
          {buttonText}
        </button>
      </Form>
    </>
  );
}
