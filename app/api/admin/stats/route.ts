import { connectDB } from "@/lib/db";
import { json, requireRole } from "@/lib/api";
import { ROLES, POST_STATUS, REQUEST_STATUS } from "@/lib/constants";
import Post from "@/models/Post";
import User from "@/models/User";
import AuthorRequest from "@/models/AuthorRequest";
import Category from "@/models/Category";

export async function GET() {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();

  const [
    totalPosts,
    pendingPosts,
    totalAuthors,
    totalReaders,
    pendingRequests,
    viewsAgg,
    recentPosts,
  ] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ status: POST_STATUS.PENDING }),
    User.countDocuments({ role: { $in: [ROLES.AUTHOR, ROLES.MODERATOR] } }),
    User.countDocuments({ role: ROLES.READER }),
    AuthorRequest.countDocuments({ status: REQUEST_STATUS.PENDING }),
    Post.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    Post.find().sort({ createdAt: -1 }).limit(8).select("title status createdAt author").populate("author", "name").lean(),
  ]);

  // Posts per month (last 6 months)
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  const perMonth = await Post.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const postsPerMonth = perMonth.map((d: any) => ({
    month: `${monthNames[d._id.m - 1]} ${String(d._id.y).slice(2)}`,
    posts: d.count,
  }));

  // Category breakdown
  const cats = await Category.find().select("name color postCount").sort({ postCount: -1 }).lean();
  const categoryBreakdown = cats.map((c: any) => ({ name: c.name, value: c.postCount, color: c.color }));

  return json({
    stats: {
      totalPosts,
      pendingPosts,
      totalAuthors,
      totalReaders,
      pendingRequests,
      totalViews: viewsAgg[0]?.total || 0,
    },
    recentPosts: recentPosts.map((p: any) => ({
      _id: String(p._id),
      title: p.title,
      status: p.status,
      createdAt: p.createdAt,
      author: p.author?.name || "Unknown",
    })),
    postsPerMonth,
    categoryBreakdown,
  });
}
