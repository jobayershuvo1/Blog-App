import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import ContactMessage from "@/models/ContactMessage";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();
  const msg = await ContactMessage.findById(params.id);
  if (!msg) return error("Not found.", 404);
  msg.isRead = true;
  await msg.save();
  return json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();
  await ContactMessage.findByIdAndDelete(params.id);
  return json({ message: "Deleted." });
}
