import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import SiteSettings, { getSettings } from "@/models/SiteSettings";

export async function GET() {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();
  const settings = await getSettings();
  return json({ settings });
}

export async function PUT(req: Request) {
  const { res } = await requireRole(ROLES.SUPER_ADMIN);
  if (res) return res;
  const body = await req.json().catch(() => null);
  if (!body) return error("Invalid data.", 422);

  await connectDB();
  // Whitelist updatable fields.
  const allowed = [
    "siteName", "tagline", "logo", "favicon", "social", "gaId",
    "ads", "adsense", "homepageLayout", "footerText", "colors",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) update[key] = body[key];

  const settings = await SiteSettings.findOneAndUpdate(
    { key: "global" },
    { $set: update },
    { new: true, upsert: true }
  ).lean();

  return json({ settings });
}
