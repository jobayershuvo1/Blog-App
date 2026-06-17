"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Suggestion {
  _id: string;
  title: string;
  slug: string;
}

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&suggest=1`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <form onSubmit={submit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder={t("placeholder")}
          className="w-full h-14 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-surface-dark-card pl-12 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-slate-400" />}
      </form>

      {open && suggestions.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-elevated shadow-xl p-2 animate-fade-in">
            {suggestions.map((s) => (
              <Link
                key={s._id}
                href={`/post/${s.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{s.title}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
