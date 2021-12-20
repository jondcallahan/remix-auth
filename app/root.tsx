import {
  json,
  Link,
  Links,
  LiveReload,
  LoaderFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
} from "remix";
import {
  getUserFromCookies,
  UserWithoutPassword,
} from "./utils/auth/user.server";

export const loader: LoaderFunction = async ({ request }) => {
  // TODO: This loader is causing duplicate requests for the user, how can we combine them???
  try {
    const { user, newResponseHeaders } = await getUserFromCookies(request);
    return json({ user }, { headers: newResponseHeaders });
  } catch (error) {
    return null;
  }
};

// https://remix.run/api/conventions#default-export
// https://remix.run/api/conventions#route-filenames
export default function App() {
  const { user } = useLoaderData();
  return (
    <Document>
      <Layout user={user}>
        <Outlet context={{ user }} />
      </Layout>
    </Document>
  );
}

// https://remix.run/docs/en/v1/api/conventions#errorboundary
export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return (
    <Document title="Error!">
      <Layout>
        <div>
          <h1>There was an error</h1>
          <p>{error.message}</p>
          <hr />
          <p>
            Hey, developer, you should replace this with what you want your
            users to see.
          </p>
        </div>
      </Layout>
    </Document>
  );
}

// https://remix.run/docs/en/v1/api/conventions#catchboundary
export function CatchBoundary() {
  let caught = useCatch();

  let message;
  switch (caught.status) {
    case 401:
      message = (
        <p>
          Oops! Looks like you tried to visit a page that you do not have access
          to.
        </p>
      );
      break;
    case 404:
      message = (
        <p>Oops! Looks like you tried to visit a page that does not exist.</p>
      );
      break;

    default:
      throw new Error(caught.data || caught.statusText);
  }

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <Layout>
        <h1>
          {caught.status}: {caught.statusText}
        </h1>
        {message}
      </Layout>
    </Document>
  );
}

function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {title ? <title>{title}</title> : null}
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍾</text></svg>"
        ></link>
        <link
          rel="stylesheet"
          href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}

function Layout({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: UserWithoutPassword | null;
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
      {children}
    </>
  );
}
