"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, X, Eye } from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface Req {
  _id: string; name: string; email: string; bio: string;
  writingSample?: string; socialLinks?: Record<string, string>;
  status: string; rejectionReason?: string; createdAt: string;
}

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

export default function AuthorRequestsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<Req | null>(null);
  const [rejecting, setRejecting] = useState<Req | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/author-requests?status=${filter}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "approve" | "reject", rejectReason?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/author-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setRejecting(null);
      setReason("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Author Requests</h1>
        <p className="text-slate-500 dark:text-slate-400">Review and approve applications to write.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`h-9 px-4 rounded-lg text-sm font-medium capitalize ${filter === f ? "btn-gradient" : "border border-slate-300 dark:border-slate-600"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : requests.length === 0 ? (
        <EmptyState title="No requests" description={`No ${filter} author requests right now.`} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Bio</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500">{r.email}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500 max-w-xs truncate">{r.bio}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge color={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "yellow"}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setView(r)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700" title="View"><Eye className="h-4 w-4" /></button>
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => act(r._id, "approve")} disabled={busy} className="h-8 w-8 rounded-lg flex items-center justify-center text-success hover:bg-emerald-50 dark:hover:bg-emerald-500/10" title="Approve"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setRejecting(r)} className="h-8 w-8 rounded-lg flex items-center justify-center text-danger hover:bg-red-50 dark:hover:bg-red-500/10" title="Reject"><X className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* View profile modal */}
      <Modal open={!!view} onClose={() => setView(null)} title="Author Application">
        {view && (
          <div className="space-y-4 text-sm">
            <div><span className="text-slate-400">Name:</span> <span className="font-medium">{view.name}</span></div>
            <div><span className="text-slate-400">Email:</span> {view.email}</div>
            <div><span className="text-slate-400">Bio:</span><p className="mt-1">{view.bio}</p></div>
            {view.writingSample && <div><span className="text-slate-400">Writing sample:</span><p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-800 p-3">{view.writingSample}</p></div>}
            {view.socialLinks && Object.entries(view.socialLinks).filter(([, v]) => v).length > 0 && (
              <div>
                <span className="text-slate-400">Links:</span>
                <ul className="mt-1 space-y-1">
                  {Object.entries(view.socialLinks).filter(([, v]) => v).map(([k, v]) => (
                    <li key={k}><a href={v} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{k}: {v}</a></li>
                  ))}
                </ul>
              </div>
            )}
            {view.status === "rejected" && view.rejectionReason && (
              <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-3 text-red-600 dark:text-red-400"><strong>Rejection reason:</strong> {view.rejectionReason}</div>
            )}
            {view.status === "pending" && (
              <div className="flex gap-2 pt-2">
                <Button variant="success" onClick={() => { act(view._id, "approve"); setView(null); }} className="flex-1"><Check className="h-4 w-4" /> Approve</Button>
                <Button variant="danger" onClick={() => { setRejecting(view); setView(null); }} className="flex-1"><X className="h-4 w-4" /> Reject</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject reason modal */}
      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject Application">
        <p className="text-sm text-slate-500 mb-3">Let {rejecting?.name} know why their application was declined.</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Reason for rejection…" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={() => rejecting && act(rejecting._id, "reject", reason)}>Reject & notify</Button>
        </div>
      </Modal>
    </div>
  );
}
