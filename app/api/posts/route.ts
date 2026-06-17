import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole, requireUser } from "@/lib/api";
import { POST_STATUS, ROLES } from "@/lib/constants";
import { hasAtLeast } from "@/lib/constants";
import { slugify, excerpt as makeExcerpt } from "@/lib/utils";
import Post from "@/models/Post";
import Category from "@/models/Category";

const downloadSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  fileType: z.string().default("other"),
});

const postSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(400).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(200).optional(),
  focusKeyword: z.string().optional(),
  downloadLinks: z.array(downloadSchema).default([]),
  featured: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  // "draft" → save as draft, "submit" → pending, "publish" → approved (mod/admin only)
  intent: z.enum(["draft", "submit", "publish"]).default("draft"),
});

async function uniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const root = slugify(title) || "post";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (true) {
    const existing = await Post.findOne({ slug: candidate });
    if (!existing || (ignoreId && String(existing._id) === ignoreId)) break;
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

export async function POST(req: Request) {
  const { user, res } = await requireRole(ROLES.AUTHOR);
  if (res) return res;

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid post data.", 422);
  const d = parsed.data;

  await connectDB();
  const slug = await uniqueSlug(d.title);
  const isPrivileged = hasAtLeast(user!.role, ROLES.MODERATOR);

  let status: string = POST_STATUS.DRAFT;
  let publishedAt: Date | undefined;
  if (d.intent === "submit") status = POST_STATUS.PENDING;
  if (d.intent === "publish" && isPrivileged) {
    status = POST_STATUS.APPROVED;
    publishedAt = d.scheduledAt ? new Date(d.scheduledAt) : new Date();
  }

  const post = await Post.create({
    title: d.title,
    slug,
    content: d.content,
    excerpt: d.excerpt || makeExcerpt(d.content),
    coverImage: d.coverImage || undefined,
    author: user!.id,
    category: d.category || undefined,
    tags: d.tags,
    metaTitle: d.metaTitle,
    metaDescription: d.metaDescription,
    focusKeyword: d.focusKeyword,
    downloadLinks: d.downloadLinks.map((l) => ({ ...l, downloads: 0 })),
    featured: isPrivileged ? Boolean(d.featured) : false,
    status,
    publishedAt,
    scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : undefined,
    approvedBy: status === POST_STATUS.APPROVED ? user!.id : undefined,
  });

  if (status === POST_STATUS.APPROVED && d.category) {
    await Category.findByIdAndUpdate(d.category, { $inc: { postCount: 1 } });
  }

  return json({ post: { _id: String(post._id), slug: post.slug } }, 201);
}

export async function GET(req: Request) {
  const { user, res } = await requireUser();
  if (res) return res;

  await connectDB();
  const url = new URL(req.url);
  const sp = url.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const perPage = Math.min(50, parseInt(sp.get("perPage") || "10", 10));
  const status = sp.get("status");
  const category = sp.get("category");
  const author = sp.get("author");
  const q = sp.get("q");
  const from = sp.get("from");
  const to = sp.get("to");

  const filter: Record<string, unknown> = {};
  // Authors only see their own posts; moderators+ see everything.
  if (!hasAtLeast(user!.role, ROLES.MODERATOR)) {
    filter.author = user!.id;
  } else if (author) {
    filter.author = author;
  }
  if (status && status !== "all") filter.status = status;
  if (category && category !== "all") filter.category = category;
  if (q) filter.title = { $regex: q, $options: "i" };
  if (from || to) {
    filter.createdAt = {};
    if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from);
    if (to) (filter.createdAt as Record<string, Date>).$lte = new Date(to);
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .select("title slug status views shares category author createdAt publishedAt rejectionReason coverImage")
      .populate("author", "name username")
      .populate("category", "name slug color icon")
      .lean(),
    Post.countDocuments(filter),
  ]);

  return json({ posts, total, page, perPage });
}
