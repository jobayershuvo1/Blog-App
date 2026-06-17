"use client";

import { FileText, FileArchive, FileCog, File, Download } from "lucide-react";
import type { DownloadLink } from "@/models/Post";

const ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  zip: FileArchive,
  exe: FileCog,
  doc: FileText,
  other: File,
};

export function DownloadLinks({ links, postId }: { links: DownloadLink[]; postId: string }) {
  if (!links?.length) return null;

  function track(index: number) {
    fetch(`/api/posts/${postId}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    }).catch(() => {});
  }

  return (
    <div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-dark-elevated p-5">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <Download className="h-5 w-5 text-primary" /> Downloads
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link, i) => {
          const Icon = ICONS[link.fileType] || ICONS.other;
          return (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(i)}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-surface-dark-card p-4 hover:border-primary hover:shadow-md transition"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{link.label}</div>
                <div className="text-xs uppercase text-slate-400">{link.fileType} · {link.downloads} downloads</div>
              </div>
              <Download className="h-4 w-4 text-slate-400 group-hover:text-primary" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
