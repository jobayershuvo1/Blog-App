import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import Category from "@/models/Category";

export async function GET() {
  await connectDB();
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  return json({ categories });
}

const schema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).default("#6366f1"),
  icon: z.string().max(8).default("📝"),
  coverImage: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid data.", 422);

  await connectDB();
  const slug = slugify(parsed.data.name);
  if (await Category.findOne({ slug })) return error("A category with that name exists.", 409);

  const count = await Category.countDocuments();
  const category = await Category.create({
    ...parsed.data,
    coverImage: parsed.data.coverImage || undefined,
    slug,
    order: count,
  });
  return json({ category }, 201);
}
