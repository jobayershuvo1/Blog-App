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
import Page from "../models/Page";
import { ROLES } from "../lib/constants";
import { slugify } from "../lib/utils";

const SITE = process.env.NEXT_PUBLIC_SITE_NAME || "Our Blog";
const ADMIN_MAIL = process.env.SUPER_ADMIN_EMAIL || "admin@example.com";
const P = (s: string) => `<p>${s}</p>`;
const SYSTEM_PAGES = [
  { slug: "about-us", title: "About Us", order: 1, metaDescription: `Learn about ${SITE}, our mission and the team.`,
    content: `<h2>Welcome to ${SITE}</h2>${P(`${SITE} is an independent publication sharing well-researched articles across technology, lifestyle, business and more.`)}<h3>Our Mission</h3>${P("Deliver accurate, helpful, original content to our readers.")}<h3>Our Vision</h3>${P("Become a trusted source readers return to.")}<h3>Our Team</h3>${P("A small group of writers and editors passionate about quality content.")}<h3>Contact</h3>${P(`Email us at ${ADMIN_MAIL}.`)}` },
  { slug: "contact", title: "Contact Us", order: 2, metaDescription: `Get in touch with the ${SITE} team.`,
    content: `<h2>Contact Us</h2>${P(`Have a question, suggestion, or partnership idea? Reach us at <a href="mailto:${ADMIN_MAIL}">${ADMIN_MAIL}</a> or use the form below.`)}` },
  { slug: "privacy-policy", title: "Privacy Policy", order: 3, metaDescription: `How ${SITE} collects and uses your data.`,
    content: `<h2>Privacy Policy</h2>${P("This Privacy Policy explains how we collect, use and protect your information.")}<h3>Data We Collect</h3>${P("We may collect your name and email when you contact us or subscribe, plus anonymous analytics data.")}<h3>Cookies</h3>${P("We use cookies to improve your experience and for analytics.")}<h3>Google AdSense</h3>${P("Third-party vendors, including Google, use cookies to serve ads based on prior visits. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this and other sites. You may opt out of personalized advertising via Google Ads Settings.")}<h3>Google Analytics</h3>${P("We use Google Analytics to understand traffic. It collects anonymous usage data.")}<h3>Your Rights</h3>${P(`You may request access to or deletion of your data by emailing ${ADMIN_MAIL}.`)}<h3>Third-party Services</h3>${P("We link to third-party sites and are not responsible for their privacy practices.")}` },
  { slug: "disclaimer", title: "Disclaimer", order: 4, metaDescription: `${SITE} content disclaimer.`,
    content: `<h2>Disclaimer</h2>${P("All information on this site is published in good faith and for general information only.")}<h3>Content Accuracy</h3>${P("We do not warrant the completeness or accuracy of any information.")}<h3>External Links</h3>${P("We are not responsible for the content of external sites we link to.")}<h3>Affiliate</h3>${P("Some links may be affiliate links; we may earn a commission at no extra cost to you.")}<h3>Professional Advice</h3>${P("Content is not a substitute for professional advice.")}` },
  { slug: "terms-conditions", title: "Terms & Conditions", order: 5, metaDescription: `Terms of using ${SITE}.`,
    content: `<h2>Terms &amp; Conditions</h2>${P("By using this website you agree to these terms.")}<h3>Use of the Site</h3>${P("You agree to use the site lawfully and not to misuse it.")}<h3>Intellectual Property</h3>${P("All content is owned by us or our licensors and protected by copyright.")}<h3>Limitation of Liability</h3>${P("We are not liable for any damages arising from use of the site.")}<h3>Account Termination</h3>${P("We may suspend accounts that violate these terms.")}<h3>Governing Law</h3>${P("These terms are governed by applicable local law.")}` },
  { slug: "faq", title: "FAQ", order: 6, metaDescription: `Frequently asked questions about ${SITE}.`,
    content: `<h2>Frequently Asked Questions</h2><h3>Who writes the articles?</h3>${P("Our in-house writers and approved contributors.")}<h3>How can I contribute?</h3>${P('Apply via the "Write for us" page.')}<h3>How do I contact you?</h3>${P(`Email ${ADMIN_MAIL}.`)}` },
  { slug: "editorial-policy", title: "Editorial Policy", order: 7, metaDescription: `${SITE} editorial standards.`,
    content: `<h2>Editorial Policy</h2>${P("We are committed to accuracy, originality and transparency.")}<h3>Fact-checking</h3>${P("Articles are reviewed before publishing.")}<h3>Corrections</h3>${P("We promptly correct errors brought to our attention.")}<h3>Originality</h3>${P("We do not publish plagiarized content.")}` },
  { slug: "dmca", title: "DMCA Policy", order: 8, metaDescription: `${SITE} DMCA / copyright policy.`,
    content: `<h2>DMCA Policy</h2>${P("We respect intellectual property rights.")}${P(`If you believe content infringes your copyright, email ${ADMIN_MAIL} with details and we will respond promptly.`)}` },
  { slug: "cookie-policy", title: "Cookie Policy", order: 9, metaDescription: `How ${SITE} uses cookies.`,
    content: `<h2>Cookie Policy</h2>${P("We use cookies to operate the site, remember preferences, and serve ads and analytics.")}<h3>Managing Cookies</h3>${P("You can disable cookies in your browser settings.")}` },
];

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

  // ── Compliance / system pages ──
  for (const pg of SYSTEM_PAGES) {
    const exists = await Page.findOne({ slug: pg.slug });
    if (!exists) {
      await Page.create({ ...pg, published: true, isSystem: true });
      console.log(`✓ Page created: ${pg.title}`);
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
