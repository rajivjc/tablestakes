"use client";

import { DRILL_TYPES, type DrillType } from "@/lib/drillScenarios";

interface DrillPickerProps {
  onSelect: (type: DrillType) => void;
  onBack: () => void;
}

export default function DrillPicker({ onSelect, onBack }: DrillPickerProps) {
  return (
    <div className="screen-enter px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted hover:text-gray-200 transition-colors text-sm"
        >
          &larr;
        </button>
        <div>
          <h2 className="font-display text-xl text-gray-100 italic">
            Quick Drills
          </h2>
          <p className="text-sm text-muted">
            One turn. One skill. Instant feedback.
          </p>
        </div>
      </div>

      {/* Drill cards */}
      <div className="space-y-3">
        {DRILL_TYPES.map((drill) => (
          <button
            key={drill.type}
            onClick={() => onSelect(drill.type)}
            className="w-full text-left px-4 py-4 rounded-lg border border-subtle bg-surface-raised hover:border-muted transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">{drill.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-200 group-hover:text-accent transition-colors">
                  {drill.label}
                </p>
                <p className="text-xs text-muted">{drill.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
