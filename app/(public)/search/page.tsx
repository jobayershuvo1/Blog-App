import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/blog/SearchBar";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { searchPosts, getCategories } from "@/lib/queries";
import { POSTS_PER_PAGE } from "@/lib/constants";

export const metadata: Metadata = { title: "Search" };

interface Props {
  searchParams: { q?: string; page?: string; category?: string };
}

export default async function SearchPage({ searchParams }: Props) {
  const t = await getTranslations("search");
  const q = (searchParams.q || "").trim();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const categorySlug = searchParams.category || "";

  const categories = await getCategories();
  const activeCategory = categories.find((c) => c.slug === categorySlug) || null;

  const hasFilter = Boolean(q || activeCategory);
  const { posts, total } = hasFilter
    ? await searchPosts(q, page, activeCategory?._id)
    : { posts: [], total: 0 };

  // Build href helpers that preserve the other filter.
  const qParam = q ? `q=${encodeURIComponent(q)}` : "";
  const catHref = (slug?: string) =>
    `/search?${[qParam, slug ? `category=${slug}` : ""].filter(Boolean).join("&") || ""}` || "/search";
  const paginationExtra = [qParam, categorySlug ? `category=${categorySlug}` : ""].filter(Boolean).join("&");

  return (
    <div className="container-prose py-10">
      <h1 className="font-serif text-3xl font-bold mb-6">{t("title")}</h1>
      <div className="max-w-2xl">
        <SearchBar initialQuery={q} />
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={catHref()}
            className={`h-9 px-4 rounded-full text-sm font-medium flex items-center transition ${
              !activeCategory
                ? "bg-primary text-white"
                : "border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {t("all") || "All"}
          </Link>
          {categories.map((c) => {
            const active = activeCategory?._id === c._id;
            return (
              <Link
                key={c._id}
                href={catHref(c.slug)}
                style={active ? { backgroundColor: c.color, color: "#fff" } : undefined}
                className={`h-9 px-4 rounded-full text-sm font-medium flex items-center gap-1 transition ${
                  active ? "" : "border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{c.icon}</span> {c.name}
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        {!hasFilter ? (
          <EmptyState icon={<SearchIcon className="h-8 w-8" />} title={t("placeholder")} description={t("tryAgain")} />
        ) : posts.length > 0 ? (
          <>
            <p className="mb-5 text-slate-500 dark:text-slate-400">
              {total} {t("resultsFor")}{" "}
              {q && <span className="font-semibold text-slate-900 dark:text-slate-100">&ldquo;{q}&rdquo;</span>}
              {activeCategory && (
                <span>
                  {q ? " " : ""}in{" "}
                  <span className="font-semibold" style={{ color: activeCategory.color }}>
                    {activeCategory.icon} {activeCategory.name}
                  </span>
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
            <Pagination basePath="/search" page={page} total={total} perPage={POSTS_PER_PAGE} extraParams={paginationExtra} />
          </>
        ) : (
          <EmptyState icon={<SearchIcon className="h-8 w-8" />} title={t("noResults") || "No results"} description={t("tryAgain")} />
        )}
      </div>
    </div>
  );
}
