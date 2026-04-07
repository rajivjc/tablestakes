"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SCENARIOS } from "@/lib/scenarios";
import { STRATEGIES, getRandomStrategy } from "@/lib/strategies";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";
import {
  saveSession,
  isStorageAvailable,
  getSessions,
  type SessionResult,
  type LanguageFlag,
  type Annotation,
} from "@/lib/storage";
import { type DrillType } from "@/lib/drillScenarios";
import { getRandomCurveball, getCurveballTurn, type Curveball } from "@/lib/curveballs";
import MomentumMeter from "@/components/MomentumMeter";
import ChatBubble, { TypingIndicator } from "@/components/ChatBubble";
import ScoreDial from "@/components/ScoreDial";
import TurnTimeline from "@/components/TurnTimeline";
import HistoryScreen from "@/components/HistoryScreen";
import DrillPicker from "@/components/DrillPicker";
import DrillActive from "@/components/DrillActive";
import PrepScreen, { type PrepPlan } from "@/components/PrepScreen";

const TOTAL_TURNS = 6;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PlanAdherenceData {
  score: number;
  assessment: string;
  stuckTo: string[];
  deviations: string[];
}

interface DebriefData {
  overallScore: number;
  strategy: string;
  strategyLabel: string;
  annotations: string[];
  keyTakeaway: string;
  tacticsUsed: string[];
  missedOpportunities: string[];
  languageFlags: LanguageFlag[];
  planAdherence?: PlanAdherenceData;
}

type Screen = "setup" | "prep" | "negotiation" | "debrief" | "history" | "drill-picker" | "drill-active";

