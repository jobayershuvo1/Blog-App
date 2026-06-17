"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Upload, Sparkles, X, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/primitives";

export function CoverPhoto({
  value,
  onChange,
  titleHint,
}: {
  value: string;
  onChange: (url: string) => void;
  titleHint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) return toast.error("Max file size is 5MB.");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
      toast.success("Cover uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function generate() {
    const text = (prompt || titleHint || "").trim();
    if (!text) return toast.error("Enter a description or post title first.");
    setGenerating(true);
    // Pollinations.ai — free, no key. Add a seed so "regenerate" yields a new image.
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      text
    )}?width=1200&height=630&nologo=true&seed=${seed}`;
    onChange(url);
    // image loads async; clear spinner shortly after
    setTimeout(() => setGenerating(false), 1200);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        className="relative aspect-[1200/630] w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40"
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Cover" className="h-full w-full object-cover" />
            <button onClick={() => onChange("")} className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900">
              <X className="h-4 w-4" />
            </button>
            {generating && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </>
        ) : (
          <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 hover:text-primary">
            {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8" />}
            <span className="mt-2 text-sm">Drag & drop or click to upload</span>
            <span className="text-xs">1200×630 recommended · max 5MB</span>
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} loading={uploading} className="flex-1"><Upload className="h-4 w-4" />Upload</Button>
      </div>

      {/* AI generator */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="h-4 w-4 text-accent" /> AI Cover Generator</div>
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={titleHint ? `e.g. "${titleHint}"` : "Describe the cover image…"} className="h-9 text-sm" />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={generate} loading={generating} className="flex-1"><Sparkles className="h-4 w-4" />Generate</Button>
          {value && value.includes("pollinations.ai") && (
            <Button type="button" size="sm" variant="outline" onClick={generate} title="Regenerate"><RefreshCw className="h-4 w-4" /></Button>
          )}
        </div>
        <p className="text-[11px] text-slate-400">Powered by Pollinations.ai — free, no API key.</p>
      </div>
    </div>
  );
}
