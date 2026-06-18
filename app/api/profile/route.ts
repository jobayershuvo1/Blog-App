import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { json, error, requireUser } from "@/lib/api";
import User from "@/models/User";

export async function GET() {
  const { user, res } = await requireUser();
  if (res) return res;
  await connectDB();
  const me = await User.findById(user!.id).select("-password -resetToken -resetTokenExpiry").lean<any>();
  if (!me) return error("User not found.", 404);
  return json({
    profile: {
      _id: String(me._id),
      name: me.name,
      email: me.email,
      username: me.username ?? null,
      avatar: me.avatar ?? "",
      bio: me.bio ?? "",
      socialLinks: me.socialLinks ?? {},
      role: me.role,
    },
  });
}

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(1000).optional(),
  socialLinks: z
    .object({
      website: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      instagram: z.string().optional(),
    })
    .optional(),
  // Optional password change
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export async function PATCH(req: Request) {
  const { user, res } = await requireUser();
  if (res) return res;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid input.", 422);
  const d = parsed.data;

  await connectDB();
  const me = await User.findById(user!.id).select("+password");
  if (!me) return error("User not found.", 404);

  if (d.name !== undefined) me.name = d.name;
  if (d.avatar !== undefined) me.avatar = d.avatar || undefined;
  if (d.bio !== undefined) me.bio = d.bio;
  if (d.socialLinks !== undefined) me.socialLinks = { ...me.socialLinks, ...d.socialLinks };

  // Password change (requires current password)
  if (d.newPassword) {
    if (!d.currentPassword) return error("Enter your current password.", 422);
    const valid = me.password ? await bcrypt.compare(d.currentPassword, me.password) : false;
    if (!valid) return error("Current password is incorrect.", 403);
    me.password = await bcrypt.hash(d.newPassword, 12);
  }

  await me.save();
  return json({ message: "Profile updated.", profile: { name: me.name, avatar: me.avatar ?? "", bio: me.bio ?? "" } });
}
