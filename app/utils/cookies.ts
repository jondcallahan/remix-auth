import { createCookie } from "remix";
import invariant from "tiny-invariant";
import { getAccessTokenTimeToLive, SESSION_SECRET } from "./auth/tokens.server";

export function getAccessTokenCookie() {
  const accessTokenCookie = createCookie("accessToken", {
    httpOnly: true,
    maxAge: getAccessTokenTimeToLive(),
    path: "/",
    secure: process.env.NODE_ENV !== "development",
  });
  return accessTokenCookie;
}

export function getRefreshTokenCookie(cookieExpiresAt?: Date) {
  invariant(typeof SESSION_SECRET === "string");
  return createCookie("refreshToken", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV !== "development",
    expires: cookieExpiresAt,
    secrets: [SESSION_SECRET],
  });
}

export async function getAuthSessionIdFromCookies(
  request: Request
): Promise<string | null> {
  const session = await getRefreshTokenCookie().parse(
    request.headers.get("Cookie")
  );
  return session || null;
}

export async function removeAuthTokensFromHeaders(
  headers: Headers
): Promise<Headers> {
  const cookieHeader = headers.get("Cookie");
  if (cookieHeader) {
    // Remove any existing accessToken
    const oldAccessToken = await getAccessTokenCookie().parse(cookieHeader);
    if (oldAccessToken) {
      const accessTokenRemoval = await getAccessTokenCookie().serialize("", {
        expires: new Date(0),
        maxAge: 0,
      });
      headers.append("Set-Cookie", accessTokenRemoval);
    }

    // Remove any existing refreshToken
    const oldRefreshToken = await getRefreshTokenCookie().parse(cookieHeader);
    if (oldRefreshToken) {
      const refreshTokenRemoval = await getRefreshTokenCookie().serialize("", {
        expires: new Date(0),
        maxAge: 0,
      });
      headers.append("Set-Cookie", refreshTokenRemoval);
    }
  }

  return headers;
}

// export async function addAuthCookiesToResponse(
//   response: Response,
//   accessToken,
//   refreshToken
// ): Response {
//   const accessTokenCookie = await getAccessTokenCookie();
//   response.headers.append("Set-Cookie");
//   return response;
// }
