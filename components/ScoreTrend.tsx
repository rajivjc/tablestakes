"use client";

import { useEffect, useState } from "react";
import type { SessionResult } from "@/lib/storage";

interface ScoreTrendProps {
  sessions: SessionResult[];
}

export default function ScoreTrend({ sessions }: ScoreTrendProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (sessions.length < 2) {
    return (
      <div className="bg-surface-raised border border-subtle rounded-lg p-6 text-center">
        <p className="text-sm text-muted">
          Complete more sessions to see your trend.
        </p>
      </div>
    );
  }

  // Reverse so oldest is first (left) and newest is last (right)
  const ordered = [...sessions].reverse();
  const scores = ordered.map((s) => s.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Chart dimensions
  const width = 320;
  const height = 160;
  const padX = 32;
  const padTop = 16;
  const padBottom = 28;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;

  // Scale
  const minY = 0;
  const maxY = 100;
  const points = scores.map((score, i) => ({
    x: padX + (scores.length === 1 ? chartW / 2 : (i / (scores.length - 1)) * chartW),
    y: padTop + chartH - ((score - minY) / (maxY - minY)) * chartH,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const avgY = padTop + chartH - ((avg - minY) / (maxY - minY)) * chartH;

  // Total length for animation
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }

  return (
    <div className="bg-surface-raised border border-subtle rounded-lg p-4">
      <h3 className="text-xs font-mono text-muted tracking-wider uppercase mb-3">
        Score Trend
      </h3>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = padTop + chartH - ((val - minY) / (maxY - minY)) * chartH;
          return (
            <g key={val}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="#3a3a44"
                strokeWidth={0.5}
                strokeDasharray={val === 50 ? "none" : "2,3"}
              />
              <text
                x={padX - 6}
                y={y + 3}
                textAnchor="end"
                fill="#6b6b78"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Average line */}
        <line
          x1={padX}
          y1={avgY}
          x2={width - padX}
          y2={avgY}
          stroke="#d4a843"
          strokeWidth={0.75}
          strokeDasharray="4,4"
          opacity={0.5}
        />
        <text
          x={width - padX + 4}
          y={avgY + 3}
          fill="#d4a843"
          fontSize={8}
          fontFamily="JetBrains Mono, monospace"
          opacity={0.7}
        >
          avg
        </text>

        {/* Score line */}
        <polyline
          fill="none"
          stroke="#d4a843"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyline}
          style={{
            strokeDasharray: totalLength,
            strokeDashoffset: animated ? 0 : totalLength,
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#d4a843"
            stroke="#0a0a0c"
            strokeWidth={1.5}
            style={{
              opacity: animated ? 1 : 0,
              transition: `opacity 0.3s ease ${0.8 + i * 0.05}s`,
            }}
          />
        ))}

        {/* X-axis labels (session numbers) */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 6}
            textAnchor="middle"
            fill="#6b6b78"
            fontSize={8}
            fontFamily="JetBrains Mono, monospace"
          >
            {i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}
