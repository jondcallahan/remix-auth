import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  useLoaderData,
  redirect,
  useActionData,
  Outlet,
} from "remix";
import invariant from "tiny-invariant";
import AppShell from "~/components/AppShell";
import { authenticator, getTwoFactorURI } from "~/utils/auth/twoFactor.server";
import { requireUser } from "~/utils/auth/user.server";
import { authenticateUser } from "~/utils/auth/authSession.server";
import { badRequest } from "~/utils/net";
import { db } from "~/utils/prisma.server";

export const meta = () => ({ title: "Two-factor Authentication | Remix Auth" });

export const loader: LoaderFunction = async ({ request }) => {
  const { user, newResponseHeaders: headers } = await requireUser(
    request,
    "/signin?redirectTo=/auth/register-2fa"
  );

  // Refactor this when users can have multiple 2FA strategies
  const current2fa = await db.twoFactorAuthTokens.findUnique({
    where: {
      userId: user.id,
    },
  });
  const has2fa = !!current2fa;
  if (!has2fa) {
    const { secret, keyURI } = getTwoFactorURI(user.emailAddress);

    return json({ user, has2fa, secret, keyURI }, { headers });
  }
  return json({ user, has2fa }, { headers });
};

export const action: ActionFunction = async ({ request }) => {
  const { user, newResponseHeaders: headers } = await requireUser(
    request,
    "/signin?redirectTo=/auth/register-2fa"
  );

  const form = await request.formData();
  const token = form.get("token");
  const secret = form.get("secret");

  if (request.method.toLowerCase() === "delete") {
    const password = form.get("password");
    if (!password) {
      return badRequest({ error: "Password required" }, headers);
    }
    invariant(typeof password === "string");
    const { userId: authenticatedUser } = await authenticateUser({
      email: user.emailAddress,
      rawPassword: password,
    });
    if (!authenticatedUser) {
      return badRequest({ error: "Incorrect password" }, headers);
    }
    await db.twoFactorAuthTokens.delete({
      where: {
        userId: user.id,
      },
    });
    return redirect("/auth/register-2fa/success/delete", { headers });
  }

  if (!token || !secret) {
    return badRequest({ error: "Code required" }, headers);
  }

  invariant(typeof token === "string");
  invariant(typeof secret === "string");

  const isTokenValid = authenticator.check(token, secret);

  if (isTokenValid) {
    await db.twoFactorAuthTokens.create({
      data: {
        userId: user.id,
        strategy: "AUTHENTICATOR",
        secret,
      },
    });

    return redirect("/auth/register-2fa/success/added", { headers });
  } else {
    return badRequest({ error: "Invalid auth token. Try again." }, headers);
  }
};

export default function Register2FA() {
  const data = useLoaderData();
  const actionRes = useActionData();

  return (
    <AppShell user={data?.user}>
      <h1>Manage 2FA!</h1>
      <Outlet />
      {actionRes?.error && <mark>{actionRes.error}</mark>}
      {data?.has2fa && (
        <>
          <p>Remove 2FA</p>
          <Form method="delete">
            <label htmlFor="password">Password</label>
            <input type="password" name="password" />
            <button type="submit">Remove 2FA</button>
          </Form>
        </>
      )}
      {!data?.has2fa && <p>Scan QR code with your authenticator app</p>}
      {data?.keyURI && (
        <>
          <img
            src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(
              data.keyURI
            )}&choe=UTF-8`}
            alt={data.keyURI}
            height={300}
            width={300}
          />
          <Form method="post">
            <input type="hidden" name="secret" value={data.secret} />
            <label htmlFor="token">Code</label>
            <input
              type="text"
              name="token"
              placeholder="123456"
              autoComplete="one-time-code"
              inputMode="numeric"
              autoFocus
            />
            <button type="submit">Enable 2FA</button>
          </Form>
        </>
      )}
    </AppShell>
  );
}
