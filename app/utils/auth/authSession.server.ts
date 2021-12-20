import { compare } from "bcryptjs";
import { hashPassword } from "../hash.server";
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
  newPassword: string
) {
  const { userId } = await authenticateUser({
    email,
    rawPassword: currentPassword,
  });

  if (userId) {
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
  return false;
}

export async function removeAuthSessionFromDB(id: string) {
  try {
    await db.authSession.delete({ where: { id } });
  } catch (error) {
    console.error("removeAuthSessionFromDB error", error);
  }
}
