import { getAdsense } from "@/lib/adsense";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getAdsense();
  // ca-pub-1234... -> pub-1234...
  const pub = cfg.publisherId.replace(/^ca-/, "");
  const body =
    cfg.enabled && pub
      ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
      : "# AdSense not configured yet\n";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
