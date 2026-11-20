/**
 * Normalizes phone numbers to standard E.164 format.
 * Defaults to India (+91) if a 10-digit number is provided without a country prefix.
 */
export function normalizeToE164(phone: string, defaultCountryCode = "+91"): string {
  if (!phone) return "";

  // Remove whitespace, dashes, parentheses, dots
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "").trim();

  // If already starts with '+', keep country prefix
  if (cleaned.startsWith("+")) {
    const digitsOnly = cleaned.slice(1).replace(/\D/g, "");
    return `+${digitsOnly}`;
  }

  // If starts with '00', replace with '+'
  if (cleaned.startsWith("00")) {
    const digitsOnly = cleaned.slice(2).replace(/\D/g, "");
    return `+${digitsOnly}`;
  }

  // If 10 digits (standard Indian number without prefix)
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    return `${defaultCountryCode}${digitsOnly}`;
  }

  // If 12 digits starting with 91
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}

/**
 * Validates whether a phone number matches standard E.164 format (+[1-9]\d{6,14}).
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Extracts raw digits only for fast indexed searching.
 */
export function extractPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
