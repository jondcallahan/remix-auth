import { hash } from "bcryptjs";
import crypto from "crypto";

/**
 * Hashes a token using sha512
 * @param token token
 * @returns
 */
export function hashToken(token: string) {
  const hash = crypto.createHash("sha512").update(token, "utf-8");
  return hash.digest("hex");
}

/**
 * Hashes and salts a password using a work factor of 12
 * NOTE: Increment the work factor by 1 every time compute power doubles
 * Roughly every 18 months from Jan 1, 2022
 * @param password password
 * @returns string
 */
export async function hashPassword(password: string) {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
}
