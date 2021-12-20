import { LoaderFunction, redirect } from "remix";
import { removeAuthSessionFromDB } from "~/utils/auth/authSession.server";
import {
  getAuthSessionIdFromCookies,
  removeAuthTokensFromHeaders,
} from "~/utils/cookies";

export const loader: LoaderFunction = async function ({ request }) {
  const redirectTo = new URL(request.url).searchParams.get("redirectTo") || "/";
  const currentAuthSessionId = await getAuthSessionIdFromCookies(request);
  if (currentAuthSessionId) {
    await removeAuthSessionFromDB(currentAuthSessionId);
  }
  const headers = await removeAuthTokensFromHeaders(request.headers);

  return redirect(redirectTo, { headers });
};
