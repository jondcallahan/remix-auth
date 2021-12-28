import invariant from "tiny-invariant";
import crypto from "crypto";
import { jwtVerify, SignJWT } from "jose";
import { db } from "../prisma.server";
import { getClientIp } from "@supercharge/request-ip";
import { getRequestIpAddress } from "../net";

export const { SESSION_SECRET } = process.env;

if (!SESSION_SECRET) {
  throw new Error("Server must have SESSION_SECRET env var");
}

async function getJWTSigningKey() {
  invariant(typeof SESSION_SECRET === "string");
  const secretKey = crypto.createSecretKey(Buffer.from(SESSION_SECRET));
  return secretKey;
}

/**
 * Returns 30 for dev, 180 for prod
 * @returns {number} Number of seconds for the access token to live
 */
export function getAccessTokenTimeToLive() {
  const isProd = process.env.NODE_ENV !== "development";
  return isProd ? 180 : 30;
}

export async function createAccessToken(userId: string, emailAddress: string) {
  console.log("// Mint a new JWT 🍀");
  const key = await getJWTSigningKey();
  const expirationTime = `${getAccessTokenTimeToLive()}s`;

  const token = new SignJWT({ emailAddress })
    .setProtectedHeader({ alg: "HS512", typ: "jwt" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .setSubject(userId)
    .sign(key);
  return token;
}

export async function verifyAccessToken(token: string) {
  try {
    const verified = await jwtVerify(token, await getJWTSigningKey(), {});
    return verified;
  } catch (error) {
    console.error("error", error);
    return null;
  }
}

export async function createRefreshToken(
  userId: string,
  request: Request,
  expiresAt: Date
) {
  const ipAddress = getClientIp(request) ?? getRequestIpAddress(request) ?? "";
  console.log("🔎 getClientIp ", getClientIp(ipAddress));
  console.log("🔎 getRequestIpAddress", getRequestIpAddress(request));

  const userAgent = request.headers.get("user-agent") || "";

  const storedSession = await db.authSession.create({
    data: {
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });
  return storedSession.id;
}
/**
 *
 * @returns {string} 64 byte random string
 */
export function createResetPasswordToken() {
  const token = crypto.randomBytes(64).toString("hex");
  return token;
}
