import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireUser, requireRole } from "@/lib/api";
import { POST_STATUS, ROLES, hasAtLeast, type Role } from "@/lib/constants";
import { slugify, excerpt as makeExcerpt } from "@/lib/utils";
import { emails } from "@/lib/mail";
import Post from "@/models/Post";
import Category from "@/models/Category";
import User from "@/models/User";

function canManage(post: { author: { toString(): string } }, user: { id: string; role: Role }) {
  return hasAtLeast(user.role, ROLES.MODERATOR) || post.author.toString() === user.id;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireUser();
  if (res) return res;
  await connectDB();
  const post = await Post.findById(params.id).lean<any>();
  if (!post) return error("Post not found.", 404);
  if (!hasAtLeast(user!.role, ROLES.MODERATOR) && post.author.toString() !== user!.id) {
    return error("Not allowed.", 403);
  }
  return json({ post: { ...post, _id: String(post._id) } });
}

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(400).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(200).optional(),
  focusKeyword: z.string().optional(),
  downloadLinks: z.array(z.object({ label: z.string(), url: z.string().url(), fileType: z.string() })).optional(),
  featured: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  intent: z.enum(["draft", "submit", "publish"]).optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireUser();
  if (res) return res;

  await connectDB();
  const post = await Post.findById(params.id);
  if (!post) return error("Post not found.", 404);
  if (!canManage(post, user!)) return error("Not allowed.", 403);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid data.", 422);
  const d = parsed.data;
  const isPrivileged = hasAtLeast(user!.role, ROLES.MODERATOR);

  if (d.title && d.title !== post.title) {
    post.title = d.title;
    // refresh slug while keeping uniqueness
    const root = slugify(d.title) || "post";
    let candidate = root;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (true) {
      const ex = await Post.findOne({ slug: candidate });
      if (!ex || String(ex._id) === params.id) break;
      candidate = `${root}-${n++}`;
    }
    post.slug = candidate;
  }
  if (d.content !== undefined) post.content = d.content;
  if (d.excerpt !== undefined) post.excerpt = d.excerpt || makeExcerpt(post.content);
  if (d.coverImage !== undefined) post.coverImage = d.coverImage || undefined;
  if (d.category !== undefined) post.category = (d.category || undefined) as never;
  if (d.tags !== undefined) post.tags = d.tags;
  if (d.metaTitle !== undefined) post.metaTitle = d.metaTitle;
  if (d.metaDescription !== undefined) post.metaDescription = d.metaDescription;
  if (d.focusKeyword !== undefined) post.focusKeyword = d.focusKeyword;
  if (d.downloadLinks !== undefined) {
    post.downloadLinks = d.downloadLinks.map((l) => ({ ...l, downloads: 0 })) as never;
  }
  if (isPrivileged && d.featured !== undefined) post.featured = d.featured;
  if (d.scheduledAt !== undefined) post.scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : undefined;

  // Status transitions
  const wasApproved = post.status === POST_STATUS.APPROVED;
  if (d.intent === "submit") {
    post.status = POST_STATUS.PENDING;
    post.rejectionReason = undefined;
  } else if (d.intent === "publish" && isPrivileged) {
    post.status = POST_STATUS.APPROVED;
    post.approvedBy = user!.id as never;
    if (!post.publishedAt) post.publishedAt = post.scheduledAt || new Date();
  } else if (d.intent === "draft" && !isPrivileged) {
    post.status = POST_STATUS.DRAFT;
  }

  await post.save();

  // keep category counts roughly in sync
  if (!wasApproved && post.status === POST_STATUS.APPROVED && post.category) {
    await Category.findByIdAndUpdate(post.category, { $inc: { postCount: 1 } });
  }

  return json({ post: { _id: String(post._id), slug: post.slug, status: post.status } });
}

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(1000).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return error("Invalid action.", 422);

  await connectDB();
  const post = await Post.findById(params.id).populate("author", "name email");
  if (!post) return error("Post not found.", 404);
  const author = post.author as unknown as { name: string; email: string };

  if (parsed.data.action === "approve") {
    const wasApproved = post.status === POST_STATUS.APPROVED;
    post.status = POST_STATUS.APPROVED;
    post.approvedBy = user!.id as never;
    post.rejectionReason = undefined;
    if (!post.publishedAt) post.publishedAt = post.scheduledAt || new Date();
    await post.save();
    if (!wasApproved && post.category) {
      await Category.findByIdAndUpdate(post.category, { $inc: { postCount: 1 } });
    }
    if (author?.email) emails.postApproved(author.email, author.name, post.title, post.slug).catch(() => {});
    return json({ message: "Post approved." });
  }

  const reason = parsed.data.reason?.trim() || "Your post needs revisions before publishing.";
  const wasApproved = post.status === POST_STATUS.APPROVED;
  post.status = POST_STATUS.REJECTED;
  post.rejectionReason = reason;
  await post.save();
  if (wasApproved && post.category) {
    await Category.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
  }
  if (author?.email) emails.postRejected(author.email, author.name, post.title, reason).catch(() => {});
  return json({ message: "Post rejected." });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireUser();
  if (res) return res;
  await connectDB();
  const post = await Post.findById(params.id);
  if (!post) return error("Post not found.", 404);
  if (!canManage(post, user!)) return error("Not allowed.", 403);

  if (post.status === POST_STATUS.APPROVED && post.category) {
    await Category.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
  }
  await post.deleteOne();
  void User;
  return json({ message: "Post deleted." });
}
