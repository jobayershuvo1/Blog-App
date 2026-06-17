import { connectDB } from "@/lib/db";
import { json, error, requireUser } from "@/lib/api";
import Message from "@/models/Message";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireUser();
  if (res) return res;
  await connectDB();
  const msg = await Message.findById(params.id);
  if (!msg) return error("Message not found.", 404);
  if (msg.to.toString() !== user!.id) return error("Not allowed.", 403);
  msg.isRead = true;
  await msg.save();
  return json({ ok: true });
}
