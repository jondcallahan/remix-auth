import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  useLoaderData,
} from "remix";
import invariant from "tiny-invariant";
import { authenticator, getTwoFactorURI } from "~/utils/auth/twoFactor.server";
import { requireUser } from "~/utils/auth/user.server";
import { badRequest } from "~/utils/net";
import { db } from "~/utils/prisma.server";

export const loader: LoaderFunction = async ({ request }) => {
  const { user, newResponseHeaders } = await requireUser(
    request,
    "/signin?redirectTo=/auth/register-2fa"
  );
  if (user) {
    // TODO: Refactor this when user's can have multiple 2FA strategies
    const current2fa = await db.twoFactorAuthTokens.findUnique({
      where: {
        userId: user.id,
      },
    });
    const has2fa = !!current2fa;
    if (!has2fa) {
      const { secret, keyURI } = getTwoFactorURI(user.emailAddress);
      return json(
        { user, has2fa, secret, keyURI },
        { headers: newResponseHeaders }
      );
    }
    return json({ user, has2fa }, { headers: newResponseHeaders });
  }
  return json({ user }, { headers: newResponseHeaders });
};

export const action: ActionFunction = async ({ request }) => {
  // JON YOU LEFT OFF HERE: ADD A VERIFY FLOW
  const { user, newResponseHeaders: headers } = await requireUser(
    request,
    "/signin?redirectTo=/auth/register-2fa"
  );

  const form = await request.formData();
  const token = form.get("token");
  const secret = form.get("secret");

  if (!token || !secret) {
    // TODO: Clean this up
    return new Response(badRequest({ error: "Code required" }).body, {
      headers,
    });
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
    return json({ success: true }, { headers });
  }
  return json({ isTokenValid });
};

export default function Register2FA() {
  const data = useLoaderData();
  // TODO: Add everything but the happy path
  return (
    <main className="container">
      <h1>Add 2FA!</h1>
      {data?.has2fa && <p>Verify your 2fa</p>}
      {!data?.has2fa && <p>Register your 2fa</p>}
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
            />
            <button type="submit">Register 2FA</button>
          </Form>
        </>
      )}
    </main>
  );
}
