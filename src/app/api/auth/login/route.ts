import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { signToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME, validateOrigin } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { hasNoSqlInjectionKeys } from "@/lib/security/sanitize";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await validateOrigin(req))) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const rawBody = await req.json();

    if (hasNoSqlInjectionKeys(rawBody)) {
      return NextResponse.json({ error: "Invalid payload format." }, { status: 400 });
    }

    // Rate limiting for admin login (max 5 attempts per 15 minutes)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateResult = await checkRateLimit(clientIp, "admin_login", 5, 900);
    if (!rateResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const parsed = LoginSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password format." }, { status: 400 });
    }

    const { email, password } = parsed.data;

    await connectToDatabase();

    const user = await User.findOne({ email, active: true });
    if (!user) {
      // Generic error message for security
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Constant-time bcrypt hash comparison
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signToken({
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // 8-hour secure, httpOnly session cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Authentication service unavailable." }, { status: 500 });
  }
}
