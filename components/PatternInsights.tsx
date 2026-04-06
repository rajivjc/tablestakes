import type { PatternInsight } from "@/lib/patterns";

interface PatternInsightsProps {
  insights: PatternInsight[];
}

const iconMap: Record<string, string> = {
  improvement: "\u2197",
  decline: "\u2198",
  streak: "\u2501",
  weakness: "\u25CB",
  strength: "\u25CF",
};

const colorMap: Record<string, string> = {
  improvement: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
  decline: "text-red-400 border-red-400/20 bg-red-400/5",
  streak: "text-accent border-accent/20 bg-accent/5",
  weakness: "text-red-400 border-red-400/20 bg-red-400/5",
  strength: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
};

export default function PatternInsights({ insights }: PatternInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-mono text-muted tracking-wider uppercase">
        Pattern Insights
      </h3>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={`border rounded-lg px-3 py-2.5 text-sm ${colorMap[insight.type] || "text-muted border-subtle"}`}
        >
          <span className="mr-2">{iconMap[insight.type] || "\u2022"}</span>
          {insight.message}
        </div>
      ))}
    </div>
  );
}
