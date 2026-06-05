"use client";

import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

interface GlobalErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function GlobalError({ error, unstable_retry }: GlobalErrorProps) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <div className="mx-auto max-w-screen-2xl px-5 pb-20 sm:px-7">
          <ErrorDisplay onRetry={unstable_retry} digest={error.digest} />
        </div>
      </body>
    </html>
  );
}
