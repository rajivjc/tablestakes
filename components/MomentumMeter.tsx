"use client";

interface MomentumMeterProps {
  score: number; // 0-100, 50 = neutral
  turnNumber: number;
  totalTurns: number;
}

export default function MomentumMeter({
  score,
  turnNumber,
  totalTurns,
}: MomentumMeterProps) {
  const label =
    score < 30
      ? "They're in control"
      : score < 45
        ? "Slight disadvantage"
        : score < 55
          ? "Even ground"
          : score < 70
            ? "You're ahead"
            : "You're dominating";

  return (
    <div className="w-full px-1">
      {/* Turn counter and label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted tracking-wide uppercase">
          Move {Math.max(turnNumber, 1)} of {totalTurns}
        </span>
        <span
          className="text-xs font-medium transition-colors duration-300"
          style={{
            color:
              score < 40
                ? "#c44b4b"
                : score > 60
                  ? "#4b9c6b"
                  : "#6b6b78",
          }}
        >
          {label}
        </span>
      </div>

      {/* Meter track */}
      <div className="relative w-full h-2 bg-surface-overlay rounded-full overflow-hidden">
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-subtle z-10" />

        {/* Fill bar */}
        <div
          className="momentum-fill absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${score}%`,
            background:
              score < 40
                ? "linear-gradient(90deg, #c44b4b, #d4655a)"
                : score > 60
                  ? "linear-gradient(90deg, #4b9c6b, #5ab87a)"
                  : "linear-gradient(90deg, #6b6b78, #8b8b98)",
          }}
        />
      </div>

      {/* Axis labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-subtle">Them</span>
        <span className="text-[10px] text-subtle">You</span>
      </div>
    </div>
  );
}
