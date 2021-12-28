import type { User } from "@prisma/client";
import { json, redirect } from "remix";
import invariant from "tiny-invariant";
import { getAccessTokenCookie, getRefreshTokenCookie } from "../cookies";
import { db } from "../prisma.server";
import { createAccessToken, verifyAccessToken } from "./tokens.server";

export type UserWithoutPassword = Omit<User, "hashedPassword">;

export async function getUserFromCookies(request: Request): Promise<{
  user?: { id: string; emailAddress: string };
  newResponseHeaders: Headers;
}> {
  const headers = new Headers();
  const cookieHeader = request.headers.get("Cookie");

  const userFieldsToGet = {
    emailAddress: true,
    emailAddressVerified: true,
    id: true,
    createdAt: true,
    updatedAt: true,
  };

  // Check JWT accessToken
  const existingAccessToken =
    (await getAccessTokenCookie().parse(cookieHeader)) || "";
  if (existingAccessToken) {
    const verifiedAccessToken = await verifyAccessToken(existingAccessToken);
    // If valid, get user by userID from JWT and return
    if (verifiedAccessToken) {
      console.log("Verified JWT 🪢  returning user ", verifiedAccessToken);
      invariant(typeof verifiedAccessToken.payload.sub === "string");
      invariant(typeof verifiedAccessToken.payload.emailAddress === "string");

      return {
        user: {
          id: verifiedAccessToken.payload.sub,
          emailAddress: verifiedAccessToken.payload.emailAddress,
        },
        newResponseHeaders: headers,
      };
    }
  }

  // If JWT is invalid or expired try the refresh token
  console.log("No valid JWT found. Looking for refreshToken.");
  const existingRefreshToken =
    (await getRefreshTokenCookie().parse(cookieHeader)) || "";
  // If refresh token exists, lookup the session in the DB by sessionId: refreshToken
  if (existingRefreshToken) {
    console.log(
      `Found refresh token ♻️, looking up session id: ${existingRefreshToken}`
    );
    const currentSession = await db.authSession.findUnique({
      where: {
        id: existingRefreshToken,
      },
      include: {
        user: {
          select: userFieldsToGet,
        },
      },
    });
    // If session does not exist send the user to the logout flow
    if (!currentSession) {
      throw redirect("/auth/logout");
    }
    // If the session does exist check if it is expired
    if (currentSession?.expiresAt < new Date()) {
      // If the session exists and is expired send the user to the logout flow
      console.log("Current session is expired, logging user out 👵");

      throw redirect("/auth/logout");
    }
    // If the session exists and is not expired
    console.log("refreshToken has matching authSession in DB ✅");
    // Pull the userId off the session and mint a new JWT accessToken
    const newAccessToken = await createAccessToken(
      currentSession.userId,
      currentSession.user.emailAddress
    );
    const newAccessTokenCookie = await getAccessTokenCookie().serialize(
      newAccessToken
    );

    headers.append("Set-Cookie", newAccessTokenCookie);

    return { user: currentSession.user, newResponseHeaders: headers };
  }

  // TODO: figure out how to add the new accessToken to the response headers
  // Refresh the session so it's not a long-lived bearer token?
  // If session is refreshed, mint a new refreshToken and add that to the response headers
  // Return the user and the new tokens
  return { user: undefined, newResponseHeaders: headers };
}

/**
 * Checks for JWT or valid session without refreshing headers
 * @param request the request
 * @returns true if logged in
 */
async function __isUserLoggedIn(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const accessToken = (await getAccessTokenCookie().parse(cookieHeader)) || "";
  if (accessToken) {
    const verifiedAccessToken = await verifyAccessToken(accessToken);

    if (verifiedAccessToken) {
      return true;
    } else {
      // TODO: Check refresh here if the token is just expired
      return false;
    }
  }
  const refreshToken: string | null | undefined =
    await getRefreshTokenCookie().parse(cookieHeader);
  if (refreshToken) {
    const sessionExists = await db.authSession.findUnique({
      where: {
        id: refreshToken,
      },
    });
    return !!sessionExists;
  }
  return false;
}

export async function requireUser(
  request: Request,
  redirectTo = "/signin"
): Promise<{
  user: { id: string; emailAddress: string };
  newResponseHeaders: Headers;
}> {
  const { user, newResponseHeaders } = await getUserFromCookies(request);

  if (!user) {
    throw redirect(redirectTo);
  }
  return { user, newResponseHeaders };
}
