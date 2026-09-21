import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elsewhere — Fictional Web Browser",
  description: "Browse a fictional web of .zz sites.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          closeButton
          toastOptions={{
            className: "!border-[var(--line)] !bg-white !text-[var(--ink)] !shadow-[var(--shadow-window)]",
          }}
        />
      </body>
    </html>
  );
}
