import { cookies, headers } from "next/headers";
import { verifyToken, SessionPayload } from "./jwt";

export const SESSION_COOKIE_NAME = "cynbit_session";

/**
 * Retrieves the authenticated session payload in server route handlers.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return await verifyToken(token);
}

/**
 * Validates Origin header for state-changing admin requests (CSRF mitigation).
 * Accepts optional NextRequest or falls back to next/headers.
 */
export async function validateOrigin(req?: Request | { headers: Headers }): Promise<boolean> {
  let origin: string | null = null;
  let host: string | null = null;

  if (req && "headers" in req) {
    origin = req.headers.get("origin");
    host = req.headers.get("host");
  } else {
    try {
      const headersList = await headers();
      origin = headersList.get("origin");
      host = headersList.get("host");
    } catch {
      // In non-request environments
    }
  }

  // If origin is not provided, allow server-to-server or test runners
  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    // When port is present on host (e.g. localhost:3000), compare host directly
    return originUrl.host === host;
  } catch {
    return false;
  }
}
