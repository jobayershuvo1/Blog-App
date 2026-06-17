import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error, requireRole } from "@/lib/api";
import { emails } from "@/lib/mail";
import { REQUEST_STATUS, ROLES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import AuthorRequest from "@/models/AuthorRequest";
import User from "@/models/User";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(1000).optional(),
});

async function uniqueUsername(base: string): Promise<string> {
  const root = slugify(base) || "author";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await User.findOne({ username: candidate })) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid action.", 422);

  await connectDB();
  const request = await AuthorRequest.findById(params.id).select("+password");
  if (!request) return error("Request not found.", 404);
  if (request.status !== REQUEST_STATUS.PENDING) return error("This request was already reviewed.", 409);

  if (parsed.data.action === "approve") {
    const existing = await User.findOne({ email: request.email });
    if (existing) return error("A user with that email already exists.", 409);

    const username = await uniqueUsername(request.name);
    await User.create({
      name: request.name,
      email: request.email,
      username,
      password: request.password, // already hashed
      role: ROLES.AUTHOR,
      bio: request.bio,
      socialLinks: request.socialLinks,
    });

    request.status = REQUEST_STATUS.APPROVED;
    request.reviewedBy = user!.id as never;
    request.reviewedAt = new Date();
    await request.save();

    emails.authorApproved(request.email, request.name).catch(() => {});
    return json({ message: "Author approved." });
  }

  // reject
  const reason = parsed.data.reason?.trim() || "Your application did not meet our current needs.";
  request.status = REQUEST_STATUS.REJECTED;
  request.rejectionReason = reason;
  request.reviewedBy = user!.id as never;
  request.reviewedAt = new Date();
  await request.save();

  emails.authorRejected(request.email, request.name, reason).catch(() => {});
  return json({ message: "Author request rejected." });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { res } = await requireRole(ROLES.MODERATOR);
  if (res) return res;
  await connectDB();
  await AuthorRequest.findByIdAndDelete(params.id);
  return json({ message: "Deleted." });
}
