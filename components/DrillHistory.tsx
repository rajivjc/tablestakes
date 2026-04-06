"use client";

import { useState, useEffect } from "react";
import { getDrillResults, clearDrillResults, type DrillResult } from "@/lib/storage";
import { DRILL_TYPES, type DrillType } from "@/lib/drillScenarios";

export default function DrillHistory() {
  const [results, setResults] = useState<DrillResult[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setResults(getDrillResults());
  }, []);

  const handleClear = () => {
    clearDrillResults();
    setResults([]);
    setShowClearConfirm(false);
  };

  // Stats
  const totalDrills = results.length;
  const avgScore = totalDrills > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalDrills)
    : 0;

  // Per-type averages
  const typeStats = DRILL_TYPES.map((dt) => {
    const typeResults = results.filter((r) => r.type === dt.type);
    const avg = typeResults.length > 0
      ? Math.round(typeResults.reduce((sum, r) => sum + r.score, 0) / typeResults.length)
      : null;
    return { ...dt, avg, count: typeResults.length };
  });

  const drillTypeBadgeColor: Record<DrillType, string> = {
    anchoring: "bg-blue-400/15 text-blue-400",
    countering: "bg-purple-400/15 text-purple-400",
    "walking-away": "bg-orange-400/15 text-orange-400",
    reframing: "bg-teal-400/15 text-teal-400",
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const relativeDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Empty state
  if (results.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="font-display text-lg text-gray-200 italic">
          No drills yet
        </p>
        <p className="text-sm text-muted">
          Complete a quick drill to start tracking your skills.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-raised border border-subtle rounded-lg p-3 text-center">
          <p className="text-xl font-display text-gray-100">{totalDrills}</p>
          <p className="text-[10px] font-mono text-muted tracking-wider uppercase">
            Total Drills
          </p>
        </div>
        <div className="bg-surface-raised border border-subtle rounded-lg p-3 text-center">
          <p className={`text-xl font-display ${scoreColor(avgScore)}`}>{avgScore}</p>
          <p className="text-[10px] font-mono text-muted tracking-wider uppercase">
            Avg Score
          </p>
        </div>
      </div>

      {/* Per-type breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {typeStats.map((ts) => (
          <div
            key={ts.type}
            className="bg-surface-raised border border-subtle rounded-lg px-3 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm shrink-0">{ts.icon}</span>
              <span className="text-xs text-gray-300 truncate">{ts.label}</span>
            </div>
            <span className={`text-xs font-mono ${ts.avg !== null ? scoreColor(ts.avg) : "text-subtle"}`}>
              {ts.avg !== null ? `${ts.avg}` : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Drill results list */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono text-muted tracking-wider uppercase">
          Past Drills
        </h3>
        {results.map((result) => (
          <div
            key={result.id}
            className="bg-surface-raised border border-subtle rounded-lg px-4 py-3 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${drillTypeBadgeColor[result.type]}`}
                >
                  {DRILL_TYPES.find((d) => d.type === result.type)?.label || result.type}
                </span>
                <span className="text-xs text-gray-400 truncate max-w-[140px]">
                  {result.scenarioTitle}
                </span>
              </div>
              <span className={`text-sm font-mono font-medium ${scoreColor(result.score)}`}>
                {result.score}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted leading-relaxed line-clamp-1 flex-1 mr-2">
                {result.verdict}
              </p>
              <span className="text-[10px] font-mono text-subtle shrink-0">
                {relativeDate(result.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Clear History */}
      <div className="pt-4">
        {showClearConfirm ? (
          <div className="bg-surface-raised border border-danger/30 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-200">
              This will delete all saved drill results. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-danger/20 text-red-400 border border-danger/30 hover:bg-danger/30 transition-colors"
              >
                Delete All
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-subtle text-muted hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full py-2.5 rounded-lg text-sm text-muted border border-subtle hover:border-danger/30 hover:text-red-400 transition-colors"
          >
            Clear Drill History
          </button>
        )}
      </div>
    </div>
  );
}
