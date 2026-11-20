import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "cynbit-secret-key-32-chars-long-minimum-length!"
);

/**
 * Signs a JWT session token with an 8-hour expiry.
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

/**
 * Verifies and decodes a JWT session token.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as "ADMIN" | "MEMBER",
    };
  } catch {
    return null;
  }
}