export default function Home() {
  // Setup state
  const [scenario, setScenario] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [strategyChoice, setStrategyChoice] = useState("random");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isCustomScenario, setIsCustomScenario] = useState(false);

  // Game state
  const [screen, setScreen] = useState<Screen>("setup");
  const [messages, setMessages] = useState<Message[]>([]);
  const [turnNumber, setTurnNumber] = useState(0);
  const [momentum, setMomentum] = useState(50);
  const [momentumHistory, setMomentumHistory] = useState<number[]>([50]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Resolved strategy (set when game starts)
  const [activeStrategy, setActiveStrategy] = useState<{
    id: string;
    label: string;
    description: string;
    promptFragment: string;
  } | null>(null);

  // Debrief state
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Drill state
  const [activeDrillType, setActiveDrillType] = useState<DrillType | null>(null);

  // Prep plan state
  const [prepPlan, setPrepPlan] = useState<PrepPlan | null>(null);

  // Curveball state (Hard difficulty only)
  const [curveball, setCurveball] = useState<Curveball | null>(null);
  const [curveballTurn, setCurveballTurn] = useState<number | null>(null);

  // History state
  const [storageAvailable, setStorageAvailable] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [showToast, setShowToast] = useState(false);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debriefRef = useRef<HTMLDivElement>(null);

  // Check localStorage availability on mount
  useEffect(() => {
    const available = isStorageAvailable();
    setStorageAvailable(available);
    if (available) {
      setSessionCount(getSessions().length);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input after AI responds
  useEffect(() => {
    if (!isLoading && screen === "negotiation" && turnNumber < TOTAL_TURNS) {
      inputRef.current?.focus();
    }
  }, [isLoading, screen, turnNumber]);

  // Preset selection
  const selectPreset = (id: string) => {
    const s = SCENARIOS.find((sc) => sc.id === id);
    if (s) {
      setSelectedPreset(id);
      setScenario(s.briefing);
      setIsCustomScenario(false);
    }
  };

  const handleScenarioChange = (value: string) => {
    setScenario(value);
    // If user edits, check if it still matches a preset
    const match = SCENARIOS.find((s) => s.briefing === value);
    if (match) {
      setSelectedPreset(match.id);
      setIsCustomScenario(false);
    } else {
      setSelectedPreset(null);
      setIsCustomScenario(true);
    }
  };

  // Start game
  const startNegotiation = () => {
    if (!scenario.trim()) return;

    let strategy;
    if (strategyChoice === "random") {
      strategy = getRandomStrategy();
    } else {
      strategy = STRATEGIES.find((s) => s.id === strategyChoice);
    }
    if (!strategy) return;

    setActiveStrategy(strategy);
    setScreen("negotiation");
    setMessages([]);
    setTurnNumber(0);
    setMomentum(50);
    setMomentumHistory([50]);
    setError(null);

    if (difficulty === "hard") {
      setCurveball(getRandomCurveball());
      setCurveballTurn(getCurveballTurn());
    } else {
      setCurveball(null);
      setCurveballTurn(null);
    }
  };

  // Save session to localStorage
  const saveCurrentSession = useCallback(
    (debriefData: DebriefData, finalMessages: Message[], momHistory: number[]) => {
      if (!storageAvailable || !activeStrategy) return;

      const presetMatch = SCENARIOS.find((s) => s.briefing === scenario);
      const scenarioTitle = presetMatch
        ? presetMatch.label
        : "Custom Scenario";
      const scenarioDesc = isCustomScenario
        ? scenario.slice(0, 200)
        : presetMatch?.briefing || scenario.slice(0, 200);

      // Build turn records from messages
      const turns = [];
      for (let i = 0; i < finalMessages.length; i += 2) {
        const userMsg = finalMessages[i];
        const aiMsg = finalMessages[i + 1];
        if (userMsg && aiMsg) {
          const turnIdx = Math.floor(i / 2);
          turns.push({
            turnNumber: turnIdx + 1,
            userMessage: userMsg.content,
            aiResponse: aiMsg.content,
            momentum: momHistory[turnIdx + 1] ?? 50,
          });
        }
      }

      // Parse annotations from strings to Annotation objects
      const annotations: Annotation[] = debriefData.annotations.map((a, idx) => {
        const match = a.match(/^Turn\s+(\d+):\s*(.*)/);
        return {
          turnNumber: match ? parseInt(match[1]) : idx + 1,
          text: match ? match[2] : a,
        };
      });

      // Momentum values (skip initial 50)
      const momentumValues = momHistory.slice(1);

      // Determine if prep plan has content
      const hasPrepContent = prepPlan && (prepPlan.batna.trim() || prepPlan.walkAway.trim() || prepPlan.openingStrategy.trim());

      const result: SessionResult = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        scenario: {
          title: scenarioTitle,
          description: scenarioDesc,
          isCustom: isCustomScenario,
        },
        strategy: {
          id: activeStrategy.id,
          name: activeStrategy.label,
        },
        difficulty,
        ...(hasPrepContent ? { prepPlan } : {}),
        ...(debriefData.planAdherence ? { planAdherence: debriefData.planAdherence } : {}),
        ...(curveball ? { curveballLabel: curveball.label, curveballTurn: curveballTurn ?? undefined } : {}),
        score: debriefData.overallScore,
        momentum: momentumValues,
        turns,
        debrief: {
          summary: debriefData.keyTakeaway,
          annotations,
          tacticsUsed: debriefData.tacticsUsed || [],
          missedOpportunities: debriefData.missedOpportunities || [],
          languageFlags: debriefData.languageFlags || [],
          keyTakeaway: debriefData.keyTakeaway,
        },
      };

      saveSession(result);
      setSessionCount((prev) => prev + 1);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    },
    [storageAvailable, activeStrategy, scenario, isCustomScenario, difficulty, prepPlan, curveball, curveballTurn]
  );

  // Send turn
  const sendTurn = useCallback(async () => {
    if (!userInput.trim() || isLoading || !activeStrategy) return;
    if (turnNumber >= TOTAL_TURNS) return;

    const currentTurn = turnNumber + 1;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userInput.trim() },
    ];

    setMessages(newMessages);
    setUserInput("");
    setTurnNumber(currentTurn);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "turn",
          scenario,
          strategyId: activeStrategy.id,
          difficulty,
          turnNumber: currentTurn,
          totalTurns: TOTAL_TURNS,
          messages: newMessages,
          ...(curveball && curveballTurn === currentTurn ? { curveballInstruction: curveball.promptInstruction } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }

      const data = await res.json();

      const updatedMessages: Message[] = [
        ...newMessages,
        { role: "assistant", content: data.message },
      ];
      setMessages(updatedMessages);
      setMomentum(data.momentum);
      setMomentumHistory((prev) => [...prev, data.momentum]);

      // Check if negotiation is complete
      if (currentTurn >= TOTAL_TURNS) {
        requestDebrief(updatedMessages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setTurnNumber(currentTurn - 1);
      // Remove the user message we optimistically added
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, activeStrategy, turnNumber, messages, scenario, curveball, curveballTurn]);

  // Request debrief
  const requestDebrief = async (finalMessages: Message[]) => {
    if (!activeStrategy) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "debrief",
          scenario,
          strategyId: activeStrategy.id,
          strategyLabel: activeStrategy.label,
          strategyDescription: activeStrategy.description,
          isCustomScenario,
          difficulty,
          messages: finalMessages,
          ...(prepPlan && (prepPlan.batna.trim() || prepPlan.walkAway.trim() || prepPlan.openingStrategy.trim()) ? { prepPlan } : {}),
          ...(curveball ? { curveballLabel: curveball.label } : {}),
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: DebriefData = await res.json();
      setDebrief(data);
      setScreen("debrief");

      // Save session to localStorage
      // Use current momentumHistory + capture at this point
      setMomentumHistory((prev) => {
        saveCurrentSession(data, finalMessages, prev);
        return prev;
      });
    } catch {
      setError("Failed to analyze your negotiation. Refresh and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Share
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const shareText = debrief
    ? `I negotiated against an AI playing ${debrief.strategyLabel}. Scored ${debrief.overallScore}/100. Think you can do better?\ntablestakes-sage.vercel.app`
    : "";

  const handleShare = async (platform: "linkedin" | "x" | "copy") => {
    if (platform === "copy") {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    const encodedText = encodeURIComponent(shareText);
    const url =
      platform === "linkedin"
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://tablestakes-sage.vercel.app")}`
        : `https://x.com/intent/post?text=${encodedText}`;
    window.open(url, "_blank");
  };

  const handleDownload = async () => {
    if (!debriefRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(debriefRef.current, {
        backgroundColor: "#0a0a0c",
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tablestakes-result.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      // Silently fail — download is best-effort
    } finally {
      setIsSaving(false);
    }
  };

  // Drill navigation
  const startDrillPicker = () => {
    setScreen("drill-picker");
  };

  const startDrill = (type: DrillType) => {
    setActiveDrillType(type);
    setScreen("drill-active");
  };

  // Reset
  const resetGame = () => {
    setScreen("setup");
    setMessages([]);
    setTurnNumber(0);
    setMomentum(50);
    setMomentumHistory([50]);
    setDebrief(null);
    setActiveStrategy(null);
    setDifficulty("medium");
    setActiveDrillType(null);
    setPrepPlan(null);
    setCurveball(null);
    setCurveballTurn(null);
    setError(null);
    setUserInput("");
  };

  // Keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTurn();
    }
  };

  // Language flag badge colors
  const flagBadgeColor: Record<string, string> = {
    assertive: "bg-emerald-400/15 text-emerald-400",
    specific: "bg-emerald-400/15 text-emerald-400",
    hedging: "bg-amber-400/15 text-amber-400",
    vague: "bg-amber-400/15 text-amber-400",
    emotional: "bg-red-400/15 text-red-400",
  };

  return (
    <main className="min-h-dvh flex flex-col overflow-x-hidden max-w-full">
      {/* Header - always visible */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-subtle/30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={resetGame}
            className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity"
          >
            <h1 className="font-display text-xl text-accent italic">
              TableStakes
            </h1>
          </button>

          <div className="flex items-center gap-3">
            {screen !== "setup" && screen !== "prep" && screen !== "history" && screen !== "drill-picker" && screen !== "drill-active" && (
              <button
                onClick={resetGame}
                className="text-xs font-mono text-muted hover:text-accent transition-colors tracking-wide uppercase"
              >
                New game
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* ── SCREEN 1: SETUP ── */}
        {screen === "setup" && (
          <div className="screen-enter px-4 py-6 space-y-8">
            {/* Tagline + History button */}
            <div className="text-center space-y-2 pt-4 relative">
              {storageAvailable && (
                <button
                  onClick={() => setScreen("history")}
                  className="absolute top-4 right-0 text-xs font-mono text-muted hover:text-accent transition-colors tracking-wide uppercase flex items-center gap-1.5"
                >
                  History
                  {sessionCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-accent/20 text-accent text-[10px] font-mono px-1">
                      {sessionCount}
                    </span>
                  )}
                </button>
              )}
              <p className="font-display text-2xl text-gray-100 italic">
                Practice tough negotiations.
              </p>
              <p className="text-sm text-muted">
                6 moves. AI opponent. Hidden strategy. Full debrief.
              </p>
            </div>

            {/* Scenario Selection */}
            <section className="space-y-3">
              <label className="text-xs font-mono text-muted tracking-wider uppercase block">
                Scenario
              </label>
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => selectPreset(s.id)}
                    className={`chip px-3 py-1.5 rounded-full text-sm border ${
                      selectedPreset === s.id
                        ? "chip-selected border-accent"
                        : "border-subtle text-gray-300 hover:border-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <textarea
                  value={scenario}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  placeholder="Describe your own scenario..."
                  rows={3}
                  className="w-full bg-surface-raised border border-subtle rounded-lg px-4 py-3 pr-8 text-sm text-gray-200 placeholder:text-subtle focus:outline-none focus:border-accent/50 resize-none"
                />
                {scenario && (
                  <button
                    onClick={() => {
                      setScenario("");
                      setSelectedPreset(null);
                      setIsCustomScenario(false);
                    }}
                    className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full bg-subtle/50 text-muted hover:text-gray-200 hover:bg-subtle transition-colors text-xs"
                    aria-label="Clear scenario"
                  >
                    &times;
                  </button>
                )}
              </div>
            </section>

            {/* Opponent Strategy */}
            <section className="space-y-3">
              <label className="text-xs font-mono text-muted tracking-wider uppercase block">
                Opponent Strategy
              </label>
              <div className="space-y-2">
                {/* Random option */}
                <button
                  onClick={() => setStrategyChoice("random")}
                  className={`chip w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    strategyChoice === "random"
                      ? "border-accent bg-accent/10"
                      : "border-subtle hover:border-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${strategyChoice === "random" ? "text-accent" : "text-gray-300"}`}
                    >
                      Random
                    </span>
                    <span className="text-xs text-muted">Recommended</span>
                  </div>
                  {strategyChoice === "random" && (
                    <p className="text-xs text-muted mt-1">
                      Strategy revealed after the negotiation
                    </p>
                  )}
                </button>

                {/* Named strategies */}
                {STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStrategyChoice(s.id)}
                    className={`chip w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      strategyChoice === s.id
                        ? "border-accent bg-accent/10"
                        : "border-subtle hover:border-muted"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${strategyChoice === s.id ? "text-accent" : "text-gray-300"}`}
                    >
                      {s.label}
                    </span>
                    {strategyChoice === s.id && (
                      <p className="text-xs text-muted mt-1">
                        {s.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Difficulty */}
            <section className="space-y-3">
              <label className="text-xs font-mono text-muted tracking-wider uppercase block">
                Difficulty
              </label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`flex-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      difficulty === d.id
                        ? "bg-accent text-white border-accent"
                        : "border-subtle text-muted hover:border-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">
                {DIFFICULTIES.find((d) => d.id === difficulty)?.description}
              </p>
            </section>

            {/* How this works (collapsible) */}
            <details className="group">
              <summary className="text-xs font-mono text-muted tracking-wider uppercase cursor-pointer hover:text-gray-400 transition-colors flex items-center gap-1.5">
                <span className="transition-transform group-open:rotate-90">
                  ▸
                </span>
                How this works
              </summary>
              <div className="mt-3 space-y-2 text-sm text-gray-400 pl-4 border-l border-subtle">
                <p>
                  You negotiate for 6 rounds against an AI opponent. A momentum
                  meter tracks who has the upper hand after each exchange.
                </p>
                <p>
                  When the negotiation ends, you get a score, turn-by-turn
                  analysis, and a key takeaway. If you chose Random, the
                  opponent&apos;s strategy is revealed.
                </p>
                <p>
                  Your sessions are saved locally so you can track your progress
                  over time.
                </p>
              </div>
            </details>

            {/* Start buttons */}
            <div className="space-y-3">
              <button
                onClick={() => { if (scenario.trim()) setScreen("prep"); }}
                disabled={!scenario.trim()}
                className="btn-primary w-full py-3.5 rounded-lg text-sm tracking-wide"
              >
                Start with Prep
              </button>
              <button
                onClick={() => { setPrepPlan(null); startNegotiation(); }}
                disabled={!scenario.trim()}
                className="w-full py-3.5 rounded-lg text-sm tracking-wide text-muted border border-subtle hover:border-muted hover:text-gray-200 transition-colors"
              >
                Skip to Negotiation
              </button>
              <button
                onClick={startDrillPicker}
                className="w-full py-3.5 rounded-lg text-sm tracking-wide text-muted border border-subtle hover:border-muted hover:text-gray-200 transition-colors"
              >
                Quick Drill
              </button>
            </div>
          </div>
        )}

        {/* ── SCREEN: PREP ── */}
        {screen === "prep" && (
          <PrepScreen
            onStart={(plan) => {
              setPrepPlan(plan);
              startNegotiation();
            }}
            onBack={() => setScreen("setup")}
          />
        )}

        {/* ── SCREEN 2: NEGOTIATION ── */}
        {screen === "negotiation" && (
          <div className="screen-enter flex flex-col h-[calc(100dvh-57px)]">
            {/* Momentum meter */}
            <div className="px-4 py-3 border-b border-subtle/30">
              <MomentumMeter
                score={momentum}
                turnNumber={Math.min(turnNumber, TOTAL_TURNS)}
                totalTurns={TOTAL_TURNS}
              />
            </div>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-12 space-y-2">
                  <p className="text-sm text-muted">You speak first.</p>
                  <p className="text-xs text-subtle">
                    Make your opening move.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i}>
                  <ChatBubble
                    role={msg.role}
                    content={msg.content}
                    turnLabel={
                      msg.role === "user"
                        ? `You · Turn ${Math.floor(i / 2) + 1}`
                        : "Opponent"
                    }
                  />
                  {msg.role === "assistant" && curveball && curveballTurn === Math.floor(i / 2) + 1 && (
                    <div className="flex justify-start mb-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-400/15 text-red-400 tracking-wider uppercase">
                        Curveball: {curveball.label}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && <TypingIndicator />}

              {isAnalyzing && (
                <div className="text-center py-8 space-y-3">
                  <div className="w-8 h-8 mx-auto border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <p className="text-sm text-muted">
                    Analyzing your negotiation...
                  </p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            {turnNumber < TOTAL_TURNS && !isAnalyzing && (
              <div className="border-t border-subtle/30 p-4">
                {error && (
                  <p className="text-xs text-danger mb-2">{error}</p>
                )}
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      turnNumber === 0
                        ? "Make your opening move..."
                        : "Your response..."
                    }
                    rows={2}
                    disabled={isLoading}
                    className="flex-1 min-w-0 bg-surface-raised border border-subtle rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-subtle focus:outline-none focus:border-accent/50 resize-none disabled:opacity-50"
                  />
                  <button
                    onClick={sendTurn}
                    disabled={!userInput.trim() || isLoading}
                    className="btn-primary px-4 py-3 rounded-xl text-sm shrink-0"
                  >
                    Send
                  </button>
                </div>
                <p className="text-[10px] text-subtle mt-1.5 text-center">
                  {TOTAL_TURNS - turnNumber} move
                  {TOTAL_TURNS - turnNumber !== 1 ? "s" : ""} remaining
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── SCREEN 3: DEBRIEF ── */}
        {screen === "debrief" && debrief && (
          <div className="screen-enter px-4 py-6 space-y-8 pb-24">
            {/* Capturable area */}
            <div ref={debriefRef} className="space-y-8">
              {/* Score dial */}
              <div className="pt-4">
                <ScoreDial score={debrief.overallScore} />
              </div>

              {/* Strategy reveal */}
              <div className="text-center space-y-1">
                {strategyChoice === "random" ? (
                  <>
                    <p className="text-xs font-mono text-muted tracking-wider uppercase">
                      Your opponent was playing
                    </p>
                    <p className="font-display text-xl text-accent italic">
                      {debrief.strategyLabel}
                    </p>
                    <p className="text-sm text-gray-400">
                      {STRATEGIES.find((s) => s.id === debrief.strategy)
                        ?.description || ""}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-mono text-muted tracking-wider uppercase">
                      You practiced against
                    </p>
                    <p className="font-display text-xl text-accent italic">
                      {debrief.strategyLabel}
                    </p>
                  </>
                )}
                <div className="flex justify-center mt-2 gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    difficulty === "easy"
                      ? "bg-emerald-400/15 text-emerald-400"
                      : difficulty === "hard"
                        ? "bg-red-400/15 text-red-400"
                        : "bg-amber-400/15 text-amber-400"
                  }`}>
                    {DIFFICULTIES.find((d) => d.id === difficulty)?.label}
                  </span>
                  {curveball && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-400/15 text-red-400">
                      Curveball: {curveball.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Turn-by-turn timeline */}
              <section className="space-y-3">
                <h2 className="text-xs font-mono text-muted tracking-wider uppercase">
                  Turn-by-Turn Analysis
                </h2>
                <TurnTimeline annotations={debrief.annotations} />
              </section>

              {/* Key takeaway */}
              <section className="bg-surface-raised border border-accent/20 rounded-lg p-4">
                <p className="text-xs font-mono text-accent tracking-wider uppercase mb-2">
                  Key Takeaway
                </p>
                <p className="text-sm text-gray-200 leading-relaxed">
                  {debrief.keyTakeaway}
                </p>
              </section>

              {/* Plan Adherence */}
              {debrief.planAdherence && (
                <section className="space-y-4">
                  <h2 className="text-xs font-mono text-muted tracking-wider uppercase">
                    Plan Adherence
                  </h2>
                  <div className="text-center">
                    <p className={`text-3xl font-display font-bold ${
                      debrief.planAdherence.score >= 70 ? 'text-emerald-400' :
                      debrief.planAdherence.score >= 40 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {debrief.planAdherence.score}
                    </p>
                    <p className="text-[10px] font-mono text-muted tracking-wider uppercase mt-1">
                      Plan Score
                    </p>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed text-center">
                    {debrief.planAdherence.assessment}
                  </p>
                  {debrief.planAdherence.stuckTo.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-mono text-emerald-400/80 tracking-wider uppercase">
                        Stuck to plan
                      </p>
                      {debrief.planAdherence.stuckTo.map((point, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {debrief.planAdherence.deviations.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-mono text-amber-400/80 tracking-wider uppercase">
                        Deviations
                      </p>
                      {debrief.planAdherence.deviations.map((point, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="text-amber-400 mt-0.5 shrink-0">&nearr;</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Tactics Used */}
              {debrief.tacticsUsed && debrief.tacticsUsed.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-mono text-muted tracking-wider uppercase">
                    Tactics Identified
                  </h2>
                  <div className="space-y-2">
                    {debrief.tacticsUsed.map((tactic, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <span className="text-accent mt-0.5 shrink-0">·</span>
                        <span>{tactic}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Missed Opportunities */}
              {debrief.missedOpportunities && debrief.missedOpportunities.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-mono text-muted tracking-wider uppercase">
                    Missed Opportunities
                  </h2>
                  <div className="space-y-2">
                    {debrief.missedOpportunities.map((opp, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-400"
                      >
                        <span className="text-subtle mt-0.5 shrink-0">·</span>
                        <span>{opp}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Language Flags */}
              {debrief.languageFlags && debrief.languageFlags.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-mono text-muted tracking-wider uppercase">
                    Language Analysis
                  </h2>
                  <div className="space-y-2.5">
                    {debrief.languageFlags.map((flag, i) => (
                      <div
                        key={i}
                        className="bg-surface-raised border border-subtle rounded-lg px-3 py-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${flagBadgeColor[flag.type] || "bg-subtle/50 text-muted"}`}
                          >
                            {flag.label}
                          </span>
                          <span className="text-[10px] font-mono text-subtle shrink-0">
                            Turn {flag.turnNumber}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {flag.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Share buttons */}
            <section className="space-y-3">
              <h2 className="text-xs font-mono text-muted tracking-wider uppercase">
                Share your result
              </h2>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleShare("linkedin")}
                  className="chip border border-subtle rounded-lg py-2.5 text-sm text-gray-300 hover:border-muted text-center"
                >
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShare("x")}
                  className="chip border border-subtle rounded-lg py-2.5 text-sm text-gray-300 hover:border-muted text-center"
                >
                  X
                </button>
                <button
                  onClick={() => handleShare("copy")}
                  className="chip border border-subtle rounded-lg py-2.5 text-sm text-gray-300 hover:border-muted text-center"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isSaving}
                  className="chip border border-subtle rounded-lg py-2.5 text-sm text-gray-300 hover:border-muted text-center disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Download"}
                </button>
              </div>
            </section>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={resetGame}
                className="btn-primary w-full py-3.5 rounded-lg text-sm tracking-wide"
              >
                New Negotiation
              </button>
              {storageAvailable && (
                <button
                  onClick={() => setScreen("history")}
                  className="w-full py-2.5 rounded-lg text-sm text-muted border border-subtle hover:border-muted hover:text-gray-200 transition-colors"
                >
                  View History
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SCREEN: DRILL PICKER ── */}
        {screen === "drill-picker" && (
          <DrillPicker
            onSelect={startDrill}
            onBack={resetGame}
          />
        )}

        {/* ── SCREEN: DRILL ACTIVE ── */}
        {screen === "drill-active" && activeDrillType && (
          <DrillActive
            drillType={activeDrillType}
            onBack={() => setScreen("drill-picker")}
            onBackToDrills={() => setScreen("drill-picker")}
          />
        )}

        {/* ── SCREEN 4: HISTORY ── */}
        {screen === "history" && (
          <HistoryScreen
            onBack={resetGame}
            onNewSession={resetGame}
          />
        )}
      </div>

      {/* Session saved toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 toast-enter">
          <div className="bg-surface-raised border border-subtle rounded-lg px-4 py-2 text-sm text-muted shadow-lg">
            Session saved
          </div>
        </div>
      )}
    </main>
  );
}
