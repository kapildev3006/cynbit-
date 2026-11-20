import crypto from "crypto";
import { NextRequest } from "next/server";
import { connectToDatabase } from "./db";
import { RateLimit } from "./models/RateLimit";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  retryAfterSeconds?: number;
}

const MAX_REQUESTS_PER_WINDOW = 5; // Allow 5 blueprint requests per 60s window

/**
 * Extracts client IP from standard proxy and edge headers.
 */
export function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take first IP in chain
    const clientIp = forwarded.split(",")[0].trim();
    if (clientIp) return clientIp;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Creates a one-way salted SHA-256 hash of the client IP.
 * The raw IP is NEVER stored in MongoDB or logged to any stream.
 */
export function hashIp(clientIp: string): string {
  const salt = process.env.RATE_LIMIT_SALT || "cynbit-blueprint-salt-2025-prod";
  return crypto.createHash("sha256").update(`${clientIp}:${salt}`).digest("hex");
}

/**
 * Evaluates rate limit against MongoDB TTL collection.
 * Gracefully permits requests if MongoDB is offline or unavailable.
 */
export async function checkRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const clientIp = extractClientIp(req);
  const ipHash = hashIp(clientIp);

  try {
    const db = await connectToDatabase();
    if (!db) {
      // Database not connected; permit request so users are never blocked
      return { allowed: true, count: 1 };
    }

    const existingRecord = await RateLimit.findOne({ ipHash });

    if (existingRecord) {
      if (existingRecord.count >= MAX_REQUESTS_PER_WINDOW) {
        return {
          allowed: false,
          count: existingRecord.count,
          retryAfterSeconds: 60,
        };
      }

      existingRecord.count += 1;
      await existingRecord.save();
      return { allowed: true, count: existingRecord.count };
    }

    // New rate limit window entry
    await RateLimit.create({
      ipHash,
      count: 1,
      createdAt: new Date(),
    });

    return { allowed: true, count: 1 };
  } catch (err) {
    // If rate limiting check fails due to DB error, log non-PII warning and allow
    console.warn("[RATE_LIMIT] Rate limiter check error, bypassing gracefully:", err);
    return { allowed: true, count: 1 };
  }
}
