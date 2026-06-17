"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FileText, Clock, CheckCircle2, XCircle, PlusCircle, Eye } from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNumber, formatDate } from "@/lib/utils";

interface Row {
  _id: string; title: string; slug: string; status: string; views: number; createdAt: string;
}

const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray"> = {
  approved: "green", pending: "yellow", rejected: "red", draft: "gray",
};

export default function DashboardHome() {
  const { data: session } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/posts?perPage=50").then((r) => r.json()).then((d) => setRows(d.posts || [])).catch(() => {});
  }, []);

  const counts = {
    total: rows?.length ?? 0,
    approved: rows?.filter((r) => r.status === "approved").length ?? 0,
    pending: rows?.filter((r) => r.status === "pending").length ?? 0,
    rejected: rows?.filter((r) => r.status === "rejected").length ?? 0,
    views: rows?.reduce((sum, r) => sum + r.views, 0) ?? 0,
  };

  const cards = [
    { label: "Total Posts", value: counts.total, icon: FileText, color: "from-indigo-500 to-violet-500" },
    { label: "Approved", value: counts.approved, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
    { label: "Pending", value: counts.pending, icon: Clock, color: "from-amber-500 to-orange-500" },
    { label: "Total Views", value: counts.views, icon: Eye, color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Welcome back, {session?.user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400">Here&apos;s how your writing is doing.</p>
        </div>
        <Link href="/dashboard/posts/new"><Button><PlusCircle className="h-4 w-4" />New Post</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}><c.icon className="h-5 w-5" /></div>
            {rows === null ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{formatNumber(c.value)}</div>}
            <div className="text-sm text-slate-500 dark:text-slate-400">{c.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent posts</h3>
          <Link href="/dashboard/posts" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {rows === null ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No posts yet. Write your first one!</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {rows.slice(0, 6).map((r) => (
              <Link key={r._id} href={`/dashboard/posts/edit/${r._id}`} className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 -mx-2 px-2 rounded-lg">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  <p className="text-xs text-slate-400">{formatDate(r.createdAt)} · {formatNumber(r.views)} views</p>
                </div>
                <Badge color={STATUS_COLOR[r.status] || "gray"}>{r.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
