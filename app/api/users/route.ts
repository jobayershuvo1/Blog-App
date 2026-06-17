import { connectDB } from "@/lib/db";
import { json, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";
import Post from "@/models/Post";

export async function GET(req: Request) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();

  const role = new URL(req.url).searchParams.get("role");
  const filter: Record<string, unknown> = role
    ? { role }
    : { role: { $in: [ROLES.AUTHOR, ROLES.MODERATOR, ROLES.SUPER_ADMIN] } };

  const users = await User.find(filter).sort({ createdAt: -1 }).lean();

  // attach post counts
  const withCounts = await Promise.all(
    users.map(async (u: any) => ({
      ...u,
      _id: String(u._id),
      postCount: await Post.countDocuments({ author: u._id }),
    }))
  );

  return json({ users: withCounts });
}
