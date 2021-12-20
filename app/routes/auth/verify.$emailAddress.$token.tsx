import { Link, useLoaderData } from "remix";
import type { LoaderFunction } from "remix";
import { verifyUserEmail } from "~/utils/auth/verifyEmail.server";

export const loader: LoaderFunction = async ({ params }) => {
  const { emailAddress, token } = params;
  if (!emailAddress || !token) {
    return { error: "Missing email address or token" };
  }

  const isVerified = await verifyUserEmail(token, emailAddress);

  if (!isVerified) return { error: "Invalid token" };

  return { isVerified };
};

export default function VerifyEmail() {
  const { isVerified, error } = useLoaderData();

  let content;
  if (isVerified) {
    content = <h1>Thank you for verifying your email!</h1>;
  } else {
    content = <pre>{JSON.stringify(error)}</pre>;
  }

  return (
    <main className="container">
      {content}
      <Link to="/">Home</Link>
    </main>
  );
}
