import type { Metadata } from "next";
import { Search as SearchIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/blog/SearchBar";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { searchPosts } from "@/lib/queries";
import { POSTS_PER_PAGE } from "@/lib/constants";

export const metadata: Metadata = { title: "Search" };

interface Props {
  searchParams: { q?: string; page?: string };
}

export default async function SearchPage({ searchParams }: Props) {
  const t = await getTranslations("search");
  const q = (searchParams.q || "").trim();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const { posts, total } = q ? await searchPosts(q, page) : { posts: [], total: 0 };

  return (
    <div className="container-prose py-10">
      <h1 className="font-serif text-3xl font-bold mb-6">{t("title")}</h1>
      <div className="max-w-2xl">
        <SearchBar initialQuery={q} />
      </div>

      <div className="mt-8">
        {!q ? (
          <EmptyState icon={<SearchIcon className="h-8 w-8" />} title={t("placeholder")} description={t("tryAgain")} />
        ) : posts.length > 0 ? (
          <>
            <p className="mb-5 text-slate-500 dark:text-slate-400">
              {total} {t("resultsFor")} <span className="font-semibold text-slate-900 dark:text-slate-100">&ldquo;{q}&rdquo;</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
            <Pagination basePath="/search" page={page} total={total} perPage={POSTS_PER_PAGE} extraParams={`q=${encodeURIComponent(q)}`} />
          </>
        ) : (
          <EmptyState icon={<SearchIcon className="h-8 w-8" />} title={t("noResults") || "No results"} description={t("tryAgain")} />
        )}
      </div>
    </div>
  );
}
