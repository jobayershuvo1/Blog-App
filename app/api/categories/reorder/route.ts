import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import Category from "@/models/Category";

const schema = z.object({ ids: z.array(z.string()) });

export async function POST(req: Request) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid data.", 422);

  await connectDB();
  await Promise.all(
    parsed.data.ids.map((id, order) => Category.findByIdAndUpdate(id, { order }))
  );
  return json({ message: "Reordered." });
}
