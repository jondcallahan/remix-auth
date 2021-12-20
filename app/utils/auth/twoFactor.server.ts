import { authenticator } from "otplib";

export function getTwoFactorURI(emailAddress: string) {
  // Generate a new secret, then use that to generate a QR code
  authenticator.options = {
    window: 1, // Accept 1 token in past or future to account for clock drift from client to server
  };
  const secret = authenticator.generateSecret();
  const keyURI = authenticator.keyuri(emailAddress, "Remix auth", secret);
  return { secret, keyURI };
}

// Re-export from here so the otplib isn't imported client-side
export { authenticator } from "otplib";
