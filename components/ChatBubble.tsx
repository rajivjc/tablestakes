"use client";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  turnLabel?: string;
}

export default function ChatBubble({ role, content, turnLabel }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`message-enter flex flex-col ${isUser ? "items-end" : "items-start"} mb-3`}
    >
      {turnLabel && (
        <span className="text-[10px] font-mono text-subtle mb-1 px-1 tracking-wider uppercase">
          {turnLabel}
        </span>
      )}
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-body ${
          isUser
            ? "bg-accent/15 text-accent-bright rounded-br-md border border-accent/20"
            : "bg-surface-overlay text-gray-200 rounded-bl-md border border-subtle/40"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="message-enter flex items-start mb-3">
      <div className="bg-surface-overlay border border-subtle/40 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted" />
      </div>
    </div>
  );
}
