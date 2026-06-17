"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Sparkles, Search } from "lucide-react";
import { Input, Textarea, Label } from "@/components/ui/primitives";
import { seoScore, seoColor } from "@/lib/utils";

export interface SeoData {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
}

export function SeoPanel({
  seo,
  onChange,
  title,
  content,
  slug,
}: {
  seo: SeoData;
  onChange: (seo: SeoData) => void;
  title: string;
  content: string;
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const { score, checks } = seoScore({
    metaTitle: seo.metaTitle,
    metaDesc: seo.metaDescription,
    focusKeyword: seo.focusKeyword,
    content,
    title,
  });
  const color = seoColor(score);
  const colorClass = color === "green" ? "text-success" : color === "yellow" ? "text-amber-500" : "text-danger";
  const barClass = color === "green" ? "bg-success" : color === "yellow" ? "bg-amber-500" : "bg-danger";

  async function optimize() {
    if (!title || !content) return toast.error("Add a title and content first.");
    setOptimizing(true);
    try {
      const res = await fetch("/api/ai/seo-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange({ metaTitle: data.metaTitle, metaDescription: data.metaDescription, focusKeyword: data.focusKeyword });
      if (data.suggestions?.length) toast.success("SEO optimized! " + data.suggestions[0]);
      else toast.success("SEO fields filled.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4">
        <span className="flex items-center gap-2 font-medium"><Search className="h-4 w-4 text-primary" /> SEO</span>
        <span className="flex items-center gap-3">
          <span className={`text-sm font-bold ${colorClass}`}>{score}/100</span>
          <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-4">
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${score}%` }} />
          </div>

          <button type="button" onClick={optimize} disabled={optimizing} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-50">
            <Sparkles className="h-4 w-4" /> {optimizing ? "Optimizing…" : "Auto-optimize with AI"}
          </button>

          <div>
            <div className="flex items-center justify-between">
              <Label>Meta title</Label>
              <span className={`text-xs ${seo.metaTitle.length > 60 ? "text-danger" : "text-slate-400"}`}>{seo.metaTitle.length}/60</span>
            </div>
            <Input value={seo.metaTitle} onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })} maxLength={70} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Meta description</Label>
              <span className={`text-xs ${seo.metaDescription.length > 160 ? "text-danger" : "text-slate-400"}`}>{seo.metaDescription.length}/160</span>
            </div>
            <Textarea rows={2} value={seo.metaDescription} onChange={(e) => onChange({ ...seo, metaDescription: e.target.value })} maxLength={200} />
          </div>

          <div>
            <Label>Focus keyword</Label>
            <Input value={seo.focusKeyword} onChange={(e) => onChange({ ...seo, focusKeyword: e.target.value })} />
          </div>

          {/* OG / Google preview */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-400 mb-1">Search preview</p>
            <p className="text-[#1a0dab] dark:text-blue-400 text-base leading-tight truncate">{seo.metaTitle || title || "Post title"}</p>
            <p className="text-success text-xs truncate">{process.env.NEXT_PUBLIC_SITE_URL || "https://yoursite.com"}/post/{slug || "post-slug"}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{seo.metaDescription || "Your meta description preview will appear here."}</p>
          </div>

          {/* Checklist */}
          <ul className="space-y-1 text-xs">
            {checks.map((c) => (
              <li key={c.label} className={`flex items-center gap-2 ${c.ok ? "text-success" : "text-slate-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.ok ? "bg-success" : "bg-slate-300 dark:bg-slate-600"}`} />
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
