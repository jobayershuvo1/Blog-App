"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Sparkles, X, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/ui/primitives";

export interface GeneratedPost {
  title: string;
  content: string;
  metaDescription: string;
  tags: string[];
}

export function AIGenerator({
  open,
  onClose,
  onInsert,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (post: GeneratedPost) => void;
}) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("medium");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedPost | null>(null);

  async function generate() {
    if (topic.trim().length < 3) return toast.error("Enter a topic.");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone, length, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-lg bg-white dark:bg-surface-dark-elevated shadow-2xl overflow-y-auto animate-fade-in">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-elevated p-4">
          <h3 className="flex items-center gap-2 font-semibold"><Wand2 className="h-5 w-5 text-primary" /> AI Post Generator</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <Label>Topic / keywords</Label>
            <Textarea rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. The benefits of intermittent fasting" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tone</Label>
              <Select value={tone} onChange={(e) => setTone(e.target.value)}>
                {["Professional", "Casual", "Academic", "Creative"].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label>Length</Label>
              <Select value={length} onChange={(e) => setLength(e.target.value)}>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option>English</option>
                <option>Bengali</option>
                <option>Auto</option>
              </Select>
            </div>
          </div>

          <Button onClick={generate} loading={loading} className="w-full"><Sparkles className="h-4 w-4" />Generate</Button>

          {result && (
            <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h4 className="font-serif text-lg font-bold">{result.title}</h4>
              <div className="prose-content max-h-72 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: result.content }} />
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((t) => <span key={t} className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">#{t}</span>)}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { onInsert(result); onClose(); }} className="flex-1">Insert into editor</Button>
                <Button variant="outline" onClick={generate} loading={loading}>Regenerate</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
