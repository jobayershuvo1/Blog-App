import { z } from "zod";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { json, error } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp, absoluteUrl } from "@/lib/utils";
import { emails, isMailConfigured } from "@/lib/mail";
import User from "@/models/User";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000).success) {
    return error("Too many requests. Please try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Please enter a valid email.", 422);

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

  // Always respond success to avoid leaking which emails exist.
  const generic = { message: "If an account exists for that email, a reset link has been sent." };

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    user.resetToken = hashed;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = absoluteUrl(`/reset-password?token=${token}`);
    if (isMailConfigured()) {
      emails.passwordReset(user.email, user.name, resetUrl).catch(() => {});
    } else {
      // Email isn't configured — log the link so the admin can still deliver it.
      console.warn(`[forgot-password] Mail not configured. Reset link for ${user.email}: ${resetUrl}`);
    }
  }

  return json(generic);
}
