/**
 * localStorage-based session history for TableStakes.
 * All functions fail silently if localStorage is unavailable.
 */

export interface Annotation {
  turnNumber: number;
  text: string;
}

export interface LanguageFlag {
  type: 'hedging' | 'assertive' | 'emotional' | 'vague' | 'specific';
  label: string;
  detail: string;
  turnNumber: number;
}

export interface TurnRecord {
  turnNumber: number;
  userMessage: string;
  aiResponse: string;
  momentum: number;
}

export interface SessionResult {
  id: string;
  timestamp: string;
  scenario: {
    title: string;
    description: string;
    isCustom: boolean;
  };
  strategy: {
    id: string;
    name: string;
  };
  score: number;
  momentum: number[];
  turns: TurnRecord[];
  debrief: {
    summary: string;
    annotations: Annotation[];
    tacticsUsed: string[];
    missedOpportunities: string[];
    languageFlags: LanguageFlag[];
    keyTakeaway: string;
  };
}

const STORAGE_KEY = 'tablestakes_sessions';
const MAX_SESSIONS = 50;

export function isStorageAvailable(): boolean {
  try {
    const testKey = '__tablestakes_test__';
    localStorage.setItem(testKey, '1');
    localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function saveSession(result: SessionResult): void {
  try {
    if (!isStorageAvailable()) return;
    const sessions = getSessions();
    sessions.unshift(result);
    if (sessions.length > MAX_SESSIONS) {
      sessions.length = MAX_SESSIONS;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Fail silently
  }
}

export function getSessions(): SessionResult[] {
  try {
    if (!isStorageAvailable()) return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionResult[];
  } catch {
    return [];
  }
}

export function getSession(id: string): SessionResult | null {
  try {
    const sessions = getSessions();
    return sessions.find((s) => s.id === id) || null;
  } catch {
    return null;
  }
}

export function clearSessions(): void {
  try {
    if (!isStorageAvailable()) return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Fail silently
  }
}
