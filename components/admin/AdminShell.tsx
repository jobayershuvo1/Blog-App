"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, FileText, UserCheck, Users, FolderTree,
  MessageSquare, Settings, Menu, X, LogOut, Home, PenSquare, Feather, ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasAtLeast } from "@/lib/constants";
import { ThemeToggle } from "@/components/blog/ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "pendingPosts" | "pendingRequests" | "unread";
  superAdminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/author-requests", label: "Author Requests", icon: UserCheck, badgeKey: "pendingRequests" },
  { href: "/admin/posts", label: "Posts", icon: FileText, badgeKey: "pendingPosts" },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/pages", label: "Pages", icon: ScrollText },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare, badgeKey: "unread" },
  { href: "/admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ pendingPosts: 0, pendingRequests: 0, unread: 0 });
  const role = session?.user?.role;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [statsRes, msgRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/messages"),
        ]);
        const stats = statsRes.ok ? await statsRes.json() : null;
        const msg = msgRes.ok ? await msgRes.json() : null;
        if (!active) return;
        setCounts({
          pendingPosts: stats?.stats?.pendingPosts ?? 0,
          pendingRequests: stats?.stats?.pendingRequests ?? 0,
          unread: msg?.unread ?? 0,
        });
      } catch {}
    }
    load();
    const id = setInterval(load, 30_000); // polling for "real-time feel"
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [pathname]);

  const items = NAV.filter((i) => !i.superAdminOnly || role === "super_admin");

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 dark:border-slate-700/60">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white"><Feather className="h-5 w-5" strokeWidth={2.5} /></span>
        <span className="font-serif text-lg font-bold">Admin</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const badge = item.badgeKey ? counts[item.badgeKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 dark:border-slate-700/60 p-3 space-y-1">
        {hasAtLeast(role, "author") && (
          <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            <PenSquare className="h-5 w-5" /> My Dashboard
          </Link>
        )}
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Home className="h-5 w-5" /> View Site
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-red-50 dark:hover:bg-red-500/10">
          <LogOut className="h-5 w-5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-dark">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-surface-dark-card">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-surface-dark-card shadow-2xl">{SidebarContent}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-surface-dark-card/80 backdrop-blur-xl px-4 lg:px-8">
          <button className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm font-medium">{session?.user?.name}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {session?.user?.name?.charAt(0) || "A"}
              </span>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
