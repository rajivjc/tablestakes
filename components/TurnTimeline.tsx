"use client";

interface TurnTimelineProps {
  annotations: string[];
}

export default function TurnTimeline({ annotations }: TurnTimelineProps) {
  return (
    <div className="relative pl-6">
      {/* Vertical connector line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px timeline-line" />

      <div className="space-y-4">
        {annotations.map((annotation, i) => {
          // Extract turn number prefix if present
          const text = annotation.replace(/^Turn\s*\d+:\s*/i, "");

          return (
            <div key={i} className="relative flex items-start gap-3">
              {/* Dot marker */}
              <div
                className="absolute -left-6 top-[6px] w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center text-[8px] font-mono font-bold"
                style={{
                  borderColor: "#d4a843",
                  backgroundColor: "#111114",
                  color: "#d4a843",
                }}
              >
                {i + 1}
              </div>

              {/* Annotation text */}
              <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
