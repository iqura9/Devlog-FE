"use client";

import { Header } from "@/components/Header";
import { ErrorDisplay } from "@/components/ErrorDisplay";

interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function Error({ error, unstable_retry }: ErrorProps) {
  return (
    <div className="w-full">
      <Header />
      <ErrorDisplay onRetry={unstable_retry} digest={error.digest} />
    </div>
  );
}
