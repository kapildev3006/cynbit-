/**
 * Sanitizes input to prevent NoSQL injection attacks.
 * Rejects operator keys (keys starting with '$' or containing '.').
 */
export function hasNoSqlInjectionKeys(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => hasNoSqlInjectionKeys(item));
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key.startsWith("$") || key.includes(".")) {
      return true;
    }
    if (value && typeof value === "object") {
      if (hasNoSqlInjectionKeys(value)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Escapes characters for safe usage in anchored, case-insensitive regular expressions.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Escapes CSV values to prevent formula injection in spreadsheet software (Excel, LibreOffice).
 * Neutralizes leading '=', '+', '-', '@', '\t', '\r'.
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value).trim();
  if (
    str.startsWith("=") ||
    str.startsWith("+") ||
    str.startsWith("-") ||
    str.startsWith("@") ||
    str.startsWith("\t") ||
    str.startsWith("\r")
  ) {
    // Prefix with single quote to force text evaluation
    return `"'${str.replace(/"/g, '""')}"`;
  }
  // Wrap in quotes if it contains commas, quotes or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
