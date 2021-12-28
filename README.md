# Welcome to Remix Auth
This project is a fully featured auth system built on [Remix](https://remix.run). It is intended to be a starting point for Remix projects needing auth systems.

## Features
#### Session based login
This project uses a combination of short-lived access tokens ([JWTs](https://jwt.io)) and long-lived sessions stored in a DB. This provides a foundation for advanced features not seen in simpler token based authentication.

#### Session management
Users can see all logged in devices and revoke access to unrecognized devices in one click. After the short-lived access token expires (configurable to seconds or minutes) that session will be redirected to the login page.

#### Two factor auth
Users can enable MFA using a QR code and authenticator (TOTP aka temporary one time password). If a user has MFA enabled they will be prompted for the token on login and when updating their password.

#### Email verification
Users will recieve an email (currently logged to the console for simplicity) with a link to verify their email after signing up.

#### Forgot password
Users can recieve an email with a link valid for 24 hours (configurable) to reset their password.
