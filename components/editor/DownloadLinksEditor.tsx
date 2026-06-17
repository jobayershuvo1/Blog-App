"use client";

import { Plus, Trash2, Download } from "lucide-react";
import { Input, Select } from "@/components/ui/primitives";

export interface DLink {
  label: string;
  url: string;
  fileType: string;
}

const TYPES = ["pdf", "zip", "exe", "doc", "img", "other"];

export function DownloadLinksEditor({
  links,
  onChange,
}: {
  links: DLink[];
  onChange: (links: DLink[]) => void;
}) {
  function update(i: number, patch: Partial<DLink>) {
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={i} className="flex gap-2 items-start">
          <Input value={l.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" className="h-9 text-sm flex-1" />
          <Input value={l.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://" className="h-9 text-sm flex-[2]" />
          <Select value={l.fileType} onChange={(e) => update(i, { fileType: e.target.value })} className="h-9 text-sm w-24">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <button onClick={() => onChange(links.filter((_, idx) => idx !== i))} className="h-9 w-9 rounded-lg flex items-center justify-center text-danger hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...links, { label: "", url: "", fileType: "pdf" }])} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <Plus className="h-4 w-4" /> Add download link
      </button>
      {links.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400"><Download className="h-3.5 w-3.5" /> Add downloadable files (PDF, ZIP, etc.) to your post.</p>
      )}
    </div>
  );
}
