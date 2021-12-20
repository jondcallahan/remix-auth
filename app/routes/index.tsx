import { json, LoaderFunction, useLoaderData } from "remix";
import {
  getUserFromCookies,
  UserWithoutPassword,
} from "~/utils/auth/user.server";
import type { MetaFunction } from "remix";

export const meta: MetaFunction = () => {
  return {
    title: "Auth Starter - Remix",
  };
};

export const loader: LoaderFunction = async function ({ request }) {
  console.log("request", request.body);
  const { user, newResponseHeaders } = await getUserFromCookies(request);

  return json(
    { user },
    {
      headers: newResponseHeaders,
    }
  );
};

export default function Index() {
  const { user }: { user: UserWithoutPassword | null } = useLoaderData();

  return (
    <main className="container">
      {!user && <h1>Welcome!</h1>}
      {user && (
        <hgroup>
          <h1>Welcome back!</h1>
          <h2>{user?.emailAddress}</h2>
        </hgroup>
      )}
      {user?.emailAddressVerified === false && (
        <strong>Please verify your email address</strong>
      )}
    </main>
  );
}
