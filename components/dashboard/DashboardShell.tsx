"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, FileText, PlusCircle, MessageSquare, Menu, Home, Shield, LogOut, Feather, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasAtLeast } from "@/lib/constants";
import { ThemeToggle } from "@/components/blog/ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/posts", label: "My Posts", icon: FileText },
  { href: "/dashboard/posts/new", label: "New Post", icon: PlusCircle },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = session?.user?.role;

  const Sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-2 px-5 h-16 border-b border-slate-200 dark:border-slate-700/60">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white"><Feather className="h-5 w-5" strokeWidth={2.5} /></span>
        <span className="font-serif text-lg font-bold">Studio</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-primary/10 text-primary" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}>
              <item.icon className="h-5 w-5" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 dark:border-slate-700/60 p-3 space-y-1">
        {hasAtLeast(role, "moderator") && (
          <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"><Shield className="h-5 w-5" /> Admin Panel</Link>
        )}
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"><Home className="h-5 w-5" /> View Site</Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-red-50 dark:hover:bg-red-500/10"><LogOut className="h-5 w-5" /> Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-dark">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-surface-dark-card">{Sidebar}</aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 bg-white dark:bg-surface-dark-card shadow-2xl">{Sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-surface-dark-card/80 backdrop-blur-xl px-4 lg:px-8">
          <button className="lg:hidden h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{session?.user?.name?.charAt(0) || "A"}</span>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
