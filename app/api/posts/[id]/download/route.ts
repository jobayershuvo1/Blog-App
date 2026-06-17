import { connectDB } from "@/lib/db";
import { json, error } from "@/lib/api";
import Post from "@/models/Post";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const index = Number(body?.index);
  if (Number.isNaN(index)) return error("Invalid index.", 422);

  await connectDB();
  await Post.updateOne(
    { _id: params.id },
    { $inc: { [`downloadLinks.${index}.downloads`]: 1 } }
  );
  return json({ ok: true });
}
