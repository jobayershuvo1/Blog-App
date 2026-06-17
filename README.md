# BlogForge

A production-ready, multilingual blogging platform built with **Next.js 14 (App Router)**, **MongoDB/Mongoose**, **Tailwind CSS**, and **NextAuth**. It ships with a full role-based workflow (super admin → moderator → author → reader), a TipTap rich-text editor, AI tooling (post generation, SEO, tag suggestions via Google Gemini), free AI cover images (Pollinations.ai), free translation (MyMemory), Cloudinary uploads, transactional email (Nodemailer), dark mode, and i18n (English, Bengali, Arabic, Hindi, Spanish).

---

## ✨ Features

- **Roles & auth** — JWT sessions via NextAuth; a single super admin seeded from env; author application & approval flow; moderator promotion.
- **Public blog** — magazine homepage with hero, breaking ticker, category cards, trending sidebar, newsletter; single post with JSON-LD, OG/Twitter cards, share buttons, view counter (IP rate-limited), related posts, download links, and on-page translation; category, author, and search (autosuggest) pages.
- **Admin panel** (`/admin`) — dashboard with Recharts, author requests, post moderation with bulk actions, user management, category CRUD with reordering, messaging inbox (30s polling), site settings.
- **Author studio** (`/dashboard`) — TipTap editor (fonts incl. Bengali, sizes, colors, highlight, headings, lists, quote, code, table, image upload, alignment, links), AI post generator, side-by-side translator, AI SEO panel with live score, tag autosuggest, cover photo upload + AI generation, download-link builder, draft/submit/schedule.
- **SEO** — dynamic metadata, Article JSON-LD, breadcrumbs, dynamic `sitemap.xml` & `robots.txt`, canonical URLs.
- **Dark mode**, **responsive** (mobile drawer, 44px targets), **i18n** with RTL for Arabic.

---

## 🧰 Tech Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · MongoDB + Mongoose · NextAuth · TipTap · Recharts · next-intl · next-themes · Cloudinary · Nodemailer · Google Gemini · Pollinations.ai · MyMemory.

---

## 🚀 Getting Started

> Requires **Node.js 18.17+** and a **MongoDB** instance (local or Atlas).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then fill in the values (see below)

# 3. Seed the super admin + starter categories
npm run seed

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000>. Sign in at `/login` with the `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` you set.

### Build for production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables (`.env.local`)

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | e.g. `http://localhost:3000` |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | ✅ | Created by `npm run seed` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | ⛅ | Image uploads (degrades gracefully if absent) |
| `GEMINI_API_KEY` | 🤖 | AI features (free tier `gemini-1.5-flash`) |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | 📧 | Transactional email (Gmail app password) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Used for canonical URLs, sitemap, OG |
| `NEXT_PUBLIC_GA_ID` | 📊 | Optional GA4 measurement ID |

Features whose keys are missing fail gracefully (uploads, AI, and email return clear errors instead of crashing).

---

## 📁 Project Structure

```
app/
  (public)/         # homepage, post, category, author, search  (+ layout, loading)
  (auth)/           # login, register-author
  admin/            # dashboard, author-requests, posts, users, categories, messages, settings
  dashboard/        # author studio + post editor (new / edit)
  api/              # auth, posts, author-requests, categories, ai/*, translate, upload, messages, users, settings, admin/stats, newsletter, search
  sitemap.ts, robots.ts, layout.tsx, globals.css
components/
  ui/ editor/ blog/ admin/ dashboard/
lib/      # db, auth, api guards, mail, cloudinary, gemini, queries, utils, rateLimit, constants
models/   # User, AuthorRequest, Post, Category, Message, Translation, NewsletterSubscriber, SiteSettings
messages/ # en, bn, ar, hi, es
scripts/  # seed.ts
middleware.ts  # role-based route protection
```

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (cost 12); `password` field is `select:false`.
- Every API route validates session + role; `/admin` and `/dashboard` also guarded by `middleware.ts`.
- Zod validation on inputs; upload type/size limits (5MB); rate limiting on auth, newsletter, AI, view, and translate endpoints.
- MongoDB indexes on slug, status, author, category, and a text index for search.

> The built-in rate limiter is in-memory (single instance). For multi-instance deployments, back it with Redis.
