import { z } from "zod";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import { json, error, requireUser } from "@/lib/api";
import { ROLES, hasAtLeast } from "@/lib/constants";
import { emails } from "@/lib/mail";
import Message from "@/models/Message";
import User from "@/models/User";

export async function GET() {
  const { user, res } = await requireUser();
  if (res) return res;
  await connectDB();

  const messages = await Message.find({ $or: [{ to: user!.id }, { from: user!.id }] })
    .sort({ createdAt: -1 })
    .populate("from", "name email avatar role")
    .populate("to", "name email avatar role")
    .lean();

  const unread = await Message.countDocuments({ to: user!.id, isRead: false });
  return json({ messages, unread });
}

const schema = z.object({
  to: z.string().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  threadId: z.string().optional(),
});

export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (res) return res;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error(parsed.error.errors[0]?.message || "Invalid message.", 422);

  await connectDB();

  // Authors message admins/moderators; if no recipient given, route to the super admin.
  let toId = parsed.data.to;
  if (!toId || !hasAtLeast(user!.role, ROLES.MODERATOR)) {
    const admin =
      (await User.findOne({ role: ROLES.SUPER_ADMIN }).lean<any>()) ||
      (await User.findOne({ role: ROLES.MODERATOR }).lean<any>());
    if (!admin) return error("No administrator available to receive messages.", 503);
    toId = String(admin._id);
  }

  const recipient = await User.findById(toId).lean<any>();
  if (!recipient) return error("Recipient not found.", 404);

  const msg = await Message.create({
    from: user!.id,
    to: toId,
    subject: parsed.data.subject,
    body: parsed.data.body,
    threadId: parsed.data.threadId || randomUUID(),
  });

  if (recipient.email) emails.newMessage(recipient.email, user!.name || "Someone", parsed.data.subject).catch(() => {});
  return json({ message: msg }, 201);
}
