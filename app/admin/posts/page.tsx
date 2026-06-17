"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Check, X, Trash2, Eye, Pencil, Loader2, PlusCircle } from "lucide-react";
import { Card, Badge, Input, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatNumber } from "@/lib/utils";

interface Row {
  _id: string; title: string; slug: string; status: string; views: number;
  createdAt: string; author?: { name: string }; category?: { name: string; color: string };
}

const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray"> = {
  approved: "green", pending: "yellow", rejected: "red", draft: "gray",
};

function PostsManager() {
  const sp = useSearchParams();
  const [status, setStatus] = useState(sp.get("status") || "all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [cats, setCats] = useState<{ _id: string; name: string }[]>([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState<Row | null>(null);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, category, perPage: "50" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setRows(data.posts || []);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [status, category, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories || [])); }, []);

  async function review(id: string, action: "approve" | "reject", rejectReason?: string) {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: rejectReason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async function singleReview(row: Row, action: "approve" | "reject", rejectReason?: string) {
    setBusy(true);
    try {
      const data = await review(row._id, action, rejectReason);
      toast.success(data.message);
      setRejecting(null); setReason("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally { setBusy(false); }
  }

  async function remove(row: Row) {
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${row._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Post deleted.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally { setBusy(false); }
  }

  async function bulk(action: "approve" | "reject" | "delete") {
    if (selected.size === 0) return;
    setBusy(true);
    const ids = [...selected];
    try {
      await Promise.all(ids.map((id) =>
        action === "delete"
          ? fetch(`/api/posts/${id}`, { method: "DELETE" })
          : review(id, action, action === "reject" ? "Bulk rejected by moderator." : undefined)
      ));
      toast.success(`${ids.length} post(s) ${action}d.`);
      load();
    } catch {
      toast.error("Some actions failed.");
    } finally { setBusy(false); }
  }

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Posts</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and moderate all posts.</p>
        </div>
        <Link href="/dashboard/posts/new"><Button><PlusCircle className="h-4 w-4" />New Post</Button></Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
        </Select>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title…" className="w-56" />
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="success" loading={busy} onClick={() => bulk("approve")}>Approve</Button>
            <Button size="sm" variant="secondary" loading={busy} onClick={() => bulk("reject")}>Reject</Button>
            <Button size="sm" variant="danger" loading={busy} onClick={() => bulk("delete")}>Delete</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No posts found" description="Try adjusting your filters, or create the first post." action={<Link href="/dashboard/posts/new"><Button><PlusCircle className="h-4 w-4" />New Post</Button></Link>} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-3 w-10"><input type="checkbox" checked={selected.size === rows.length} onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r._id)) : new Set())} /></th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Author</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Category</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Views</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {rows.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-3 py-3"><input type="checkbox" checked={selected.has(r._id)} onChange={() => toggle(r._id)} /></td>
                    <td className="px-4 py-3 font-medium max-w-xs truncate">{r.title}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500">{r.author?.name || "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{r.category ? <Badge style={{ backgroundColor: `${r.category.color}22`, color: r.category.color }}>{r.category.name}</Badge> : "—"}</td>
                    <td className="px-4 py-3"><Badge color={STATUS_COLOR[r.status] || "gray"}>{r.status}</Badge></td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-500">{formatNumber(r.views)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "approved" && <Link href={`/post/${r.slug}`} target="_blank" className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700" title="View"><Eye className="h-4 w-4" /></Link>}
                        <Link href={`/dashboard/posts/edit/${r._id}`} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700" title="Edit"><Pencil className="h-4 w-4" /></Link>
                        {r.status !== "approved" && <button onClick={() => singleReview(r, "approve")} disabled={busy} className="h-8 w-8 rounded-lg flex items-center justify-center text-success hover:bg-emerald-50 dark:hover:bg-emerald-500/10" title="Approve"><Check className="h-4 w-4" /></button>}
                        {r.status !== "rejected" && <button onClick={() => setRejecting(r)} className="h-8 w-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10" title="Reject"><X className="h-4 w-4" /></button>}
                        <button onClick={() => setDeleting(r)} className="h-8 w-8 rounded-lg flex items-center justify-center text-danger hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject Post">
        <p className="text-sm text-slate-500 mb-3">The author will be emailed your feedback.</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="What needs to change?" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={() => rejecting && singleReview(rejecting, "reject", reason)}>Reject & notify</Button>
        </div>
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title="Delete post?" description={`"${deleting?.title}" will be permanently removed.`} confirmLabel="Delete" />
    </div>
  );
}

export default function AdminPostsPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
      <PostsManager />
    </Suspense>
  );
}
