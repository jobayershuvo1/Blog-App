import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { json, error } from "@/lib/api";
import User from "@/models/User";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid input.", 422);

  await connectDB();
  const hashed = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpiry: { $gt: new Date() },
  }).select("+resetToken +resetTokenExpiry +password");

  if (!user) return error("This reset link is invalid or has expired.", 400);

  user.password = await bcrypt.hash(parsed.data.password, 12);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return json({ message: "Your password has been reset. You can now sign in." });
}
