"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Send, Plus, Mail, MailOpen } from "lucide-react";
import { Card, Input, Textarea, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface Person { _id: string; name: string; avatar?: string; role?: string }
interface Msg {
  _id: string; subject: string; body: string; isRead: boolean;
  threadId: string; createdAt: string; from: Person; to: Person;
}

export function MessagesInbox({ canCompose = true }: { canCompose?: boolean }) {
  const { data: session } = useSession();
  const me = session?.user?.id;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "" });
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  }, []);

  useEffect(() => {
    load().finally(() => (firstLoad.current = false));
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // Group by thread
  const threads = Object.values(
    messages.reduce<Record<string, Msg[]>>((acc, m) => {
      (acc[m.threadId] ??= []).push(m);
      return acc;
    }, {})
  ).sort((a, b) => +new Date(b[b.length - 1].createdAt) - +new Date(a[a.length - 1].createdAt));

  const activeThread = threads.find((t) => t[0].threadId === active);

  async function markRead(m: Msg) {
    if (m.isRead || m.to._id !== me) return;
    await fetch(`/api/messages/${m._id}`, { method: "PATCH" });
    setMessages((prev) => prev.map((x) => (x._id === m._id ? { ...x, isRead: true } : x)));
  }

  function openThread(t: Msg[]) {
    setActive(t[0].threadId);
    t.forEach(markRead);
  }

  async function send(payload: { subject: string; body: string; to?: string; threadId?: string }) {
    setBusy(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Message sent.");
      setCompose(false); setForm({ subject: "", body: "" }); setReply("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send.");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Messages</h1>
          <p className="text-slate-500 dark:text-slate-400">Conversations with the team.</p>
        </div>
        {canCompose && <Button onClick={() => setCompose(true)}><Plus className="h-4 w-4" />New message</Button>}
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4 min-h-[60vh]">
        {/* Thread list */}
        <Card className="overflow-hidden">
          {threads.length === 0 ? (
            <div className="p-6"><EmptyState icon={<Mail className="h-8 w-8" />} title="No messages yet" /></div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[70vh] overflow-y-auto">
              {threads.map((t) => {
                const last = t[t.length - 1];
                const other = last.from._id === me ? last.to : last.from;
                const unread = t.some((m) => !m.isRead && m.to._id === me);
                return (
                  <button key={t[0].threadId} onClick={() => openThread(t)} className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${active === t[0].threadId ? "bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary shrink-0">{other.name?.charAt(0)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{other.name}</span>
                          {unread ? <span className="h-2 w-2 rounded-full bg-primary shrink-0" /> : <MailOpen className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                        </div>
                        <p className={`text-sm truncate ${unread ? "font-semibold" : "text-slate-500"}`}>{last.subject}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Conversation */}
        <Card className="flex flex-col">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a conversation</div>
          ) : (
            <>
              <div className="border-b border-slate-200 dark:border-slate-700/60 p-4">
                <h3 className="font-semibold">{activeThread[0].subject}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[50vh]">
                {activeThread.map((m) => {
                  const mine = m.from._id === me;
                  return (
                    <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? "bg-gradient-primary text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>{m.from.name} · {formatDate(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700/60 p-3 flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" onKeyDown={(e) => {
                  if (e.key === "Enter" && reply.trim()) {
                    const last = activeThread[activeThread.length - 1];
                    const other = last.from._id === me ? last.to._id : last.from._id;
                    send({ subject: `Re: ${activeThread[0].subject}`, body: reply, to: other, threadId: activeThread[0].threadId });
                  }
                }} />
                <Button loading={busy} onClick={() => {
                  if (!reply.trim()) return;
                  const last = activeThread[activeThread.length - 1];
                  const other = last.from._id === me ? last.to._id : last.from._id;
                  send({ subject: `Re: ${activeThread[0].subject}`, body: reply, to: other, threadId: activeThread[0].threadId });
                }} size="icon"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal open={compose} onClose={() => setCompose(false)} title="New message">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Your message will be delivered to the site administrators.</p>
          <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div><Label>Message</Label><Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCompose(false)}>Cancel</Button>
            <Button loading={busy} onClick={() => send(form)} disabled={!form.subject || !form.body}>Send</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
