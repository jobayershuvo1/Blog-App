import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import Category from "@/models/Category";
import { POST_STATUS } from "@/lib/constants";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/search"), changeFrequency: "weekly", priority: 0.5 },
    { url: absoluteUrl("/register-author"), changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    await connectDB();
    const [posts, cats] = await Promise.all([
      Post.find({ status: POST_STATUS.APPROVED }).select("slug updatedAt").sort({ publishedAt: -1 }).limit(5000).lean(),
      Category.find().select("slug updatedAt").lean(),
    ]);

    for (const p of posts as any[]) {
      base.push({ url: absoluteUrl(`/post/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.8 });
    }
    for (const c of cats as any[]) {
      base.push({ url: absoluteUrl(`/category/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {
    // DB unavailable at build/runtime — return the static entries only.
  }

  return base;
}
