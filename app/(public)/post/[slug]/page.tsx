import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Eye, Calendar, Twitter, Facebook, Globe } from "lucide-react";
import { getPostBySlug, getRelatedPosts } from "@/lib/queries";
import { PostCard } from "@/components/blog/PostCard";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { ViewTracker } from "@/components/blog/ViewTracker";
import { DownloadLinks } from "@/components/blog/DownloadLinks";
import { PostTranslate } from "@/components/blog/PostTranslate";
import { Badge } from "@/components/ui/primitives";
import { formatDate, formatNumber, absoluteUrl } from "@/lib/utils";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Post not found" };
  const url = absoluteUrl(`/post/${post.slug}`);
  const description = post.metaDescription || post.excerpt;
  return {
    title: post.metaTitle || post.title,
    description,
    alternates: { canonical: url },
    keywords: post.tags,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630 }] : [],
      publishedTime: post.publishedAt || undefined,
      authors: post.author ? [post.author.name] : [],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category?._id ?? null, post._id, 3);
  const url = absoluteUrl(`/post/${post.slug}`);

  // Article structured data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.coverImage ? [post.coverImage] : [],
    datePublished: post.publishedAt,
    author: post.author ? { "@type": "Person", name: post.author.name } : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: post.category?.name,
    keywords: post.tags.join(", "),
  };

  const social = post.author?.socialLinks || {};

  return (
    <article>
      <ViewTracker postId={post._id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Cover with title overlay */}
      <header className="relative h-[380px] sm:h-[480px]">
        {post.coverImage ? (
          <Image src={post.coverImage} alt={post.title} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="container-prose pb-10 w-full">
            {/* Breadcrumb */}
            <nav className="mb-3 text-sm text-slate-300 flex items-center gap-2">
              <Link href="/" className="hover:text-white">Home</Link>
              {post.category && (
                <>
                  <span>/</span>
                  <Link href={`/category/${post.category.slug}`} className="hover:text-white">{post.category.name}</Link>
                </>
              )}
            </nav>
            {post.category && (
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: post.category.color }}>
                {post.category.icon} {post.category.name}
              </span>
            )}
            <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-bold text-white leading-tight max-w-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-200">
              {post.author && <span className="font-medium">{post.author.name}</span>}
              {post.publishedAt && (
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(post.publishedAt)}</span>
              )}
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.readingTime} min read</span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{formatNumber(post.views)} views</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-prose py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div className="min-w-0">
          <PostTranslate postId={post._id} originalTitle={post.title} originalContent={post.content} />

          {/* Content */}
          <div className="prose-content max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

          <DownloadLinks links={post.downloadLinks} postId={post._id} />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                  <Badge color="primary">#{tag}</Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
            <ShareButtons url={url} title={post.title} postId={post._id} />
          </div>
        </div>

        {/* Sidebar: author card */}
        <aside className="space-y-6">
          {post.author && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card p-6 text-center">
              {post.author.avatar ? (
                <Image src={post.author.avatar} alt={post.author.name} width={72} height={72} className="mx-auto rounded-full" />
              ) : (
                <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <h3 className="mt-3 font-serif text-lg font-bold">
                {post.author.username ? (
                  <Link href={`/author/${post.author.username}`} className="hover:text-primary">{post.author.name}</Link>
                ) : (
                  post.author.name
                )}
              </h3>
              {post.author.bio && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{post.author.bio}</p>}
              <div className="mt-3 flex justify-center gap-2">
                {social.twitter && <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"><Twitter className="h-4 w-4" /></a>}
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"><Facebook className="h-4 w-4" /></a>}
                {social.website && <a href={social.website} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"><Globe className="h-4 w-4" /></a>}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-prose pb-16">
          <h2 className="font-serif text-2xl font-bold mb-5">Related posts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <PostCard key={p._id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
