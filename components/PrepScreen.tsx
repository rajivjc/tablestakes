"use client";

import { useState } from "react";

export interface PrepPlan {
  batna: string;
  walkAway: string;
  openingStrategy: string;
}

interface PrepScreenProps {
  onStart: (plan: PrepPlan) => void;
  onBack: () => void;
}

export default function PrepScreen({ onStart, onBack }: PrepScreenProps) {
  const [batna, setBatna] = useState("");
  const [walkAway, setWalkAway] = useState("");
  const [openingStrategy, setOpeningStrategy] = useState("");

  const handleStart = () => {
    onStart({ batna, walkAway, openingStrategy });
  };

  return (
    <div className="screen-enter px-4 py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-muted hover:text-gray-200 transition-colors text-lg"
            aria-label="Back to setup"
          >
            &larr;
          </button>
          <h2 className="font-display text-2xl text-gray-100 italic">
            Your Game Plan
          </h2>
        </div>
        <p className="text-sm text-muted pl-8">
          Define your plan. We&apos;ll grade you against it.
        </p>
      </div>

      {/* BATNA */}
      <section className="space-y-2">
        <label className="text-xs font-mono text-muted tracking-wider uppercase block">
          BATNA
        </label>
        <p className="text-xs text-subtle">
          Your best alternative if this negotiation fails
        </p>
        <textarea
          value={batna}
          onChange={(e) => setBatna(e.target.value)}
          placeholder="e.g., I have another offer at $150K..."
          rows={2}
          maxLength={500}
          className="w-full bg-surface-raised border border-subtle rounded-lg px-4 py-3 text-sm text-gray-200 placeholder:text-subtle focus:outline-none focus:border-accent/50 resize-none"
        />
      </section>

      {/* Walk-Away Point */}
      <section className="space-y-2">
        <label className="text-xs font-mono text-muted tracking-wider uppercase block">
          Walk-Away Point
        </label>
        <p className="text-xs text-subtle">
          The minimum acceptable outcome — below this, you leave
        </p>
        <textarea
          value={walkAway}
          onChange={(e) => setWalkAway(e.target.value)}
          placeholder="e.g., I won't accept less than $140K base..."
          rows={2}
          maxLength={500}
          className="w-full bg-surface-raised border border-subtle rounded-lg px-4 py-3 text-sm text-gray-200 placeholder:text-subtle focus:outline-none focus:border-accent/50 resize-none"
        />
      </section>

      {/* Opening Strategy */}
      <section className="space-y-2">
        <label className="text-xs font-mono text-muted tracking-wider uppercase block">
          Opening Strategy
        </label>
        <p className="text-xs text-subtle">
          How will you start? What&apos;s your first move?
        </p>
        <textarea
          value={openingStrategy}
          onChange={(e) => setOpeningStrategy(e.target.value)}
          placeholder="e.g., Open with $170K anchored to market data..."
          rows={2}
          maxLength={500}
          className="w-full bg-surface-raised border border-subtle rounded-lg px-4 py-3 text-sm text-gray-200 placeholder:text-subtle focus:outline-none focus:border-accent/50 resize-none"
        />
      </section>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleStart}
          className="btn-primary w-full py-3.5 rounded-lg text-sm tracking-wide"
        >
          Start Negotiation
        </button>
        <p className="text-center">
          <button
            onClick={onBack}
            className="text-sm text-muted hover:text-gray-200 transition-colors"
          >
            Back
          </button>
        </p>
      </div>
    </div>
  );
}
