import type { AuthSession } from "@prisma/client";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  useLoaderData,
} from "remix";
import invariant from "tiny-invariant";
import AppShell from "~/components/AppShell";
import {
  formatAuthSessionRes,
  getCurrentSessionId,
} from "~/utils/auth/authSession.server";
import { requireUser } from "~/utils/auth/user.server";
import { db } from "~/utils/prisma.server";
import { dateFormatter } from "~/utils/time";

export const meta = () => ({
  title: "Sessions",
});

export const loader: LoaderFunction = async ({ request }) => {
  const { user, newResponseHeaders: headers } = await requireUser(
    request,
    "/signin/?redirectTo=/auth/sessions"
  );
  const sessions = await db.authSession.findMany({
    where: {
      userId: user.id,
    },
  });
  const currentSessionId = await getCurrentSessionId(request);

  return json(
    { user, sessions: formatAuthSessionRes(sessions, currentSessionId) },
    { headers }
  );
};

export const action: ActionFunction = async ({ request }) => {
  if (request.method.toLowerCase() !== "delete") {
    return new Response(null, {
      status: 405,
      statusText: "METHOD NOT ALLOWED",
      headers: {
        allow: "DELETE",
      },
    });
  }

  const formBody = await request.formData();
  const sessionId = await formBody.get("sessionId");
  const { user, newResponseHeaders: headers } = await requireUser(request);

  invariant(typeof sessionId === "string");
  try {
    // Even though we're only deleting one record, use a deleteMany to use a compund filter
    // User's should only be able to delete their own sessions
    await db.authSession.deleteMany({
      where: {
        id: sessionId,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Error removing session", error);
  }
  return null;
};

export default function Sessions() {
  const data: {
    user: { userId: string; emailAddress: string };
    sessions?: any;
  } = useLoaderData();

  return (
    <AppShell user={data?.user}>
      <h1>Active sessions</h1>
      <figure>
        <table role="grid">
          <thead>
            <tr>
              <td>Created at</td>
              <td>Device</td>
              <td>IP Address</td>
              <td>Current session</td>
              <td>Sign out session</td>
            </tr>
          </thead>
          <tbody>
            {data?.sessions?.map((session) => (
              <tr key={session.id}>
                <td>{dateFormatter(new Date(session.createdAt))}</td>
                <td>
                  {session.enriched.browser.name} ({session.enriched.os.name})
                </td>
                <td>{session.ipAddress}</td>
                <td>{session.enriched.isCurrentSession && "✅"}</td>
                <td>
                  {session.enriched.isCurrentSession ? (
                    <Link to="/auth/logout">
                      <button>❌</button>
                    </Link>
                  ) : (
                    <Form method="delete">
                      <input
                        type="hidden"
                        value={session.id}
                        name="sessionId"
                      />
                      <button>❌</button>
                    </Form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    </AppShell>
  );
}
