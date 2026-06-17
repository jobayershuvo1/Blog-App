"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Wand2, Languages, Save, Send, Rocket, Calendar } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { CoverPhoto } from "./CoverPhoto";
import { TagsInput } from "./TagsInput";
import { SeoPanel, type SeoData } from "./SeoPanel";
import { AIGenerator, type GeneratedPost } from "./AIGenerator";
import { Translator } from "./Translator";
import { DownloadLinksEditor, type DLink } from "./DownloadLinksEditor";
import { Card, Input, Label, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { slugify } from "@/lib/utils";
import { hasAtLeast } from "@/lib/constants";

interface Category { _id: string; name: string; color: string; icon: string }

export interface InitialPost {
  _id?: string;
  title: string;
  slug?: string;
  content: string;
  coverImage?: string;
  category?: string | null;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  downloadLinks?: DLink[];
  featured?: boolean;
  scheduledAt?: string | null;
}

export function PostEditor({ initial, postId }: { initial?: InitialPost; postId?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isPrivileged = hasAtLeast(session?.user?.role, "moderator");

  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [content, setContent] = useState(initial?.content || "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [tags, setTags] = useState<string[]>(initial?.tags || []);
  const [seo, setSeo] = useState<SeoData>({
    metaTitle: initial?.metaTitle || "",
    metaDescription: initial?.metaDescription || "",
    focusKeyword: initial?.focusKeyword || "",
  });
  const [downloadLinks, setDownloadLinks] = useState<DLink[]>(initial?.downloadLinks || []);
  const [featured, setFeatured] = useState(Boolean(initial?.featured));
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ? initial.scheduledAt.slice(0, 16) : "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [trOpen, setTrOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories((d.categories || []).map((c: any) => ({ ...c, _id: String(c._id) })))).catch(() => {});
  }, []);

  // auto-slug from title until user edits slug manually
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  // Keep any link that has a URL; auto-add https:// when the protocol is missing
  // (otherwise the server rejects it as invalid) and fall back to a sensible label.
  const validDownloads = useMemo(
    () =>
      downloadLinks
        .filter((l) => l.url.trim())
        .map((l) => {
          const rawUrl = l.url.trim();
          const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
          return { ...l, url, label: l.label.trim() || "Download" };
        }),
    [downloadLinks]
  );

  async function save(intent: "draft" | "submit" | "publish") {
    if (!title.trim()) return toast.error("Please add a title.");
    if (!content.trim() || content === "<p></p>") return toast.error("Please write some content.");
    setSaving(intent);
    const payload = {
      title,
      content,
      coverImage,
      category: category || null,
      tags,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      focusKeyword: seo.focusKeyword,
      downloadLinks: validDownloads,
      featured: isPrivileged ? featured : undefined,
      scheduledAt: isPrivileged && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      intent,
    };
    try {
      const res = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
        method: postId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        intent === "draft" ? "Draft saved." : intent === "submit" ? "Submitted for review." : "Published!"
      );
      router.push("/dashboard/posts");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(null);
    }
  }

  function applyGenerated(post: GeneratedPost) {
    if (!title) setTitle(post.title);
    setContent(post.content);
    if (!seo.metaDescription) setSeo((s) => ({ ...s, metaDescription: post.metaDescription }));
    setTags((t) => Array.from(new Set([...t, ...post.tags])));
    toast.success("Inserted! Review and edit as needed.");
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">{postId ? "Edit Post" : "New Post"}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}><Wand2 className="h-4 w-4" />AI Generate</Button>
          <Button variant="outline" size="sm" onClick={() => setTrOpen(true)}><Languages className="h-4 w-4" />Translate</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* Main column */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title…"
              className="w-full bg-transparent font-serif text-2xl font-bold focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="shrink-0">/post/</span>
              <input
                value={slug}
                onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
                placeholder="slug"
                className="flex-1 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none focus:border-primary"
              />
            </div>
          </Card>

          <RichTextEditor value={content} onChange={setContent} />

          <Card className="p-4">
            <Label>Download links</Label>
            <DownloadLinksEditor links={downloadLinks} onChange={setDownloadLinks} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish */}
          <Card className="p-4 space-y-3">
            <Label>Publish</Label>
            <Button onClick={() => save("draft")} loading={saving === "draft"} variant="secondary" className="w-full"><Save className="h-4 w-4" />Save draft</Button>
            <Button onClick={() => save("submit")} loading={saving === "submit"} className="w-full"><Send className="h-4 w-4" />Submit for review</Button>
            {isPrivileged && (
              <>
                <Button onClick={() => save("publish")} loading={saving === "publish"} variant="success" className="w-full"><Rocket className="h-4 w-4" />Publish now</Button>
                <div>
                  <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Schedule publish</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-9 text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                  Feature on homepage
                </label>
              </>
            )}
          </Card>

          {/* Cover */}
          <Card className="p-4 space-y-2">
            <Label>Cover photo</Label>
            <CoverPhoto value={coverImage} onChange={setCoverImage} titleHint={title} />
          </Card>

          {/* Category */}
          <Card className="p-4 space-y-2">
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">— Select —</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
            </Select>
          </Card>

          {/* Tags */}
          <Card className="p-4 space-y-2">
            <Label>Tags</Label>
            <TagsInput tags={tags} onChange={setTags} contentForAI={content} titleForAI={title} />
          </Card>

          {/* SEO */}
          <SeoPanel seo={seo} onChange={setSeo} title={title} content={content} slug={slug} />
        </div>
      </div>

      <AIGenerator open={aiOpen} onClose={() => setAiOpen(false)} onInsert={applyGenerated} />
      <Translator
        open={trOpen}
        onClose={() => setTrOpen(false)}
        title={title}
        content={content}
        onApply={({ title: t, content: c }) => {
          if (t) setTitle(t);
          if (c) setContent(c);
        }}
      />
    </div>
  );
}
