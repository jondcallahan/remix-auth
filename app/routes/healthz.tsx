import { LoaderFunction } from "remix";
import { db } from "~/utils/prisma.server";

export const loader: LoaderFunction = async ({ request }) => {
  const connectedToDB: { count: number }[] = await db.$queryRaw`SELECT
  COUNT(*)
  FROM
      pg_stat_activity
  WHERE
      pg_stat_activity.state = 'active'`;

  // Test the connection to the DB by simply querying for an active connection
  if (connectedToDB[0].count) {
    return new Response("OK", { status: 200 });
  } else {
    return new Response(null, { status: 500 });
  }
};
