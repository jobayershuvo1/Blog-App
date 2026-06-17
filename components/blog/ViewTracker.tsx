"use client";

import { useEffect, useRef } from "react";

/** Fires a single view-count increment per mount (server rate-limits by IP). */
export function ViewTracker({ postId }: { postId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {});
  }, [postId]);
  return null;
}
