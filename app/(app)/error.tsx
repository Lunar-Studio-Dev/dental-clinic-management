"use client";

import { ErrorState } from "~/components/error-state";

export default function AppError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred while loading this page."
        onRetry={reset}
      />
    </div>
  );
}
