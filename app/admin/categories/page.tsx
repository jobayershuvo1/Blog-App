"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Card, Badge, Input, Textarea, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface Cat {
  _id: string; name: string; slug: string; description?: string;
  color: string; icon: string; coverImage?: string; postCount: number; order: number;
}

const EMPTY = { name: "", description: "", color: "#6366f1", icon: "📝", coverImage: "" };

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Cat | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCats((data.categories || []).map((c: any) => ({ ...c, _id: String(c._id) })));
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(c: Cat) {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", color: c.color, icon: c.icon, coverImage: c.coverImage || "" });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/categories/${editing._id}` : "/api/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? "Category updated." : "Category created.");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally { setBusy(false); }
  }

  async function remove(c: Cat) {
    try {
      const res = await fetch(`/api/categories/${c._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Category deleted.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= cats.length) return;
    const reordered = [...cats];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setCats(reordered);
    await fetch("/api/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((c) => c._id) }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400">Organize posts into colorful categories.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> New</Button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : cats.length === 0 ? (
        <EmptyState title="No categories" description="Create your first category." action={<Button onClick={openNew}><Plus className="h-4 w-4" />New category</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((c, i) => (
            <Card key={c._id} className="p-5 card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${c.color}22` }}>{c.icon}</span>
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <Badge style={{ backgroundColor: `${c.color}22`, color: c.color }}>{c.postCount} posts</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                </div>
              </div>
              {c.description && <p className="mt-3 text-sm text-slate-500 line-clamp-2">{c.description}</p>}
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="flex-1"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(c)} className="text-danger"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit Category" : "New Category"}>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={4} /></div>
            <div><Label>Color</Label><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-600 cursor-pointer" /></div>
          </div>
          <div><Label>Cover image URL (optional)</Label><Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={save}>{editing ? "Save" : "Create"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title="Delete category?" description={`"${deleting?.name}" will be deleted. Posts in it will be uncategorized.`} confirmLabel="Delete" />
    </div>
  );
}
