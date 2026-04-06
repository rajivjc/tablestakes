/**
 * Parse a JSON response from Claude, handling markdown fences and malformed output.
 */
export function parseResponse<T>(raw: string): T | null {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON object from the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Language flag as returned by the debrief AI.
 */
export interface ParsedLanguageFlag {
  type: string;
  label: string;
  detail: string;
  turnNumber: number;
}

/**
 * Parsed drill response.
 */
export interface ParsedDrillResponse {
  score: number;
  verdict: string;
  whatWorked: string[];
  whatToImprove: string[];
}

/**
 * Parse drill grading response with safe fallbacks.
 */
export function parseDrillResponse(raw: string): ParsedDrillResponse | null {
  const parsed = parseResponse<Record<string, unknown>>(raw);
  if (!parsed || typeof parsed.score !== "number") return null;

  return {
    score: Math.max(0, Math.min(100, parsed.score)),
    verdict: typeof parsed.verdict === "string" ? parsed.verdict : "No verdict provided.",
    whatWorked: Array.isArray(parsed.whatWorked) ? (parsed.whatWorked as string[]).slice(0, 3) : [],
    whatToImprove: Array.isArray(parsed.whatToImprove) ? (parsed.whatToImprove as string[]).slice(0, 3) : [],
  };
}

/**
 * Extended debrief response with new Phase 1 fields.
 */
export interface ParsedDebrief {
  overallScore: number;
  annotations: string[];
  keyTakeaway: string;
  tacticsUsed: string[];
  missedOpportunities: string[];
  languageFlags: ParsedLanguageFlag[];
}

/**
 * Parse debrief response with safe fallbacks for new fields.
 */
export function parseDebriefResponse(raw: string): ParsedDebrief | null {
  const parsed = parseResponse<Record<string, unknown>>(raw);
  if (!parsed || typeof parsed.overallScore !== 'number') return null;

  return {
    overallScore: parsed.overallScore,
    annotations: Array.isArray(parsed.annotations) ? parsed.annotations as string[] : [],
    keyTakeaway: typeof parsed.keyTakeaway === 'string' ? parsed.keyTakeaway : '',
    tacticsUsed: Array.isArray(parsed.tacticsUsed) ? parsed.tacticsUsed as string[] : [],
    missedOpportunities: Array.isArray(parsed.missedOpportunities) ? parsed.missedOpportunities as string[] : [],
    languageFlags: Array.isArray(parsed.languageFlags)
      ? (parsed.languageFlags as ParsedLanguageFlag[]).filter(
          (f) => f && typeof f.type === 'string' && typeof f.detail === 'string'
        )
      : [],
  };
}
