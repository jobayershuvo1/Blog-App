"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Mail, Trash2, Reply } from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface M {
  _id: string; name: string; email: string; subject: string;
  message: string; isRead: boolean; createdAt: string;
}

export default function AdminContactPage() {
  const [msgs, setMsgs] = useState<M[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<M | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      setMsgs((data.messages || []).map((m: any) => ({ ...m, _id: String(m._id) })));
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function markRead(m: M) {
    if (m.isRead) return;
    await fetch(`/api/contact/${m._id}`, { method: "PATCH" });
    setMsgs((prev) => prev.map((x) => (x._id === m._id ? { ...x, isRead: true } : x)));
  }

  async function remove(m: M) {
    try {
      const res = await fetch(`/api/contact/${m._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Deleted."); load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed."); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Contact Messages</h1>
        <p className="text-slate-500 dark:text-slate-400">Submissions from the Contact Us form.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : msgs.length === 0 ? (
        <EmptyState icon={<Mail className="h-8 w-8" />} title="No messages yet" description="Contact form submissions show up here." />
      ) : (
        <div className="space-y-3">
          {msgs.map((m) => (
            <Card key={m._id} className={`p-5 ${m.isRead ? "" : "border-primary/40"}`} onClick={() => markRead(m)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.subject}</span>
                    {!m.isRead && <Badge color="primary">new</Badge>}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {m.name} · <a href={`mailto:${m.email}`} className="text-primary hover:underline">{m.email}</a> · {formatDate(m.createdAt)}
                  </p>
                  <p className="mt-3 text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">{m.message}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700" title="Reply by email"><Reply className="h-4 w-4" /></a>
                  <button onClick={(e) => { e.stopPropagation(); setDeleting(m); }} className="h-9 w-9 rounded-lg flex items-center justify-center text-danger hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title="Delete message?" description={`Message from ${deleting?.name} will be removed.`} confirmLabel="Delete" />
    </div>
  );
}
