import crypto from "crypto";
import { hashToken } from "../hash.server";
import { db } from "../prisma.server";

export function createVerifyEmailToken(email: string) {
  const authString = `${process.env.VERIFY_EMAIL_SECRET}:${email}`;
  return hashToken(authString);
}

export async function createVerifyEmailLink(email: string) {
  try {
    // Create token
    const emailToken = await createVerifyEmailToken(email);
    // Encode url string
    const URIEncodedEmail = encodeURIComponent(email);
    // Return link for verification
    return `http://localhost:3000/auth/verify/${URIEncodedEmail}/${emailToken}`;
  } catch (error) {
    console.error("error", error);
  }
}

export async function verifyUserEmail(token: string, email: string) {
  //
  try {
    // Recreate the hash based on the email received
    const emailToken = await createVerifyEmailToken(email);
    // Compare our new hash (token) with the one received
    const isValid = emailToken === token;
    // If the two are equal then it is a valid verification token
    if (isValid) {
      // Update user, make them verified
      await db.user.update({
        where: {
          emailAddress: email,
        },
        data: {
          emailAddressVerified: true,
        },
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("error", error);
    return false;
  }
}
