"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, Badge, Input, Textarea, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface P {
  _id: string; slug: string; title: string; content: string;
  metaDescription?: string; published: boolean; isSystem: boolean;
}

const EMPTY = { title: "", slug: "", content: "", metaDescription: "", published: true };

export default function AdminPagesPage() {
  const [pages, setPages] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<P | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<P | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/pages");
      const data = await res.json();
      setPages((data.pages || []).map((p: any) => ({ ...p, _id: String(p._id) })));
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(p: P) {
    setEditing(p);
    setForm({ title: p.title, slug: p.slug, content: p.content, metaDescription: p.metaDescription || "", published: p.published });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/pages/${editing._id}` : "/api/pages", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? "Page updated." : "Page created.");
      setOpen(false); load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed."); }
    finally { setBusy(false); }
  }

  async function remove(p: P) {
    try {
      const res = await fetch(`/api/pages/${p._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Page deleted."); load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Pages</h1>
          <p className="text-slate-500 dark:text-slate-400">Edit compliance & static pages (About, Privacy, Terms…).</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" />New page</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : pages.length === 0 ? (
        <EmptyState title="No pages yet" description="Run `npm run seed` to create the default compliance pages, or add one." action={<Button onClick={openNew}><Plus className="h-4 w-4" />New page</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
              <tr><th className="px-4 py-3 font-medium">Title</th><th className="px-4 py-3 font-medium">/slug</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {pages.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">{p.title} {p.isSystem && <Badge color="blue">system</Badge>}</td>
                  <td className="px-4 py-3 text-slate-500">/{p.slug}</td>
                  <td className="px-4 py-3"><Badge color={p.published ? "green" : "gray"}>{p.published ? "published" : "draft"}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/${p.slug}`} target="_blank" className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"><ExternalLink className="h-4 w-4" /></Link>
                      <button onClick={() => openEdit(p)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"><Pencil className="h-4 w-4" /></button>
                      {!p.isSystem && <button onClick={() => setDeleting(p)} className="h-8 w-8 rounded-lg flex items-center justify-center text-danger hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Page" : "New Page"} className="max-w-2xl">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={editing?.isSystem} placeholder="about-us" /></div>
          </div>
          <div><Label>Meta description</Label><Input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} maxLength={200} /></div>
          <div><Label>Content (HTML)</Label><Textarea rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="font-mono text-xs" placeholder="<h2>Heading</h2><p>…</p>" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />Published</label>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={save}>{editing ? "Save" : "Create"}</Button></div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title="Delete page?" description={`"${deleting?.title}" will be removed.`} confirmLabel="Delete" />
    </div>
  );
}
