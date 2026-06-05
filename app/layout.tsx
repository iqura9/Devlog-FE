import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
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

export const metadata: Metadata = {
  title: "DevLog — AI task tracker",
  description:
    "A task tracker for engineering teams with a built-in AI agent layer.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <div className="mx-auto max-w-screen-2xl px-5 pb-20 sm:px-7 min-h-screen flex flex-col">
          {children}
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(220 40% 99%)",
              border: "1px solid hsl(218 20% 87%)",
              color: "hsl(222 14% 18%)",
            },
          }}
        />
      </body>
    </html>
  );
}
