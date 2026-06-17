"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/constants";

const LABELS: Record<Locale, string> = {
  en: "EN",
  bn: "বাং",
  ar: "ع",
  hi: "हि",
  es: "ES",
};

const NAMES: Record<Locale, string> = {
  en: "English",
  bn: "বাংলা",
  ar: "العربية",
  hi: "हिन्दी",
  es: "Español",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function choose(next: Locale) {
    // persist in cookie (read by i18n.ts) + localStorage
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    try {
      localStorage.setItem("NEXT_LOCALE", next);
    } catch {}
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <Globe className="h-4 w-4" />
        {LABELS[locale]}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-elevated shadow-xl p-1 animate-fade-in">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => choose(l)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {NAMES[l]}
                {l === locale && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
