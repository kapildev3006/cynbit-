import crypto from "crypto";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Omits ambiguous chars: 0, O, 1, I

/**
 * Generates a human-readable unique reference ID in the format CYN-XXXXXX.
 */
export function generateReferenceId(): string {
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `CYN-${code}`;
}
