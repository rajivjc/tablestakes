/**
 * Pattern detection for session history.
 * Pure functions — no side effects.
 */

import type { SessionResult } from './storage';

export interface PatternInsight {
  type: 'streak' | 'weakness' | 'strength' | 'improvement' | 'decline';
  message: string;
}

function stdDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

export function detectPatterns(sessions: SessionResult[]): PatternInsight[] {
  if (sessions.length < 3) return [];

  const insights: PatternInsight[] = [];
  const scores = sessions.map((s) => s.score);
  // sessions are newest-first, so last 3 = [0], [1], [2]
  const last3 = scores.slice(0, 3);

  // 1. Improving trend (newest > middle > oldest)
  if (last3[0] > last3[1] && last3[1] > last3[2]) {
    insights.push({
      type: 'improvement',
      message: "You're on a roll — scores improving over your last 3 sessions.",
    });
  }

  // 2. Declining trend
  if (last3[0] < last3[1] && last3[1] < last3[2]) {
    insights.push({
      type: 'decline',
      message: 'Scores have dipped in your last 3 sessions. Try a different approach.',
    });
  }

  // 3. Strategy weakness — group by strategy
  const strategyGroups = new Map<string, { name: string; scores: number[] }>();
  for (const s of sessions) {
    const group = strategyGroups.get(s.strategy.id) || { name: s.strategy.name, scores: [] };
    group.scores.push(s.score);
    strategyGroups.set(s.strategy.id, group);
  }

  for (const [, group] of strategyGroups) {
    if (group.scores.length >= 3) {
      const avg = group.scores.reduce((a, b) => a + b, 0) / group.scores.length;
      if (avg < 45) {
        insights.push({
          type: 'weakness',
          message: `You tend to struggle against ${group.name} opponents. Practice more against this style.`,
        });
      }
    }
  }

  // 4. Strategy strength
  for (const [, group] of strategyGroups) {
    if (group.scores.length >= 3) {
      const avg = Math.round(group.scores.reduce((a, b) => a + b, 0) / group.scores.length);
      if (avg > 70) {
        insights.push({
          type: 'strength',
          message: `You handle ${group.name} opponents well — avg score ${avg}.`,
        });
      }
    }
  }

  // 5. High score streak
  if (last3.every((s) => s > 70)) {
    insights.push({
      type: 'streak',
      message: 'Strong streak — 3 sessions above 70 in a row.',
    });
  }

  // 6. Low score streak
  if (last3.every((s) => s < 40)) {
    insights.push({
      type: 'streak',
      message: 'Tough stretch. Review your past debriefs for common patterns.',
    });
  }

  // 7. Consistency (last 5 scores)
  if (scores.length >= 5) {
    const last5 = scores.slice(0, 5);
    const sd = stdDeviation(last5);
    if (sd < 8) {
      insights.push({
        type: 'streak',
        message: 'Very consistent performance — your scores barely vary.',
      });
    }
    // 8. Volatility
    if (sd > 25) {
      insights.push({
        type: 'streak',
        message: 'Your scores swing a lot. Your approach may depend too much on the scenario.',
      });
    }
  }

  // Sort: streaks first, then strategy-specific, then statistical
  const typeOrder: Record<string, number> = {
    improvement: 0,
    decline: 0,
    streak: 1,
    weakness: 2,
    strength: 2,
  };

  insights.sort((a, b) => (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3));

  return insights.slice(0, 3);
}
