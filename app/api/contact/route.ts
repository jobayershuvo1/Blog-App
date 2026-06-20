import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/utils";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { ROLES } from "@/lib/constants";
import ContactMessage from "@/models/ContactMessage";

export async function GET() {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200).lean();
  const unread = await ContactMessage.countDocuments({ isRead: false });
  return json({ messages, unread });
}

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(5000),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000).success) {
    return error("Too many messages. Try again later.", 429);
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid input.", 422);

  await connectDB();
  await ContactMessage.create(parsed.data);

  const admin = process.env.SUPER_ADMIN_EMAIL;
  if (admin && isMailConfigured()) {
    sendMail({
      to: admin,
      subject: `Contact form: ${parsed.data.subject}`,
      html: `<p><b>${parsed.data.name}</b> (${parsed.data.email})</p><p>${parsed.data.message}</p>`,
    }).catch(() => {});
  }
  return json({ message: "Thanks! We'll get back to you soon." }, 201);
}
