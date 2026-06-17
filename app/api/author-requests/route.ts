import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/utils";
import { emails } from "@/lib/mail";
import { REQUEST_STATUS, ROLES } from "@/lib/constants";
import AuthorRequest from "@/models/AuthorRequest";
import User from "@/models/User";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  bio: z.string().min(20).max(2000),
  writingSample: z.string().max(10000).optional(),
  socialLinks: z
    .object({
      website: z.string().url().optional().or(z.literal("")),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`author-request:${ip}`, 5, 60 * 60 * 1000); // 5/hour
  if (!limit.success) return error("Too many requests. Please try again later.", 429);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid input.", 422);

  const { name, email, password, bio, writingSample, socialLinks } = parsed.data;
  await connectDB();

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return error("An account with that email already exists.", 409);

  const pending = await AuthorRequest.findOne({
    email: email.toLowerCase(),
    status: REQUEST_STATUS.PENDING,
  });
  if (pending) return error("You already have a pending request.", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  await AuthorRequest.create({
    name,
    email: email.toLowerCase(),
    password: passwordHash,
    bio,
    writingSample,
    socialLinks: socialLinks || {},
  });

  // Notify the super admin (best-effort).
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (adminEmail) emails.newAuthorRequest(adminEmail, name, email).catch(() => {});

  return json({ message: "Your application was submitted. We'll be in touch soon." }, 201);
}

export async function GET(req: Request) {
  const { user, res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;

  await connectDB();
  const status = new URL(req.url).searchParams.get("status");
  const filter = status && status !== "all" ? { status } : {};
  const requests = await AuthorRequest.find(filter)
    .sort({ createdAt: -1 })
    .select("-password")
    .lean();
  void user;
  return json({ requests });
}
