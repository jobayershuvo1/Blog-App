/**
 * Seed script — creates the single super admin and a few starter categories.
 * Run with: npm run seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Category from "../models/Category";
import SiteSettings from "../models/SiteSettings";
import { ROLES } from "../lib/constants";
import { slugify } from "../lib/utils";

const STARTER_CATEGORIES = [
  { name: "Technology", icon: "💻", color: "#6366f1", description: "Software, gadgets, and the future." },
  { name: "Lifestyle", icon: "🌿", color: "#10b981", description: "Health, wellness, and everyday living." },
  { name: "Business", icon: "📈", color: "#f59e0b", description: "Startups, finance, and strategy." },
  { name: "Travel", icon: "✈️", color: "#3b82f6", description: "Destinations and adventures." },
  { name: "Food", icon: "🍳", color: "#ef4444", description: "Recipes, reviews, and culture." },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local first.");

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Site Administrator";
  if (!email || !password) {
    throw new Error("SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env.local.");
  }

  console.log("→ Connecting to MongoDB…");
  await mongoose.connect(uri);

  // ── Super admin (only one) ──
  const existing = await User.findOne({ role: ROLES.SUPER_ADMIN });
  if (existing) {
    console.log(`✓ Super admin already exists (${existing.email}).`);
  } else {
    const conflict = await User.findOne({ email: email.toLowerCase() });
    if (conflict) {
      conflict.role = ROLES.SUPER_ADMIN;
      conflict.password = await bcrypt.hash(password, 12);
      await conflict.save();
      console.log(`✓ Promoted existing user ${email} to super admin.`);
    } else {
      await User.create({
        name,
        email: email.toLowerCase(),
        username: slugify(name) || "admin",
        password: await bcrypt.hash(password, 12),
        role: ROLES.SUPER_ADMIN,
        bio: "Administrator of this blog.",
      });
      console.log(`✓ Created super admin: ${email}`);
    }
  }

  // ── Starter categories ──
  for (const c of STARTER_CATEGORIES) {
    const slug = slugify(c.name);
    const exists = await Category.findOne({ slug });
    if (!exists) {
      await Category.create({ ...c, slug });
      console.log(`✓ Category created: ${c.name}`);
    }
  }

  // ── Singleton settings ──
  await SiteSettings.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global", siteName: process.env.NEXT_PUBLIC_SITE_NAME || "BlogForge" } },
    { upsert: true }
  );
  console.log("✓ Site settings initialized.");

  await mongoose.disconnect();
  console.log("\n✅ Seed complete. You can now sign in at /login.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
