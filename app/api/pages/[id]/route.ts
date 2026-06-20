import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import Page from "@/models/Page";

const schema = z.object({
  title: z.string().min(1).max(120).optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  metaDescription: z.string().max(200).optional(),
  published: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid data.", 422);

  await connectDB();
  const page = await Page.findById(params.id);
  if (!page) return error("Page not found.", 404);
  const d = parsed.data;
  if (d.title !== undefined) page.title = d.title;
  if (d.slug && !page.isSystem) page.slug = slugify(d.slug);
  if (d.content !== undefined) page.content = d.content;
  if (d.metaDescription !== undefined) page.metaDescription = d.metaDescription;
  if (d.published !== undefined) page.published = d.published;
  await page.save();
  return json({ page });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();
  const page = await Page.findById(params.id);
  if (!page) return error("Page not found.", 404);
  if (page.isSystem) return error("System pages can't be deleted (unpublish instead).", 403);
  await page.deleteOne();
  return json({ message: "Page deleted." });
}
