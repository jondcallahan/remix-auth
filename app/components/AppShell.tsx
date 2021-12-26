import type { ReactNode } from "react";
import { Link } from "remix";

export default function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user?: { emailAddress: string };
}) {
  return (
    <>
      <nav className="container-fluid">
        <ul>
          <li>
            <Link to="/" className="contrast">
              Remix Auth Starter
            </Link>
          </li>
        </ul>
        <ul>
          {!!user && (
            <>
              <li>{user.emailAddress}</li>
              <li>
                <Link to="/auth/update-password">Update password</Link>
              </li>
              <li>
                <Link to="/auth/register-2fa">2FA</Link>
              </li>
              <li>
                <Link to="/auth/sessions">Sessions</Link>
              </li>
              <li>
                <Link to="/auth/logout">Sign out</Link>
              </li>
            </>
          )}
          {!!user || (
            <>
              <li>
                <Link to="/signin">Sign in</Link>
              </li>
              <li>
                <Link to="/signup">Sign up</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      <hr />
      <main className="container">{children}</main>
    </>
  );
}
