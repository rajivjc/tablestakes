"use client";

import { useEffect, useState } from "react";

interface ScoreDialProps {
  score: number; // 0-100
}

export default function ScoreDial({ score }: ScoreDialProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // SVG arc calculations
  const radius = 50;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;

  const scoreColor =
    score < 35
      ? "#c44b4b"
      : score < 55
        ? "#d4a843"
        : score < 75
          ? "#4b9c6b"
          : "#3dd68c";

  const label =
    score < 25
      ? "Outmatched"
      : score < 40
        ? "Needs work"
        : score < 55
          ? "Holding ground"
          : score < 70
            ? "Solid"
            : score < 85
              ? "Strong"
              : "Masterful";

  return (
    <div className="flex flex-col items-center">
      <svg
        width="200"
        height="120"
        viewBox="0 0 120 70"
        className="overflow-visible"
      >
        {/* Track */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="#1e1e24"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Score fill */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={scoreColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          className="dial-animate"
          style={{
            filter: `drop-shadow(0 0 8px ${scoreColor}40)`,
          }}
        />

        {/* Score number */}
        <text
          x="60"
          y="52"
          textAnchor="middle"
          className="font-display"
          fill={scoreColor}
          fontSize="28"
          fontWeight="400"
        >
          {animated ? score : 0}
        </text>

        {/* /100 label */}
        <text
          x="60"
          y="64"
          textAnchor="middle"
          fill="#6b6b78"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
        >
          / 100
        </text>
      </svg>

      <span
        className="text-sm font-medium -mt-1 tracking-wide"
        style={{ color: scoreColor }}
      >
        {label}
      </span>
    </div>
  );
}
