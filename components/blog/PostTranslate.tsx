"use client";

import { useState } from "react";
import { Languages, Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { TRANSLATE_LANGUAGES } from "@/lib/constants";

export function PostTranslate({
  postId,
  originalTitle,
  originalContent,
}: {
  postId: string;
  originalTitle: string;
  originalContent: string;
}) {
  const t = useTranslations("post");
  const [lang, setLang] = useState("bn");
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState<{ title: string; content: string } | null>(null);

  async function translate() {
    setLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, target: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");
      setTranslated({ title: data.title, content: data.content });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="my-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-dark-elevated p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Languages className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">{t("readIn")}:</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-sm"
        >
          {TRANSLATE_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <button
          onClick={translate}
          disabled={loading}
          className="btn-gradient h-9 px-4 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
          {loading ? t("translating") : t("readIn")}
        </button>
        {translated && (
          <button
            onClick={() => setTranslated(null)}
            className="h-9 px-3 rounded-lg text-sm border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t("showOriginal")}
          </button>
        )}
      </div>

      {translated && (
        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <h2 className="font-serif text-2xl font-bold mb-3">{translated.title}</h2>
          <div className="prose-content" dangerouslySetInnerHTML={{ __html: translated.content }} />
        </div>
      )}
    </div>
  );
}
