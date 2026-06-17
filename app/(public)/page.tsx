import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Eye, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PostCard } from "@/components/blog/PostCard";
import { Newsletter } from "@/components/blog/Newsletter";
import { BreakingTicker } from "@/components/blog/BreakingTicker";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getFeaturedPost,
  getLatestPosts,
  getTrendingPosts,
  getCategories,
} from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const t = await getTranslations("home");
  const [featured, latest, trending, categories] = await Promise.all([
    getFeaturedPost(),
    getLatestPosts(9),
    getTrendingPosts(5),
    getCategories(),
  ]);

  const latestExcludingFeatured = latest.filter((p) => p._id !== featured?._id);

  return (
    <div>
      <BreakingTicker posts={trending} />

      {/* Hero */}
      {featured ? (
        <section className="container-prose py-8">
          <Link href={`/post/${featured.slug}`} className="group block relative h-[420px] sm:h-[520px] rounded-3xl overflow-hidden shadow-xl">
            {featured.coverImage ? (
              <Image src={featured.coverImage} alt={featured.title} fill priority sizes="100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="h-full w-full bg-gradient-primary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-0 p-6 sm:p-10 max-w-3xl">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white mb-3">
                ⭐ {t("heroBadge")}
              </span>
              {featured.category && (
                <span className="ml-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: featured.category.color }}>
                  {featured.category.icon} {featured.category.name}
                </span>
              )}
              <h1 className="mt-4 font-serif text-3xl sm:text-5xl font-bold text-white leading-tight line-clamp-3">
                {featured.title}
              </h1>
              <p className="mt-3 text-slate-200 line-clamp-2 max-w-2xl">{featured.excerpt}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-slate-300">
                {featured.author && <span>{featured.author.name}</span>}
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{featured.readingTime} min</span>
                <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{formatNumber(featured.views)}</span>
              </div>
            </div>
          </Link>
        </section>
      ) : (
        <section className="container-prose py-16">
          <EmptyState
            title="No posts yet"
            description="Once authors publish approved posts, they'll appear here."
            action={<Link href="/register-author" className="btn-gradient h-11 px-5 rounded-xl font-semibold inline-flex items-center">Become an author</Link>}
          />
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-prose py-8">
          <h2 className="font-serif text-2xl font-bold mb-5">{t("browseByCategory")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((c) => (
              <Link key={c._id} href={`/category/${c.slug}`} className="card-hover rounded-2xl p-5 text-white text-center shadow-lg" style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)` }}>
                <div className="text-3xl">{c.icon}</div>
                <div className="mt-2 font-semibold">{c.name}</div>
                <div className="text-xs text-white/80">{c.postCount} posts</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest + Trending */}
      <section className="container-prose py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl font-bold">{t("latestPosts")}</h2>
          </div>
          {latestExcludingFeatured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {latestExcludingFeatured.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing here yet" description="Check back soon for new stories." />
          )}
        </div>

        <aside className="space-y-4">
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" /> {t("trending")}
          </h2>
          <div className="space-y-3">
            {trending.map((p, i) => (
              <Link key={p._id} href={`/post/${p.slug}`} className="group flex gap-3 rounded-xl p-3 hover:bg-white dark:hover:bg-surface-dark-card border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition">
                <span className="font-serif text-2xl font-bold text-slate-300 dark:text-slate-600">{i + 1}</span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary">{p.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(p.views)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.readingTime}m</span>
                  </div>
                </div>
              </Link>
            ))}
            {trending.length === 0 && <p className="text-sm text-slate-400">No trending posts yet.</p>}
          </div>
        </aside>
      </section>

      <section className="container-prose py-12">
        <Newsletter />
      </section>
    </div>
  );
}
