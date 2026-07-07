"use client";

// Root fatal boundary — must render its own <html>/<body> (no providers/theme here).
export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-gray-500">
            A critical error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
