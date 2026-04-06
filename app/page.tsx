"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SCENARIOS } from "@/lib/scenarios";
import { STRATEGIES, getRandomStrategy } from "@/lib/strategies";
import MomentumMeter from "@/components/MomentumMeter";
import ChatBubble, { TypingIndicator } from "@/components/ChatBubble";
import ScoreDial from "@/components/ScoreDial";
import TurnTimeline from "@/components/TurnTimeline";

const TOTAL_TURNS = 6;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DebriefData {
  overallScore: number;
  strategy: string;
  strategyLabel: string;
  annotations: string[];
  keyTakeaway: string;
}

type Screen = "setup" | "negotiation" | "debrief";

export default function Home() {
  // Setup state
  const [scenario, setScenario] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [strategyChoice, setStrategyChoice] = useState("random");
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

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debriefRef = useRef<HTMLDivElement>(null);

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
  };

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
          turnNumber: currentTurn,
          totalTurns: TOTAL_TURNS,
          messages: newMessages,
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
  }, [userInput, isLoading, activeStrategy, turnNumber, messages, scenario]);

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
          messages: finalMessages,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: DebriefData = await res.json();
      setDebrief(data);
      setScreen("debrief");
    } catch {
      setError("Failed to analyze your negotiation. Refresh and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Share
  const shareText = debrief
    ? `I negotiated against an AI playing ${debrief.strategyLabel}. Scored ${debrief.overallScore}/100. Think you can do better?\ntablestakes.vercel.app`
    : "";

  const handleShare = async (platform: "linkedin" | "x" | "copy") => {
    if (platform === "copy") {
      await navigator.clipboard.writeText(shareText);
      return;
    }
    const encodedText = encodeURIComponent(shareText);
    const url =
      platform === "linkedin"
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://tablestakes.vercel.app")}&summary=${encodedText}`
        : `https://x.com/intent/post?text=${encodedText}`;
    window.open(url, "_blank");
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

  return (
    <main className="min-h-dvh flex flex-col">
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

          {screen !== "setup" && (
            <button
              onClick={resetGame}
              className="text-xs font-mono text-muted hover:text-accent transition-colors tracking-wide uppercase"
            >
              New game
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full">
        {/* ── SCREEN 1: SETUP ── */}
        {screen === "setup" && (
          <div className="screen-enter px-4 py-6 space-y-8">
            {/* Tagline */}
            <div className="text-center space-y-2 pt-4">
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
              <textarea
                value={scenario}
                onChange={(e) => handleScenarioChange(e.target.value)}
                placeholder="Describe your own scenario..."
                rows={3}
                className="w-full bg-surface-raised border border-subtle rounded-lg px-4 py-3 text-sm text-gray-200 placeholder:text-subtle focus:outline-none focus:border-accent/50 resize-none"
              />
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
                  No data is stored. No accounts. Just practice.
                </p>
              </div>
            </details>

            {/* Start button */}
            <button
              onClick={startNegotiation}
              disabled={!scenario.trim()}
              className="btn-primary w-full py-3.5 rounded-lg text-sm tracking-wide"
            >
              Start Negotiation
            </button>
          </div>
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
                <ChatBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  turnLabel={
                    msg.role === "user"
                      ? `You · Turn ${Math.floor(i / 2) + 1}`
                      : "Opponent"
                  }
                />
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
                    className="flex-1 bg-surface-raised border border-subtle rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-subtle focus:outline-none focus:border-accent/50 resize-none disabled:opacity-50"
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
          <div
            className="screen-enter px-4 py-6 space-y-8 pb-24"
            ref={debriefRef}
          >
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

            {/* Share buttons */}
            <section className="space-y-3">
              <h2 className="text-xs font-mono text-muted tracking-wider uppercase">
                Share your result
              </h2>
              <div className="grid grid-cols-3 gap-2">
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
                  Copy
                </button>
              </div>
            </section>

            {/* Play again */}
            <button
              onClick={resetGame}
              className="btn-primary w-full py-3.5 rounded-lg text-sm tracking-wide"
            >
              New Negotiation
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
