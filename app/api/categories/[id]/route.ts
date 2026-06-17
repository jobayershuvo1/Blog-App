import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import Category from "@/models/Category";
import Post from "@/models/Post";

const schema = z.object({
  name: z.string().min(1).max(60).optional(),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().max(8).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  order: z.number().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid data.", 422);

  await connectDB();
  const cat = await Category.findById(params.id);
  if (!cat) return error("Category not found.", 404);

  const d = parsed.data;
  if (d.name && d.name !== cat.name) {
    cat.name = d.name;
    cat.slug = slugify(d.name);
  }
  if (d.description !== undefined) cat.description = d.description;
  if (d.color !== undefined) cat.color = d.color;
  if (d.icon !== undefined) cat.icon = d.icon;
  if (d.coverImage !== undefined) cat.coverImage = d.coverImage || undefined;
  if (d.order !== undefined) cat.order = d.order;
  await cat.save();
  return json({ category: cat });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();
  // Detach posts from the category rather than deleting them.
  await Post.updateMany({ category: params.id }, { $unset: { category: "" } });
  await Category.findByIdAndDelete(params.id);
  return json({ message: "Category deleted." });
}
