/**
 * Create (or upgrade) a super admin account.
 * Usage: tsx scripts/create-admin.ts <email> <password> [full name]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { ROLES } from "../lib/constants";
import { slugify } from "../lib/utils";

async function uniqueUsername(base: string): Promise<string> {
  const root = slugify(base) || "admin";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await User.findOne({ username: candidate })) candidate = `${root}-${n++}`;
  return candidate;
}

async function main() {
  const [, , emailArg, passwordArg, ...nameParts] = process.argv;
  const email = (emailArg || "").toLowerCase().trim();
  const password = passwordArg || "";
  const name = nameParts.join(" ").trim() || "Administrator";

  if (!email || !password) throw new Error("Usage: tsx scripts/create-admin.ts <email> <password> [name]");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");

  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = ROLES.SUPER_ADMIN;
    existing.password = hash;
    existing.status = "active";
    if (!existing.username) existing.username = await uniqueUsername(name);
    await existing.save();
    console.log(`✓ Updated existing user "${email}" → super admin (password reset).`);
  } else {
    await User.create({
      name,
      email,
      username: await uniqueUsername(name),
      password: hash,
      role: ROLES.SUPER_ADMIN,
      bio: "Administrator of this blog.",
    });
    console.log(`✓ Created new super admin: ${email}`);
  }

  await mongoose.disconnect();
  console.log("✅ Done. Sign in at /login.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed:", err.message || err);
  process.exit(1);
});
