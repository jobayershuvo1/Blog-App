"use client";

import { useEffect, useRef } from "react";

/** Single AdSense ad unit. No-ops if not configured. */
export function AdSlot({
  publisherId,
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: {
  publisherId?: string;
  slot?: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !publisherId || !slot) return;
    try {
      // @ts-expect-error adsbygoogle global injected by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, [publisherId, slot]);

  if (!publisherId || !slot) return null;

  return (
    <ins
      ref={ref}
      className={`adsbygoogle ${className}`}
      style={{ display: "block", ...style }}
      data-ad-client={publisherId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}

/** Activates any raw <ins.adsbygoogle> injected via HTML (e.g. in-article ads). */
export function AdsbygooglePusher() {
  useEffect(() => {
    const inses = document.querySelectorAll<HTMLModElement>("ins.adsbygoogle:not([data-adsbygoogle-status])");
    inses.forEach(() => {
      try {
        // @ts-expect-error adsbygoogle global
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    });
  }, []);
  return null;
}

/** Fixed sticky ad bar at the bottom on mobile. */
export function StickyMobileAd({ publisherId, slot }: { publisherId?: string; slot?: string }) {
  if (!publisherId || !slot) return null;
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-surface-dark/95 border-t border-slate-200 dark:border-slate-700 shadow-2xl">
      <div className="relative">
        <AdSlot publisherId={publisherId} slot={slot} className="min-h-[60px]" />
      </div>
    </div>
  );
}
