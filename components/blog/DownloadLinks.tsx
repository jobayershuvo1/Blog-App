"use client";

import { Download } from "lucide-react";
import type { DownloadLink } from "@/models/Post";

/** A link points at a real file (force download) vs. a page/redirect (just open). */
function isFile(link: DownloadLink): boolean {
  const fileTypes = new Set(["pdf", "doc", "zip", "exe", "img", "video"]);
  if (fileTypes.has(link.fileType)) return true;
  return /\.(pdf|docx?|zip|rar|7z|tar|gz|exe|mp4|webm|mov|mkv|avi|m4v|png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(
    link.url || ""
  );
}

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
    <div className="my-8">
      <div className="flex flex-wrap gap-4">
        {links.map((link, i) => {
          const file = isFile(link);
          return (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              {...(file ? { download: "" } : {})}
              onClick={() => track(i)}
              className="btn-gradient inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 font-semibold text-white"
            >
              <Download className="h-5 w-5" /> Download
            </a>
          );
        })}
      </div>
    </div>
  );
}
