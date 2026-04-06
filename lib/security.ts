/**
 * Security utilities for input validation and output sanitization.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above/i,
  /you\s+are\s+now/i,
  /act\s+as\s+(a|an)\s+/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /\<\/?system\>/i,
  /\<\/?instructions?\>/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /bypass\s+(safety|filters?|restrictions?)/i,
];

export function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

const PII_PATTERNS: [RegExp, string][] = [
  [/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, "[SSN_REDACTED]"],
  [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[CARD_REDACTED]"],
  [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    "[EMAIL_REDACTED]",
  ],
  [/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE_REDACTED]"],
];

export function redactPII(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function validateInput(input: string): {
  valid: boolean;
  reason?: string;
} {
  if (!input || input.trim().length === 0) {
    return { valid: false, reason: "Message cannot be empty." };
  }
  if (input.length > 2000) {
    return { valid: false, reason: "Message too long. Keep it under 2000 characters." };
  }
  if (detectInjection(input)) {
    return { valid: false, reason: "Invalid input detected." };
  }
  return { valid: true };
}
