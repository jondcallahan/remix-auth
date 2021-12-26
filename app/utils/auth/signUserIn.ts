import { getClientIp } from "@supercharge/request-ip/dist";
import { redirect } from "remix";
import { getAccessTokenCookie, getRefreshTokenCookie } from "../cookies";
import { db } from "../prisma.server";
import { get30DaysFromNow } from "../time";
import { createAccessToken, createRefreshToken } from "./tokens.server";

export async function signUserIn(
  user: { userId: string; emailAddress: string },
  redirectTo: string,
  request: Request
) {
  const headers = new Headers();
  const { userId, emailAddress } = user;

  // Mint a new JWT 🍀
  const jwt: string = await createAccessToken(userId, emailAddress);

  // Add the new JWT to cookies
  const jwtCookie = await getAccessTokenCookie().serialize(jwt);
  headers.append("Set-Cookie", jwtCookie);

  // Create a new AuthSession (refreshToken) in DB

  // Expire the session in db and in cookie in 30 days
  // TODO: Implement a remember me? checkbox to toggle between 1 day and 30 days
  const refreshTokenExpires = get30DaysFromNow();

  // refreshToken should be the session ID in the db
  const refreshToken = await createRefreshToken(
    userId,
    request,
    refreshTokenExpires
  );

  const refreshTokenCookie = await getRefreshTokenCookie(
    refreshTokenExpires
  ).serialize(refreshToken);

  // Add the new refreshToken to the cookies
  headers.append("Set-Cookie", refreshTokenCookie);

  // Send the user to redirectTo with auth cookies added
  return redirect(redirectTo, { headers });
}
