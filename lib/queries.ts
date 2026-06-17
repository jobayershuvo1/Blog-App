import "server-only";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import Category from "@/models/Category";
import User from "@/models/User";
import { POST_STATUS, POSTS_PER_PAGE } from "@/lib/constants";
import { readingTime } from "@/lib/utils";
import type { PostCardData, CategoryLite } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toCard(p: any): PostCardData {
  return {
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage ?? null,
    tags: p.tags ?? [],
    views: p.views ?? 0,
    readingTime: p.content ? readingTime(p.content) : 1,
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    author: p.author
      ? {
          _id: String(p.author._id),
          name: p.author.name,
          username: p.author.username ?? null,
          avatar: p.author.avatar ?? null,
          bio: p.author.bio ?? null,
        }
      : null,
    category: p.category
      ? {
          _id: String(p.category._id),
          name: p.category.name,
          slug: p.category.slug,
          color: p.category.color,
          icon: p.category.icon,
        }
      : null,
  };
}

const CARD_FIELDS =
  "title slug excerpt coverImage tags views publishedAt author category content";

/** Posts that are publicly visible: approved and past their publish time. */
function publishedFilter(extra: Record<string, unknown> = {}) {
  return {
    status: POST_STATUS.APPROVED,
    publishedAt: { $lte: new Date() },
    ...extra,
  };
}

export async function getLatestPosts(limit = POSTS_PER_PAGE, skip = 0): Promise<PostCardData[]> {
  await connectDB();
  const posts = await Post.find(publishedFilter())
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(CARD_FIELDS)
    .populate("author", "name username avatar bio")
    .populate("category", "name slug color icon")
    .lean();
  return posts.map(toCard);
}

export async function getFeaturedPost(): Promise<PostCardData | null> {
  await connectDB();
  const featured =
    (await Post.findOne(publishedFilter({ featured: true }))
      .sort({ publishedAt: -1 })
      .select(CARD_FIELDS)
      .populate("author", "name username avatar bio")
      .populate("category", "name slug color icon")
      .lean()) ||
    (await Post.findOne(publishedFilter())
      .sort({ publishedAt: -1 })
      .select(CARD_FIELDS)
      .populate("author", "name username avatar bio")
      .populate("category", "name slug color icon")
      .lean());
  return featured ? toCard(featured) : null;
}

export async function getTrendingPosts(limit = 5): Promise<PostCardData[]> {
  await connectDB();
  const posts = await Post.find(publishedFilter())
    .sort({ views: -1, publishedAt: -1 })
    .limit(limit)
    .select(CARD_FIELDS)
    .populate("author", "name username avatar")
    .populate("category", "name slug color icon")
    .lean();
  return posts.map(toCard);
}

export async function getCategories(): Promise<(CategoryLite & { postCount: number })[]> {
  await connectDB();
  const cats = await Category.find().sort({ order: 1, name: 1 }).lean();
  return cats.map((c: any) => ({
    _id: String(c._id),
    name: c.name,
    slug: c.slug,
    color: c.color,
    icon: c.icon,
    postCount: c.postCount ?? 0,
  }));
}

export async function getCategoryBySlug(slug: string) {
  await connectDB();
  const cat = await Category.findOne({ slug }).lean<any>();
  if (!cat) return null;
  return {
    _id: String(cat._id),
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? "",
    color: cat.color,
    icon: cat.icon,
    coverImage: cat.coverImage ?? null,
    postCount: cat.postCount ?? 0,
  };
}

export async function getPostsByCategory(
  categoryId: string,
  opts: { page?: number; sort?: "latest" | "views" } = {}
): Promise<{ posts: PostCardData[]; total: number }> {
  await connectDB();
  const page = Math.max(1, opts.page ?? 1);
  const sort: Record<string, 1 | -1> = opts.sort === "views" ? { views: -1 } : { publishedAt: -1 };
  const filter = publishedFilter({ category: categoryId });
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort(sort)
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE)
      .select(CARD_FIELDS)
      .populate("author", "name username avatar")
      .populate("category", "name slug color icon")
      .lean(),
    Post.countDocuments(filter),
  ]);
  return { posts: posts.map(toCard), total };
}

export async function getPostBySlug(slug: string) {
  await connectDB();
  const post = await Post.findOne({ slug, status: POST_STATUS.APPROVED })
    .populate("author", "name username avatar bio socialLinks")
    .populate("category", "name slug color icon")
    .lean<any>();
  if (!post) return null;

  return {
    _id: String(post._id),
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt ?? "",
    coverImage: post.coverImage ?? null,
    tags: post.tags ?? [],
    views: post.views ?? 0,
    shares: post.shares ?? 0,
    readingTime: readingTime(post.content),
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    focusKeyword: post.focusKeyword ?? "",
    downloadLinks: (post.downloadLinks ?? []).map((d: any) => ({
      label: d.label,
      url: d.url,
      fileType: d.fileType,
      downloads: d.downloads ?? 0,
    })),
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    author: post.author
      ? {
          _id: String(post.author._id),
          name: post.author.name,
          username: post.author.username ?? null,
          avatar: post.author.avatar ?? null,
          bio: post.author.bio ?? null,
          socialLinks: post.author.socialLinks ?? {},
        }
      : null,
    category: post.category
      ? {
          _id: String(post.category._id),
          name: post.category.name,
          slug: post.category.slug,
          color: post.category.color,
          icon: post.category.icon,
        }
      : null,
  };
}

export async function getRelatedPosts(
  categoryId: string | null,
  excludeId: string,
  limit = 3
): Promise<PostCardData[]> {
  await connectDB();
  const filter = publishedFilter({
    _id: { $ne: excludeId },
    ...(categoryId ? { category: categoryId } : {}),
  });
  const posts = await Post.find(filter)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select(CARD_FIELDS)
    .populate("author", "name username avatar")
    .populate("category", "name slug color icon")
    .lean();
  return posts.map(toCard);
}

export async function getAuthorByUsername(username: string) {
  await connectDB();
  const author = await User.findOne({ username }).lean<any>();
  if (!author) return null;
  const posts = await Post.find(publishedFilter({ author: author._id }))
    .sort({ publishedAt: -1 })
    .select(CARD_FIELDS)
    .populate("category", "name slug color icon")
    .lean();
  return {
    author: {
      _id: String(author._id),
      name: author.name,
      username: author.username,
      avatar: author.avatar ?? null,
      bio: author.bio ?? "",
      socialLinks: author.socialLinks ?? {},
      joinedAt: new Date(author.createdAt).toISOString(),
    },
    posts: posts.map((p: any) => toCard({ ...p, author })),
  };
}

export async function searchPosts(q: string, page = 1): Promise<{ posts: PostCardData[]; total: number }> {
  await connectDB();
  if (!q.trim()) return { posts: [], total: 0 };
  const filter = publishedFilter({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
      { excerpt: { $regex: q, $options: "i" } },
    ],
  });
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE)
      .select(CARD_FIELDS)
      .populate("author", "name username avatar")
      .populate("category", "name slug color icon")
      .lean(),
    Post.countDocuments(filter),
  ]);
  return { posts: posts.map(toCard), total };
}
