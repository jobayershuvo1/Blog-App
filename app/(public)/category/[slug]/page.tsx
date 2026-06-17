import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getPostsByCategory } from "@/lib/queries";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { POSTS_PER_PAGE } from "@/lib/constants";
import { absoluteUrl } from "@/lib/utils";

interface Props {
  params: { slug: string };
  searchParams: { page?: string; sort?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: "Category not found" };
  return {
    title: cat.name,
    description: cat.description || `Posts in ${cat.name}`,
    alternates: { canonical: absoluteUrl(`/category/${cat.slug}`) },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();

  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const sort = (searchParams.sort === "views" ? "views" : "latest") as "latest" | "views";
  const { posts, total } = await getPostsByCategory(cat._id, { page, sort });

  return (
    <div>
      {/* Header */}
      <header className="relative h-64 flex items-end" style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}99)` }}>
        {cat.coverImage && (
          <Image src={cat.coverImage} alt={cat.name} fill className="object-cover opacity-30" />
        )}
        <div className="relative container-prose pb-8 text-white">
          <div className="text-5xl">{cat.icon}</div>
          <h1 className="mt-2 font-serif text-4xl font-bold">{cat.name}</h1>
          {cat.description && <p className="mt-1 max-w-2xl text-white/90">{cat.description}</p>}
          <p className="mt-2 text-sm text-white/80">{total} posts</p>
        </div>
      </header>

      <div className="container-prose py-10">
        {/* Sort */}
        <div className="mb-6 flex gap-2">
          <a href={`/category/${cat.slug}?sort=latest`} className={`h-9 px-4 rounded-lg text-sm font-medium flex items-center ${sort === "latest" ? "btn-gradient" : "border border-slate-300 dark:border-slate-600"}`}>Latest</a>
          <a href={`/category/${cat.slug}?sort=views`} className={`h-9 px-4 rounded-lg text-sm font-medium flex items-center ${sort === "views" ? "btn-gradient" : "border border-slate-300 dark:border-slate-600"}`}>Most viewed</a>
        </div>

        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
            <Pagination basePath={`/category/${cat.slug}`} page={page} total={total} perPage={POSTS_PER_PAGE} extraParams={`sort=${sort}`} />
          </>
        ) : (
          <EmptyState title="No posts in this category yet" description="Check back soon." />
        )}
      </div>
    </div>
  );
}
