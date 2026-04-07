"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type DrillScenario, type DrillType, getRandomDrillScenario, DRILL_TYPES } from "@/lib/drillScenarios";
import { saveDrillResult, isStorageAvailable } from "@/lib/storage";
import ChatBubble, { TypingIndicator } from "@/components/ChatBubble";

interface DrillActiveProps {
  drillType: DrillType;
  onBack: () => void;
  onBackToDrills: () => void;
}

const PLACEHOLDER_TEXT: Record<DrillType, string> = {
  anchoring: "Make your opening move...",
  countering: "Push back...",
  "walking-away": "How do you respond?",
  reframing: "Shift the frame...",
};

interface DrillDebrief {
  score: number;
  verdict: string;
  whatWorked: string[];
  whatToImprove: string[];
}

export default function DrillActive({ drillType, onBack, onBackToDrills }: DrillActiveProps) {
  const [scenario, setScenario] = useState<DrillScenario>(() =>
    getRandomDrillScenario(drillType)
  );
  const [userInput, setUserInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debrief, setDebrief] = useState<DrillDebrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debriefRef = useRef<HTMLDivElement>(null);

  const drillLabel = DRILL_TYPES.find((d) => d.type === drillType)?.label || drillType;

  useEffect(() => {
    if (!submitted) {
      inputRef.current?.focus();
    }
  }, [submitted]);

  // Scroll to debrief when it appears
  useEffect(() => {
    if (debrief) {
      debriefRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [debrief]);

  const handleSubmit = useCallback(async () => {
    const trimmed = userInput.trim();
    if (!trimmed || submitted || isLoading) return;

    setUserResponse(trimmed);
    setSubmitted(true);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "drill",
          scenarioId: scenario.id,
          userResponse: trimmed,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to grade response");
      }

      const data: DrillDebrief = await res.json();
      setDebrief(data);

      // Save to localStorage
      if (isStorageAvailable()) {
        saveDrillResult({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: scenario.type,
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          userResponse: trimmed,
          score: data.score,
          verdict: data.verdict,
          whatWorked: data.whatWorked,
          whatToImprove: data.whatToImprove,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, submitted, isLoading, scenario]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTryAgain = () => {
    const newScenario = getRandomDrillScenario(drillType, scenario.id);
    setScenario(newScenario);
    setUserInput("");
    setSubmitted(false);
    setUserResponse("");
    setDebrief(null);
    setError(null);
    setIsLoading(false);
    setAttemptKey(prev => prev + 1);
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="screen-enter px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted hover:text-gray-200 transition-colors text-sm"
        >
          &larr;
        </button>
        <h2 className="font-display text-xl text-gray-100 italic">
          {drillLabel}
        </h2>
      </div>

      <div key={attemptKey} className="space-y-6">
      {/* Scenario box */}
      <div className="bg-surface-raised border border-subtle rounded-lg p-4 space-y-3">
        <p className="text-xs font-mono text-muted tracking-wider uppercase">
          {scenario.title}
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          {scenario.context}
        </p>
        {scenario.batna && (
          <p className="text-xs text-accent/80 border-l-2 border-accent/30 pl-3">
            Your BATNA: {scenario.batna}
          </p>
        )}
      </div>

      {/* Opponent statement */}
      <ChatBubble
        role="assistant"
        content={scenario.opponentStatement}
        turnLabel="Opponent"
      />

      {/* User response (shown after submit) */}
      {submitted && userResponse && (
        <ChatBubble
          role="user"
          content={userResponse}
          turnLabel="You"
        />
      )}

      {/* Loading indicator */}
      {isLoading && <TypingIndicator />}

      {/* Input area (before submit) */}
      {!submitted && (
        <div className="space-y-2">
          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER_TEXT[drillType]}
              rows={3}
              className="flex-1 min-w-0 bg-surface-raised border border-subtle rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-subtle focus:outline-none focus:border-accent/50 resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim() || isLoading}
              className="btn-primary px-4 py-3 rounded-xl text-sm shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Drill debrief (inline) */}
      {debrief && (
        <div ref={debriefRef} className="space-y-5 pt-2">
          {/* Score */}
          <div className="text-center">
            <p className={`text-5xl font-display font-bold ${scoreColor(debrief.score)}`}>
              {debrief.score}
            </p>
            <p className="text-xs font-mono text-muted tracking-wider uppercase mt-1">
              Score
            </p>
          </div>

          {/* Verdict */}
          <p className="text-sm text-gray-200 font-medium text-center leading-relaxed">
            {debrief.verdict}
          </p>

          {/* What worked */}
          {debrief.whatWorked.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono text-emerald-400/80 tracking-wider uppercase">
                What worked
              </p>
              {debrief.whatWorked.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}

          {/* What to improve */}
          {debrief.whatToImprove.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono text-amber-400/80 tracking-wider uppercase">
                What to improve
              </p>
              {debrief.whatToImprove.map((point, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="text-amber-400 mt-0.5 shrink-0">-</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleTryAgain}
              className="btn-primary w-full py-3.5 rounded-lg text-sm tracking-wide"
            >
              Try Again
            </button>
            <button
              onClick={onBackToDrills}
              className="w-full py-2.5 rounded-lg text-sm text-muted border border-subtle hover:border-muted hover:text-gray-200 transition-colors"
            >
              Back to Drills
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
