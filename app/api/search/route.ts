import { connectDB } from "@/lib/db";
import { json } from "@/lib/api";
import { POST_STATUS } from "@/lib/constants";
import Post from "@/models/Post";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const suggest = sp.get("suggest") === "1";
  if (q.length < 2) return json({ results: [] });

  await connectDB();
  const filter = {
    status: POST_STATUS.APPROVED,
    publishedAt: { $lte: new Date() },
    $or: [
      { title: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
    ],
  };

  const results = await Post.find(filter)
    .sort({ views: -1 })
    .limit(suggest ? 6 : 20)
    .select("title slug")
    .lean();

  return json({ results: results.map((r: any) => ({ _id: String(r._id), title: r.title, slug: r.slug })) });
}
