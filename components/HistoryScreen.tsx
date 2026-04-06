"use client";

import { useState, useEffect } from "react";
import { getSessions, clearSessions, type SessionResult } from "@/lib/storage";
import { detectPatterns } from "@/lib/patterns";
import ScoreTrend from "./ScoreTrend";
import StatsRow from "./StatsRow";
import PatternInsights from "./PatternInsights";
import SessionCard from "./SessionCard";
import DrillHistory from "./DrillHistory";

interface HistoryScreenProps {
  onBack: () => void;
  onNewSession: () => void;
}

type HistoryTab = "negotiations" | "drills";

export default function HistoryScreen({ onBack, onNewSession }: HistoryScreenProps) {
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<HistoryTab>("negotiations");

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleClear = () => {
    clearSessions();
    setSessions([]);
    setShowClearConfirm(false);
  };

  const patterns = detectPatterns(sessions);

  return (
    <div className="screen-enter px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-muted hover:text-gray-200 transition-colors text-sm"
          >
            &larr;
          </button>
          <h2 className="font-display text-xl text-gray-100 italic">History</h2>
        </div>
        <button
          onClick={onNewSession}
          className="text-xs font-mono text-muted hover:text-accent transition-colors tracking-wide uppercase"
        >
          New Session
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-subtle">
        <button
          onClick={() => setActiveTab("negotiations")}
          className={`flex-1 pb-2.5 text-sm font-mono tracking-wide transition-colors ${
            activeTab === "negotiations"
              ? "text-accent border-b-2 border-accent"
              : "text-muted hover:text-gray-300"
          }`}
        >
          Negotiations
        </button>
        <button
          onClick={() => setActiveTab("drills")}
          className={`flex-1 pb-2.5 text-sm font-mono tracking-wide transition-colors ${
            activeTab === "drills"
              ? "text-accent border-b-2 border-accent"
              : "text-muted hover:text-gray-300"
          }`}
        >
          Drills
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "negotiations" && (
        <>
          {sessions.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="font-display text-lg text-gray-200 italic">
                No sessions yet
              </p>
              <p className="text-sm text-muted">
                Complete your first negotiation to start tracking your progress.
              </p>
              <button
                onClick={onNewSession}
                className="btn-primary px-6 py-3 rounded-lg text-sm tracking-wide mt-4"
              >
                Start Practicing
              </button>
            </div>
          ) : (
            <>
              {/* Section A: Performance Overview */}
              <ScoreTrend sessions={sessions} />
              <StatsRow sessions={sessions} />
              <PatternInsights insights={patterns} />

              {/* Section B: Session List */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-muted tracking-wider uppercase">
                  Past Sessions
                </h3>
                {sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>

              {/* Clear History */}
              <div className="pt-4">
                {showClearConfirm ? (
                  <div className="bg-surface-raised border border-danger/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-gray-200">
                      This will delete all saved sessions. This cannot be undone.
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
                    Clear History
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "drills" && <DrillHistory />}
    </div>
  );
}
