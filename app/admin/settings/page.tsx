"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { Card, Input, Textarea, Label, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface Settings {
  siteName: string; tagline: string; logo?: string; favicon?: string;
  social: Record<string, string>;
  gaId?: string;
  ads: { header?: string; sidebar?: string; inArticle?: string };
  adsense?: {
    enabled?: boolean; publisherId?: string; autoAds?: boolean; paragraphsPerAd?: number;
    slots?: { header?: string; sidebar?: string; footer?: string; inArticle?: string; stickyMobile?: string };
  };
  homepageLayout: string; footerText: string;
  colors: { primary: string; secondary: string; accent: string };
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setS(d.settings)).catch(() => {});
  }, []);

  async function save() {
    if (!s) return;
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Settings saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally { setBusy(false); }
  }

  if (!s) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Site Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Configure your blog (super admin only).</p>
        </div>
        <Button loading={busy} onClick={save}><Save className="h-4 w-4" />Save</Button>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">General</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Site name</Label><Input value={s.siteName} onChange={(e) => set({ siteName: e.target.value })} /></div>
          <div><Label>Tagline</Label><Input value={s.tagline} onChange={(e) => set({ tagline: e.target.value })} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Logo URL</Label><Input value={s.logo || ""} onChange={(e) => set({ logo: e.target.value })} placeholder="https://" /></div>
          <div><Label>Favicon URL</Label><Input value={s.favicon || ""} onChange={(e) => set({ favicon: e.target.value })} placeholder="https://" /></div>
        </div>
        <div>
          <Label>Homepage layout</Label>
          <Select value={s.homepageLayout} onChange={(e) => set({ homepageLayout: e.target.value })}>
            <option value="magazine">Magazine</option>
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </Select>
        </div>
        <div><Label>Footer text</Label><Textarea rows={2} value={s.footerText} onChange={(e) => set({ footerText: e.target.value })} /></div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Social links</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["twitter", "facebook", "instagram", "youtube", "github", "linkedin"] as const).map((k) => (
            <div key={k}><Label className="capitalize">{k}</Label><Input value={s.social?.[k] || ""} onChange={(e) => set({ social: { ...s.social, [k]: e.target.value } })} placeholder="https://" /></div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Analytics & Ads</h3>
        <div><Label>Google Analytics ID (GA4)</Label><Input value={s.gaId || ""} onChange={(e) => set({ gaId: e.target.value })} placeholder="G-XXXXXXXXXX" /></div>
        <div><Label>AdSense — Header</Label><Textarea rows={2} value={s.ads?.header || ""} onChange={(e) => set({ ads: { ...s.ads, header: e.target.value } })} placeholder="<script>…</script>" /></div>
        <div><Label>AdSense — Sidebar</Label><Textarea rows={2} value={s.ads?.sidebar || ""} onChange={(e) => set({ ads: { ...s.ads, sidebar: e.target.value } })} /></div>
        <div><Label>AdSense — In-article (raw)</Label><Textarea rows={2} value={s.ads?.inArticle || ""} onChange={(e) => set({ ads: { ...s.ads, inArticle: e.target.value } })} /></div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Google AdSense Management</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!s.adsense?.enabled} onChange={(e) => set({ adsense: { ...s.adsense, enabled: e.target.checked } })} />
            Ads enabled
          </label>
        </div>
        <div><Label>Publisher ID</Label><Input value={s.adsense?.publisherId || ""} onChange={(e) => set({ adsense: { ...s.adsense, publisherId: e.target.value } })} placeholder="ca-pub-XXXXXXXXXXXXXXXX" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s.adsense?.autoAds} onChange={(e) => set({ adsense: { ...s.adsense, autoAds: e.target.checked } })} />Auto Ads</label>
          <div><Label>Ads after every N paragraphs</Label><Input type="number" min={1} value={s.adsense?.paragraphsPerAd ?? 3} onChange={(e) => set({ adsense: { ...s.adsense, paragraphsPerAd: parseInt(e.target.value || "3", 10) } })} className="h-9" /></div>
        </div>
        <p className="text-xs text-slate-400">Ad unit slot IDs (data-ad-slot) for each placement:</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {(["header", "sidebar", "footer", "inArticle", "stickyMobile"] as const).map((k) => (
            <div key={k}><Label className="capitalize">{k}</Label><Input value={s.adsense?.slots?.[k] || ""} onChange={(e) => set({ adsense: { ...s.adsense, slots: { ...s.adsense?.slots, [k]: e.target.value } } })} placeholder="ad slot id" /></div>
          ))}
        </div>
        <p className="text-xs text-slate-400">ads.txt auto-served at <code>/ads.txt</code> from your Publisher ID. Real revenue/CTR/RPM needs the AdSense Management API (not included).</p>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Theme colors</h3>
        <div className="grid grid-cols-3 gap-4">
          {(["primary", "secondary", "accent"] as const).map((k) => (
            <div key={k}>
              <Label className="capitalize">{k}</Label>
              <input type="color" value={s.colors?.[k]} onChange={(e) => set({ colors: { ...s.colors, [k]: e.target.value } })} className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-600 cursor-pointer" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
