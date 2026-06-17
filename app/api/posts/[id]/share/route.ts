import { connectDB } from "@/lib/db";
import { json } from "@/lib/api";
import Post from "@/models/Post";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  await Post.updateOne({ _id: params.id }, { $inc: { shares: 1 } });
  return json({ ok: true });
}
