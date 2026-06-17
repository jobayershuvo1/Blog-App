import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { formatNumber } from "@/lib/utils";
import type { PostCardData } from "@/lib/types";

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group card-hover rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-surface-dark-card">
      <Link href={`/post/${post.slug}`} className="block relative h-48 overflow-hidden">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-primary opacity-80" />
        )}
        {post.category && (
          <span
            className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow"
            style={{ backgroundColor: post.category.color }}
          >
            {post.category.icon} {post.category.name}
          </span>
        )}
      </Link>
      <div className="p-5">
        <Link href={`/post/${post.slug}`}>
          <h3 className="font-serif text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>
        {post.excerpt && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {post.author && (
              <Link
                href={post.author.username ? `/author/${post.author.username}` : "#"}
                className="flex items-center gap-2 hover:text-primary"
              >
                {post.author.avatar ? (
                  <Image
                    src={post.author.avatar}
                    alt={post.author.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                    {post.author.name.charAt(0)}
                  </span>
                )}
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {post.author.name}
                </span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {post.readingTime}m
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {formatNumber(post.views)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
