import { AuthSession } from "@prisma/client";
import { compare } from "bcryptjs";
import uaParser from "ua-parser-js";
import { getRefreshTokenCookie } from "../cookies";
import { hashPassword } from "../hash.server";
import { authenticator } from "./twoFactor.server";
import { db } from "../prisma.server";

type AuthForm = {
  email: string;
  rawPassword: string;
};

/**
 * Takes in an email and plaintext password, hashes and salts the pw, and stores the user
 * @param {AuthForm} obj the input
 * @returns {Promise<User>} a user
 */
export async function createUser({ email, rawPassword }: AuthForm) {
  const hashedPassword = await hashPassword(rawPassword);
  return await db.user.create({
    data: {
      emailAddress: email,
      hashedPassword,
    },
  });
}

export async function authenticateUser({ email, rawPassword }: AuthForm) {
  console.log("/// Authenticate user");

  const user = await db.user.findUnique({
    where: {
      emailAddress: email,
    },
    select: {
      hashedPassword: true,
      id: true,
    },
  });

  // Note: This function is vulnerable to disclosing that an
  // email address DOES exist in our system via timing attack.
  // Consider taking constant time for this function to mitigate the
  // threat of exposing which emails exist in our DB. Timing attacks
  // are reduced, but not eliminated by comparing a string rather than
  // returning early
  const passwordToCompare = user?.hashedPassword || "reduce-timing-attacks";
  const isAuthenticated = await compare(rawPassword, passwordToCompare);
  if (isAuthenticated) {
    return { userId: user?.id };
  } else {
    return { userId: null };
  }
}
/**
 *
 * @param email user's email
 * @param currentPassword user's current password
 * @param newPassword target password
 * @returns true if update succeeds, false if not
 */
export async function updateUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
  token?: string
) {
  const { userId } = await authenticateUser({
    email,
    rawPassword: currentPassword,
  });

  if (!userId) {
    throw { errorType: "INCORRECT_PASSWORD" };
  }

  const has2FA = await db.twoFactorAuthTokens.findFirst({
    where: {
      userId,
    },
  });

  if (!!has2FA) {
    if (!token) {
    }
    const isValidToken = await authenticator.check(token, has2FA.secret);
    if (!isValidToken) {
      throw { errorType: "INVALID_TOKEN" };
    }
  }
  const hashedPassword = await hashPassword(newPassword);
  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      hashedPassword,
    },
  });
  return true;
}

export async function removeAuthSessionFromDB(id: string) {
  try {
    return await db.authSession.delete({ where: { id } });
  } catch (error) {
    console.error("removeAuthSessionFromDB error", error);
  }
}

export function formatAuthSessionRes(
  sessions: AuthSession[],
  currentSessionId: string
) {
  return sessions.map((session) => {
    const { os, browser } = uaParser(session.userAgent);

    return {
      ...session,
      enriched: {
        os,
        browser,
        isCurrentSession: session.id === currentSessionId,
      },
    };
  });
}

export async function getCurrentSessionId(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  return await getRefreshTokenCookie().parse(cookieHeader);
}
