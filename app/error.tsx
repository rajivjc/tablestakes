"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h2 className="font-display text-xl text-accent italic">
          Something broke.
        </h2>
        <p className="text-sm text-muted">Not your fault. Probably.</p>
        <button
          onClick={reset}
          className="btn-primary px-6 py-2.5 rounded-lg text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
