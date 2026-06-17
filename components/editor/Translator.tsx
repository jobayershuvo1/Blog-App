"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Languages, X, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/primitives";
import { TRANSLATE_LANGUAGES } from "@/lib/constants";

export function Translator({
  open,
  onClose,
  title,
  content,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onApply: (data: { title?: string; content?: string }) => void;
}) {
  const [target, setTarget] = useState("bn");
  const [source, setSource] = useState("en");
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [tTitle, setTTitle] = useState("");
  const [tContent, setTContent] = useState("");

  async function run(kind: "title" | "content") {
    const text = kind === "title" ? title : content;
    if (!text) return toast.error(`No ${kind} to translate.`);
    kind === "title" ? setLoadingTitle(true) : setLoadingContent(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "title" ? { title: text, source, target } : { text, source, target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (kind === "title") setTTitle(data.title || data.content);
      else setTContent(data.content);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed.");
    } finally {
      kind === "title" ? setLoadingTitle(false) : setLoadingContent(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-3xl bg-white dark:bg-surface-dark-elevated shadow-2xl overflow-y-auto animate-fade-in">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-elevated p-4">
          <h3 className="flex items-center gap-2 font-semibold"><Languages className="h-5 w-5 text-primary" /> Post Translator</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1"><label className="text-xs text-slate-400">From</label>
              <Select value={source} onChange={(e) => setSource(e.target.value)}>{TRANSLATE_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</Select>
            </div>
            <div className="flex-1"><label className="text-xs text-slate-400">To</label>
              <Select value={target} onChange={(e) => setTarget(e.target.value)}>{TRANSLATE_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => run("title")} loading={loadingTitle} className="flex-1">Translate Title</Button>
            <Button size="sm" variant="outline" onClick={() => run("content")} loading={loadingContent} className="flex-1">Translate Content</Button>
          </div>

          {/* Title side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-400 mb-1">Original title</p>
              <p className="font-medium">{title || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400">Translated title</p>
                {tTitle && <button onClick={() => onApply({ title: tTitle })} className="text-xs text-primary hover:underline">Use</button>}
              </div>
              <p className="font-medium">{loadingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : tTitle || "—"}</p>
            </div>
          </div>

          {/* Content side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 max-h-80 overflow-y-auto">
              <p className="text-xs text-slate-400 mb-1">Original content</p>
              <div className="prose-content text-sm" dangerouslySetInnerHTML={{ __html: content || "<p>—</p>" }} />
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400">Translated content</p>
                {tContent && <button onClick={() => { onApply({ content: tContent }); toast.success("Applied to editor."); }} className="text-xs text-primary hover:underline flex items-center gap-1"><Copy className="h-3 w-3" />Use</button>}
              </div>
              {loadingContent ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="prose-content text-sm" dangerouslySetInnerHTML={{ __html: tContent || "<p>—</p>" }} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
