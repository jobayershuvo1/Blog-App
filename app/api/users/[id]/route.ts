import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { ROLES, USER_STATUS } from "@/lib/constants";
import User from "@/models/User";

const schema = z.object({
  action: z.enum(["promote", "make_admin", "demote", "activate", "deactivate"]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // Only a super admin may change roles / account status.
  const { user, res } = await requireRole(ROLES.SUPER_ADMIN);
  if (res) return res;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid action.", 422);

  await connectDB();
  const target = await User.findById(params.id);
  if (!target) return error("User not found.", 404);
  // You can't change your own role/status (prevents accidental self-lockout).
  if (String(target._id) === user!.id) return error("You cannot modify your own account.", 403);

  switch (parsed.data.action) {
    case "promote": // author → moderator
      if (target.role !== ROLES.AUTHOR) return error("Only authors can be promoted to moderator.", 422);
      target.role = ROLES.MODERATOR;
      break;
    case "make_admin": // author/moderator → super_admin
      if (target.role === ROLES.SUPER_ADMIN) return error("This user is already a super admin.", 422);
      target.role = ROLES.SUPER_ADMIN;
      break;
    case "demote": // super_admin → moderator → author
      if (target.role === ROLES.SUPER_ADMIN) target.role = ROLES.MODERATOR;
      else if (target.role === ROLES.MODERATOR) target.role = ROLES.AUTHOR;
      else return error("This user can't be demoted further.", 422);
      break;
    case "activate":
      target.status = USER_STATUS.ACTIVE;
      break;
    case "deactivate":
      if (target.role === ROLES.SUPER_ADMIN) return error("Deactivate a super admin only after demoting them.", 422);
      target.status = USER_STATUS.INACTIVE;
      break;
  }

  await target.save();
  return json({ message: "User updated.", user: { _id: String(target._id), role: target.role, status: target.status } });
}
