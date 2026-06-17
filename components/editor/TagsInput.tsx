"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { X, Sparkles, Plus } from "lucide-react";

export function TagsInput({
  tags,
  onChange,
  contentForAI,
  titleForAI,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  contentForAI?: string;
  titleForAI?: string;
}) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function add(raw: string) {
    const value = raw.trim().toLowerCase().replace(/,$/, "");
    if (!value || tags.includes(value)) return;
    onChange([...tags, value]);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
      setInput("");
    } else if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  async function suggest() {
    if (!contentForAI) return toast.error("Write some content first.");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleForAI, content: contentForAI }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestions((data.tags || []).filter((t: string) => !tags.includes(t)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/60 p-2 min-h-[44px]">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
            #{t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-danger"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Add tag, press Enter…" className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none" />
      </div>
      <button type="button" onClick={suggest} disabled={loading} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50">
        <Sparkles className="h-3.5 w-3.5" /> {loading ? "Thinking…" : "Suggest tags with AI"}
      </button>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button key={s} onClick={() => { add(s); setSuggestions(suggestions.filter((x) => x !== s)); }} className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 dark:border-slate-600 px-2.5 py-1 text-xs hover:border-primary hover:text-primary">
              <Plus className="h-3 w-3" />{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
