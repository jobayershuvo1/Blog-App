"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Menu, X, PenLine, Search, LayoutDashboard, Shield, LogOut, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { hasAtLeast } from "@/lib/constants";
import type { CategoryLite } from "@/lib/types";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "BlogForge";

export function Navbar({ categories }: { categories: CategoryLite[] }) {
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const role = session?.user?.role;

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl">
      <nav className="container-prose flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white font-bold">
            B
          </span>
          <span className="font-serif text-xl font-bold hidden sm:block">{SITE_NAME}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
            {t("home")}
          </Link>
          <div className="relative">
            <button
              onClick={() => setCatOpen((o) => !o)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              {t("categories")}
              <ChevronDown className={`h-4 w-4 transition-transform ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-20 w-56">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-elevated shadow-xl p-2 max-h-80 overflow-y-auto">
                    {categories.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-400">No categories yet</p>
                    )}
                    {categories.map((c) => (
                      <Link
                        key={c._id}
                        href={`/category/${c.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <span>{c.icon}</span> {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <Link href="/search" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1">
            <Search className="h-4 w-4" /> {t("search")}
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Auth area (desktop) */}
          <div className="hidden lg:flex items-center gap-2 ml-1">
            {!session && (
              <>
                <Link href="/register-author" className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                  {t("writeForUs")}
                </Link>
                <Link href="/login" className="btn-gradient h-10 px-4 rounded-xl text-sm font-semibold flex items-center">
                  {t("login")}
                </Link>
              </>
            )}
            {session && (
              <>
                {hasAtLeast(role, "moderator") && (
                  <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Shield className="h-4 w-4" /> {t("admin")}
                  </Link>
                )}
                {hasAtLeast(role, "author") && (
                  <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <LayoutDashboard className="h-4 w-4" /> {t("dashboard")}
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" /> {t("logout")}
                </button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>
    </header>

      {/* Mobile drawer — rendered OUTSIDE <header> so the header's backdrop-blur
          doesn't become the containing block for this `fixed` overlay (which
          would otherwise clip it to the 64px header height). */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white dark:bg-surface-dark-elevated shadow-2xl p-5 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <span className="font-serif text-lg font-bold">{SITE_NAME}</span>
              <button onClick={() => setOpen(false)} className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1" onClick={() => setOpen(false)}>
              <Link href="/" className="rounded-lg px-3 py-3 font-medium hover:bg-slate-100 dark:hover:bg-slate-700">{t("home")}</Link>
              <Link href="/search" className="rounded-lg px-3 py-3 font-medium hover:bg-slate-100 dark:hover:bg-slate-700">{t("search")}</Link>
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase text-slate-400">{t("categories")}</p>
              {categories.map((c) => (
                <Link key={c._id} href={`/category/${c.slug}`} className="rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                  {c.icon} {c.name}
                </Link>
              ))}
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 flex flex-col gap-1">
                {!session && (
                  <>
                    <Link href="/register-author" className="rounded-lg px-3 py-3 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><PenLine className="h-4 w-4" />{t("writeForUs")}</Link>
                    <Link href="/login" className="btn-gradient rounded-xl px-3 py-3 font-semibold text-center">{t("login")}</Link>
                  </>
                )}
                {session && (
                  <>
                    {hasAtLeast(role, "moderator") && <Link href="/admin" className="rounded-lg px-3 py-3 font-medium hover:bg-slate-100 dark:hover:bg-slate-700">{t("admin")}</Link>}
                    {hasAtLeast(role, "author") && <Link href="/dashboard" className="rounded-lg px-3 py-3 font-medium hover:bg-slate-100 dark:hover:bg-slate-700">{t("dashboard")}</Link>}
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-lg px-3 py-3 font-medium text-left text-danger hover:bg-red-50 dark:hover:bg-red-500/10">{t("logout")}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
