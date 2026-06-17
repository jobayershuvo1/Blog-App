import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/utils";
import { emails } from "@/lib/mail";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

const schema = z.object({ email: z.string().email(), name: z.string().max(100).optional() });

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`newsletter:${ip}`, 5, 60 * 60 * 1000).success) {
    return error("Too many attempts. Try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Please enter a valid email.", 422);

  await connectDB();
  const email = parsed.data.email.toLowerCase();
  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing) {
    if (existing.status === "unsubscribed") {
      existing.status = "subscribed";
      await existing.save();
    }
    return json({ message: "You're already subscribed." });
  }

  await NewsletterSubscriber.create({ email, name: parsed.data.name });
  emails.newsletterWelcome(email).catch(() => {});
  return json({ message: "Subscribed!" }, 201);
}
