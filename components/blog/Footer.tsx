import Link from "next/link";
import { Twitter, Facebook, Instagram, Github, Linkedin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCategories, getLatestPosts } from "@/lib/queries";
import { getSettings } from "@/models/SiteSettings";
import { connectDB } from "@/lib/db";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "BlogForge";

export async function Footer() {
  const t = await getTranslations("footer");
  await connectDB();
  const [categories, recent, settings] = await Promise.all([
    getCategories(),
    getLatestPosts(4),
    getSettings(),
  ]);

  const socials = [
    { href: settings.social?.twitter, icon: Twitter },
    { href: settings.social?.facebook, icon: Facebook },
    { href: settings.social?.instagram, icon: Instagram },
    { href: settings.social?.github, icon: Github },
    { href: settings.social?.linkedin, icon: Linkedin },
  ].filter((s) => s.href);

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-surface-dark-card">
      <div className="container-prose py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white font-bold">B</span>
              <span className="font-serif text-xl font-bold">{settings.siteName || SITE_NAME}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{settings.tagline}</p>
            {socials.length > 0 && (
              <div className="mt-4 flex gap-2">
                {socials.map(({ href, icon: Icon }, i) => (
                  <a key={i} href={href!} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("categories")}</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              {categories.slice(0, 6).map((c) => (
                <li key={c._id}>
                  <Link href={`/category/${c.slug}`} className="hover:text-primary">{c.icon} {c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("recentPosts")}</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              {recent.map((p) => (
                <li key={p._id}>
                  <Link href={`/post/${p.slug}`} className="hover:text-primary line-clamp-1">{p.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("quickLinks")}</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/" className="hover:text-primary">Home</Link></li>
              <li><Link href="/search" className="hover:text-primary">Search</Link></li>
              <li><Link href="/register-author" className="hover:text-primary">Write for us</Link></li>
              <li><Link href="/login" className="hover:text-primary">Sign in</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 dark:border-slate-700/60 pt-6 text-center text-sm text-slate-400">
          <p>{settings.footerText}</p>
          <p className="mt-1">© {new Date().getFullYear()} {settings.siteName || SITE_NAME}. {t("rights")}</p>
        </div>
      </div>
    </footer>
  );
}
