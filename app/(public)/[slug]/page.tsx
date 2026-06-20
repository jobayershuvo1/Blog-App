import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/queries";
import { ContactForm } from "@/components/blog/ContactForm";
import { openLinksInNewTab, absoluteUrl, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPageBySlug(params.slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: absoluteUrl(`/${page.slug}`) },
  };
}

export default async function StaticPage({ params }: Props) {
  const page = await getPageBySlug(params.slug);
  if (!page) notFound();

  return (
    <article className="container-prose py-12 max-w-3xl">
      <nav className="mb-4 text-sm text-slate-400">Home / {page.title}</nav>
      <h1 className="font-serif text-4xl font-bold">{page.title}</h1>
      {page.updatedAt && (
        <p className="mt-2 text-sm text-slate-400">Last updated {formatDate(page.updatedAt)}</p>
      )}
      <div
        className="prose-content max-w-none mt-8"
        dangerouslySetInnerHTML={{ __html: openLinksInNewTab(page.content) }}
      />
      {page.slug === "contact" && <ContactForm />}
    </article>
  );
}
