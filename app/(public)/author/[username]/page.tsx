import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, Twitter, Facebook, Linkedin, Globe, Github } from "lucide-react";
import { getAuthorByUsername } from "@/lib/queries";
import { PostCard } from "@/components/blog/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, absoluteUrl } from "@/lib/utils";

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getAuthorByUsername(params.username);
  if (!data) return { title: "Author not found" };
  return {
    title: data.author.name,
    description: data.author.bio || `Posts by ${data.author.name}`,
    alternates: { canonical: absoluteUrl(`/author/${data.author.username}`) },
  };
}

export default async function AuthorPage({ params }: Props) {
  const data = await getAuthorByUsername(params.username);
  if (!data) notFound();
  const { author, posts } = data;
  const s = author.socialLinks || {};

  return (
    <div>
      <header className="bg-gradient-primary h-48" />
      <div className="container-prose -mt-20">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card p-8 text-center shadow-lg">
          {author.avatar ? (
            <Image src={author.avatar} alt={author.name} width={96} height={96} className="mx-auto rounded-full ring-4 ring-white dark:ring-surface-dark-card" />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-3xl font-bold text-primary ring-4 ring-white dark:ring-surface-dark-card">
              {author.name.charAt(0)}
            </div>
          )}
          <h1 className="mt-4 font-serif text-3xl font-bold">{author.name}</h1>
          {author.bio && <p className="mt-2 max-w-xl mx-auto text-slate-500 dark:text-slate-400">{author.bio}</p>}
          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-slate-400">
            <span>{posts.length} posts</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {formatDate(author.joinedAt)}</span>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {s.twitter && <a href={s.twitter} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"><Twitter className="h-4 w-4" /></a>}
            {s.facebook && <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"><Facebook className="h-4 w-4" /></a>}
            {s.linkedin && <a href={s.linkedin} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"><Linkedin className="h-4 w-4" /></a>}
            {s.github && <a href={s.github} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"><Github className="h-4 w-4" /></a>}
            {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"><Globe className="h-4 w-4" /></a>}
          </div>
        </div>
      </div>

      <div className="container-prose py-10">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <PostCard key={p._id} post={p} />
            ))}
          </div>
        ) : (
          <EmptyState title="No published posts yet" />
        )}
      </div>
    </div>
  );
}
