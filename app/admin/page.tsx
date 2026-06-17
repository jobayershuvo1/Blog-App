"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, Clock, Users, Eye, UserCheck, BookOpen, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Card, Badge } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNumber, formatDate } from "@/lib/utils";

interface StatsData {
  stats: {
    totalPosts: number; pendingPosts: number; totalAuthors: number;
    totalReaders: number; pendingRequests: number; totalViews: number;
  };
  recentPosts: { _id: string; title: string; status: string; createdAt: string; author: string }[];
  postsPerMonth: { month: string; posts: number }[];
  categoryBreakdown: { name: string; value: number; color: string }[];
}

const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray"> = {
  approved: "green", pending: "yellow", rejected: "red", draft: "gray",
};

export default function AdminDashboard() {
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" /><Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Total Posts", value: data.stats.totalPosts, icon: FileText, color: "from-indigo-500 to-violet-500" },
    { label: "Pending Posts", value: data.stats.pendingPosts, icon: Clock, color: "from-amber-500 to-orange-500", href: "/admin/posts?status=pending" },
    { label: "Authors", value: data.stats.totalAuthors, icon: Users, color: "from-emerald-500 to-teal-500" },
    { label: "Total Views", value: data.stats.totalViews, icon: Eye, color: "from-blue-500 to-cyan-500" },
    { label: "Readers", value: data.stats.totalReaders, icon: BookOpen, color: "from-pink-500 to-rose-500" },
    { label: "Author Requests", value: data.stats.pendingRequests, icon: UserCheck, color: "from-fuchsia-500 to-purple-500", href: "/admin/author-requests" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of your blog at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => {
          const inner = (
            <Card className="p-5 card-hover h-full">
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold">{formatNumber(c.value)}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{c.label}</div>
            </Card>
          );
          return c.href ? <Link key={c.label} href={c.href}>{inner}</Link> : <div key={c.label}>{inner}</div>;
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 min-w-0 overflow-hidden">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><TrendingUp className="h-5 w-5 text-primary" /> Posts per month</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.postsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.1)" }} />
              <Bar dataKey="posts" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 min-w-0 overflow-hidden">
          <h3 className="mb-4 font-semibold">Category breakdown</h3>
          {data.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {data.categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 py-20 text-center">No category data yet.</p>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Recent activity</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {data.recentPosts.map((p) => (
            <div key={p._id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{p.title}</p>
                <p className="text-xs text-slate-400">{p.author} · {formatDate(p.createdAt)}</p>
              </div>
              <Badge color={STATUS_COLOR[p.status] || "gray"}>{p.status}</Badge>
            </div>
          ))}
          {data.recentPosts.length === 0 && <p className="text-sm text-slate-400 py-4">No posts yet.</p>}
        </div>
      </Card>
    </div>
  );
}
