import Script from "next/script";

/** Loads the AdSense loader script (covers manual + auto ads). */
export function AdSenseScript({ publisherId, enabled }: { publisherId?: string; enabled?: boolean }) {
  if (!enabled || !publisherId) return null;
  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
    />
  );
}
