import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL-friendly slug. Keeps Unicode letters so Bengali/Arabic titles work. */
export function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Strip HTML to plain text (server-safe, no DOM). */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(html: string, length = 160): string {
  const text = stripHtml(html);
  if (text.length <= length) return text;
  return text.slice(0, length).replace(/\s+\S*$/, "") + "…";
}

/** Estimate reading time in minutes (200 wpm). Counts CJK chars individually. */
export function readingTime(html: string): number {
  const text = stripHtml(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  const cjk = (text.match(/[一-鿿぀-ヿ]/g) || []).length;
  const minutes = Math.ceil((words + cjk) / 200);
  return Math.max(1, minutes);
}

export function formatDate(date: Date | string, locale = "en-US"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

/** Lightweight SEO score (0-100) used by the editor's indicator. */
export function seoScore(opts: {
  metaTitle?: string;
  metaDesc?: string;
  focusKeyword?: string;
  content?: string;
  title?: string;
}): { score: number; checks: { label: string; ok: boolean }[] } {
  const { metaTitle = "", metaDesc = "", focusKeyword = "", content = "", title = "" } = opts;
  const text = stripHtml(content).toLowerCase();
  const kw = focusKeyword.trim().toLowerCase();

  const checks = [
    { label: "Meta title set (≤ 60 chars)", ok: metaTitle.length > 0 && metaTitle.length <= 60 },
    { label: "Meta description set (50–160 chars)", ok: metaDesc.length >= 50 && metaDesc.length <= 160 },
    { label: "Focus keyword set", ok: kw.length > 0 },
    { label: "Keyword in title", ok: kw.length > 0 && title.toLowerCase().includes(kw) },
    { label: "Keyword in meta description", ok: kw.length > 0 && metaDesc.toLowerCase().includes(kw) },
    { label: "Keyword in content", ok: kw.length > 0 && text.includes(kw) },
    { label: "Content length ≥ 300 words", ok: text.split(/\s+/).filter(Boolean).length >= 300 },
  ];

  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}

export function seoColor(score: number): "green" | "yellow" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

/** Get the client IP from request headers (best-effort, behind proxies). */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "0.0.0.0";
}

/** Force every <a> in stored post HTML to open in a new tab (safely). */
export function openLinksInNewTab(html: string): string {
  if (!html) return html;
  return html.replace(
    /<a\b(?![^>]*\btarget=)/gi,
    '<a target="_blank" rel="noopener noreferrer"'
  );
}

export function absoluteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}
