"use client";

import { useState } from "react";
import type { SessionResult } from "@/lib/storage";

interface SessionCardProps {
  session: SessionResult;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scoreColor(score: number): string {
  if (score > 70) return "text-emerald-400";
  if (score >= 40) return "text-accent";
  return "text-red-400";
}

const flagBadgeColor: Record<string, string> = {
  assertive: "bg-emerald-400/15 text-emerald-400",
  specific: "bg-emerald-400/15 text-emerald-400",
  hedging: "bg-amber-400/15 text-amber-400",
  vague: "bg-amber-400/15 text-amber-400",
  emotional: "bg-red-400/15 text-red-400",
};

export default function SessionCard({ session }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface-raised border border-subtle rounded-lg overflow-hidden session-card-enter">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        {/* Score */}
        <span className={`text-2xl font-display italic ${scoreColor(session.score)} min-w-[2.5rem]`}>
          {session.score}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 truncate">
            {session.scenario.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-subtle/50 text-muted">
              {session.strategy.name}
            </span>
            {session.difficulty && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                session.difficulty === "easy"
                  ? "bg-emerald-400/15 text-emerald-400"
                  : session.difficulty === "hard"
                    ? "bg-red-400/15 text-red-400"
                    : "bg-amber-400/15 text-amber-400"
              }`}>
                {session.difficulty === "easy" ? "Easy" : session.difficulty === "hard" ? "Hard" : "Medium"}
              </span>
            )}
            {session.curveballLabel && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-400/15 text-red-400">
                {session.curveballLabel}
              </span>
            )}
            <span className="text-[10px] text-subtle">
              {formatRelativeDate(session.timestamp)}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <span
          className={`text-muted text-xs transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          ▸
        </span>
      </button>

      {/* Expanded debrief */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-subtle/30">
          {/* Summary / Key Takeaway */}
          {session.debrief.keyTakeaway && (
            <div className="bg-surface-overlay border border-accent/20 rounded-lg p-3">
              <p className="text-xs font-mono text-accent tracking-wider uppercase mb-1">
                Key Takeaway
              </p>
              <p className="text-sm text-gray-200 leading-relaxed">
                {session.debrief.keyTakeaway}
              </p>
            </div>
          )}

          {/* Annotations */}
          {session.debrief.annotations.length > 0 && (
            <div>
              <p className="text-xs font-mono text-muted tracking-wider uppercase mb-2">
                Turn-by-Turn
              </p>
              <div className="space-y-1.5">
                {session.debrief.annotations.map((a, i) => (
                  <p key={i} className="text-xs text-gray-400 leading-relaxed">
                    {a.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Tactics Used */}
          {session.debrief.tacticsUsed.length > 0 && (
            <div>
              <p className="text-xs font-mono text-muted tracking-wider uppercase mb-2">
                Tactics Identified
              </p>
              <ul className="space-y-1">
                {session.debrief.tacticsUsed.map((t, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                    <span className="text-accent mt-0.5 shrink-0">·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missed Opportunities */}
          {session.debrief.missedOpportunities.length > 0 && (
            <div>
              <p className="text-xs font-mono text-muted tracking-wider uppercase mb-2">
                Missed Opportunities
              </p>
              <ul className="space-y-1">
                {session.debrief.missedOpportunities.map((m, i) => (
                  <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                    <span className="text-subtle mt-0.5 shrink-0">·</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Plan Adherence */}
          {session.planAdherence && (
            <div className="space-y-2 pt-2 border-t border-subtle">
              <p className="text-xs font-mono text-muted tracking-wider uppercase">
                Plan Adherence: <span className={scoreColor(session.planAdherence.score)}>{session.planAdherence.score}</span>
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {session.planAdherence.assessment}
              </p>
            </div>
          )}

          {/* Language Flags */}
          {session.debrief.languageFlags.length > 0 && (
            <div>
              <p className="text-xs font-mono text-muted tracking-wider uppercase mb-2">
                Language Analysis
              </p>
              <div className="space-y-1.5">
                {session.debrief.languageFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${flagBadgeColor[flag.type] || "bg-subtle/50 text-muted"}`}
                    >
                      {flag.label}
                    </span>
                    <span className="text-xs text-gray-400 leading-relaxed">
                      {flag.detail}
                      <span className="text-subtle ml-1">Turn {flag.turnNumber}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
