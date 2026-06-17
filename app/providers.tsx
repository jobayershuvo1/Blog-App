"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            className:
              "!bg-white dark:!bg-surface-dark-elevated !text-slate-900 dark:!text-slate-100 !shadow-xl !rounded-xl",
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
