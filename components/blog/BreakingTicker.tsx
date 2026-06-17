import Link from "next/link";
import { Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { PostCardData } from "@/lib/types";

export async function BreakingTicker({ posts }: { posts: PostCardData[] }) {
  if (posts.length === 0) return null;
  const t = await getTranslations("home");
  const items = [...posts, ...posts]; // duplicate for seamless marquee loop

  return (
    <div className="flex items-center gap-3 border-y border-slate-200 dark:border-slate-700/60 bg-white dark:bg-surface-dark-card overflow-hidden">
      <span className="shrink-0 flex items-center gap-1.5 bg-gradient-accent text-white px-4 py-2.5 text-sm font-bold">
        <Zap className="h-4 w-4" /> {t("breaking")}
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee gap-10 py-2.5 whitespace-nowrap">
          {items.map((p, i) => (
            <Link
              key={`${p._id}-${i}`}
              href={`/post/${p.slug}`}
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-primary"
            >
              • {p.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
