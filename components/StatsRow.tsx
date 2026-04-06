import type { SessionResult } from "@/lib/storage";

interface StatsRowProps {
  sessions: SessionResult[];
}

export default function StatsRow({ sessions }: StatsRowProps) {
  const count = sessions.length;
  const scores = sessions.map((s) => s.score);
  const avg = count > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / count) : 0;
  const best = count > 0 ? Math.max(...scores) : 0;

  const stats = [
    { label: "Sessions", value: count.toString() },
    { label: "Avg Score", value: count > 0 ? avg.toString() : "—" },
    { label: "Best Score", value: count > 0 ? best.toString() : "—" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-raised border border-subtle rounded-lg p-3 text-center"
        >
          <p className="text-lg font-display text-gray-100 italic">
            {stat.value}
          </p>
          <p className="text-[10px] font-mono text-muted tracking-wider uppercase mt-0.5">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
