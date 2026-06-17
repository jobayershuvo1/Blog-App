"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { PlusCircle, Pencil, Trash2, Eye, AlertCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatNumber } from "@/lib/utils";

interface Row {
  _id: string; title: string; slug: string; status: string; views: number;
  createdAt: string; rejectionReason?: string;
}

const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray"> = {
  approved: "green", pending: "yellow", rejected: "red", draft: "gray",
};

const FILTERS = ["all", "draft", "pending", "approved", "rejected"];

export default function MyPostsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === "all" ? "" : `&status=${filter}`;
      const res = await fetch(`/api/posts?perPage=50${status}`);
      const data = await res.json();
      setRows(data.posts || []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function remove(row: Row) {
    try {
      const res = await fetch(`/api/posts/${row._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Post deleted.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">My Posts</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your articles and track their status.</p>
        </div>
        <Link href="/dashboard/posts/new"><Button><PlusCircle className="h-4 w-4" />New Post</Button></Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`h-9 px-4 rounded-lg text-sm font-medium capitalize ${filter === f ? "btn-gradient" : "border border-slate-300 dark:border-slate-600"}`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No posts here" description="Start writing your first story." action={<Link href="/dashboard/posts/new"><Button><PlusCircle className="h-4 w-4" />New Post</Button></Link>} />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r._id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{r.title}</h3>
                    <Badge color={STATUS_COLOR[r.status] || "gray"}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(r.createdAt)} · {formatNumber(r.views)} views</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {r.status === "approved" && <Link href={`/post/${r.slug}`} target="_blank" className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"><Eye className="h-4 w-4" /></Link>}
                  <Link href={`/dashboard/posts/edit/${r._id}`} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"><Pencil className="h-4 w-4" /></Link>
                  <button onClick={() => setDeleting(r)} className="h-9 w-9 rounded-lg flex items-center justify-center text-danger hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {r.status === "rejected" && r.rejectionReason && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span><strong>Feedback:</strong> {r.rejectionReason}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title="Delete post?" description={`"${deleting?.title}" will be permanently removed.`} confirmLabel="Delete" />
    </div>
  );
}
