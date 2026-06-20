import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import Page from "@/models/Page";

export async function GET() {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();
  const pages = await Page.find().sort({ order: 1, title: 1 }).lean();
  return json({ pages });
}

const schema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().optional(),
  content: z.string().default(""),
  metaDescription: z.string().max(200).optional(),
  published: z.boolean().optional(),
});

export async function POST(req: Request) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid data.", 422);

  await connectDB();
  const slug = slugify(parsed.data.slug || parsed.data.title);
  if (await Page.findOne({ slug })) return error("A page with that slug exists.", 409);
  const page = await Page.create({ ...parsed.data, slug });
  return json({ page }, 201);
}
