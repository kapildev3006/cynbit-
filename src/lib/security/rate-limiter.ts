import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { RateLimit } from "@/lib/models/RateLimit";

export interface RateLimitResult {
  success: boolean;
  count: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Database-backed salted-IP-hash rate limiter using atomic findOneAndUpdate with $inc.
 * Setting expiresAt only on document insert ($setOnInsert) ensures accurate window rolling.
 */
export async function checkRateLimit(
  ip: string,
  prefix = "submit",
  maxRequests = 5,
  windowSeconds = 900 // 15 minutes default
): Promise<RateLimitResult> {
  const salt = process.env.RATE_LIMIT_SALT || "cynbit-dev-salt-2026";
  const hashedKey = crypto
    .createHmac("sha256", salt)
    .update(`${prefix}:${ip}`)
    .digest("hex");

  await connectToDatabase();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  // Atomic findOneAndUpdate with $inc and $setOnInsert (Change #6)
  const record = await RateLimit.findOneAndUpdate(
    { hashedKey },
    {
      $setOnInsert: { expiresAt },
      $inc: { count: 1 },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  const count = record.count;
  const remaining = Math.max(0, maxRequests - count);
  const success = count <= maxRequests;

  return {
    success,
    count,
    remaining,
    resetAt: record.expiresAt,
  };
}
