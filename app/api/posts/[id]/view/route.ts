import { connectDB } from "@/lib/db";
import { json } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/utils";
import Post from "@/models/Post";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ip = getClientIp(req.headers);
  // 1 view per IP per post per 24h
  const limit = rateLimit(`view:${params.id}:${ip}`, 1, 24 * 60 * 60 * 1000);
  if (!limit.success) return json({ counted: false });

  await connectDB();
  await Post.updateOne({ _id: params.id }, { $inc: { views: 1 } });
  return json({ counted: true });
}
