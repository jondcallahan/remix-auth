import { LoaderFunction, redirect } from "remix";
import invariant from "tiny-invariant";
import { requireUser } from "~/utils/auth/user.server";
import { db } from "~/utils/prisma.server";

export const loader: LoaderFunction = async ({ request, params }) => {
  const { sessionId } = params;
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

  return redirect("/auth/sessions", { headers });
};
