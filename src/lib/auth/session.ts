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
 */
export async function validateOrigin(): Promise<boolean> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const host = headersList.get("host");

  if (!origin) {
    // Some server-to-server or test environments omit origin
    return true;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
