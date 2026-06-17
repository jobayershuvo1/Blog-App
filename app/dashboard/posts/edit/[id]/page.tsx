import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { hasAtLeast } from "@/lib/constants";
import Post from "@/models/Post";
import { PostEditor, type InitialPost } from "@/components/editor/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const post = await Post.findById(params.id).lean<any>();
  if (!post) notFound();

  // Authors may only edit their own posts; moderators+ may edit any.
  if (!hasAtLeast(session.user.role, "moderator") && String(post.author) !== session.user.id) {
    redirect("/dashboard/posts");
  }

  const initial: InitialPost = {
    _id: String(post._id),
    title: post.title,
    slug: post.slug,
    content: post.content,
    coverImage: post.coverImage || "",
    category: post.category ? String(post.category) : "",
    tags: post.tags || [],
    metaTitle: post.metaTitle || "",
    metaDescription: post.metaDescription || "",
    focusKeyword: post.focusKeyword || "",
    downloadLinks: (post.downloadLinks || []).map((d: any) => ({ label: d.label, url: d.url, fileType: d.fileType })),
    featured: post.featured,
    scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString() : null,
  };

  return <PostEditor initial={initial} postId={String(post._id)} />;
}
