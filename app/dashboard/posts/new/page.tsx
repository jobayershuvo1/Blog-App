import { PostEditor } from "@/components/editor/PostEditor";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return <PostEditor initial={{ title: "", content: "", tags: [] }} />;
}
