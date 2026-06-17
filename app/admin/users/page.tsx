"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { ArrowUp, ArrowDown, Power, FileText, ShieldCheck } from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

interface U {
  _id: string; name: string; email: string; username?: string;
  role: string; status: string; createdAt: string; postCount: number;
}

const ROLE_COLOR: Record<string, "primary" | "blue" | "gray"> = {
  super_admin: "primary", moderator: "blue", author: "gray",
};

export default function UsersPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "super_admin";
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "promote" | "make_admin" | "demote" | "activate" | "deactivate") {
    setBusy(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Users</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage authors and moderators.{!isSuperAdmin && " Only the super admin can change roles."}</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Role</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Posts</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isSuperAdmin && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{u.name.charAt(0)}</span>
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><Badge color={ROLE_COLOR[u.role] || "gray"}>{u.role.replace("_", " ")}</Badge></td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {u.username ? <Link href={`/author/${u.username}`} className="flex items-center gap-1 text-slate-500 hover:text-primary"><FileText className="h-3.5 w-3.5" />{u.postCount}</Link> : <span className="text-slate-500">{u.postCount}</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3"><Badge color={u.status === "active" ? "green" : "red"}>{u.status}</Badge></td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        {u._id === session?.user?.id ? (
                          <span className="block text-right text-xs text-slate-400">You</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {u.role === "author" && <button onClick={() => act(u._id, "promote")} disabled={busy === u._id} className="h-8 px-2 rounded-lg flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10" title="Promote to moderator"><ArrowUp className="h-3.5 w-3.5" />Moderator</button>}
                            {u.role !== "super_admin" && <button onClick={() => act(u._id, "make_admin")} disabled={busy === u._id} className="h-8 px-2 rounded-lg flex items-center gap-1 text-xs text-primary hover:bg-primary/10" title="Make super admin"><ShieldCheck className="h-3.5 w-3.5" />Make Admin</button>}
                            {u.role !== "author" && <button onClick={() => act(u._id, "demote")} disabled={busy === u._id} className="h-8 px-2 rounded-lg flex items-center gap-1 text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700" title="Demote one level"><ArrowDown className="h-3.5 w-3.5" />Demote</button>}
                            {u.role !== "super_admin" && <button onClick={() => act(u._id, u.status === "active" ? "deactivate" : "activate")} disabled={busy === u._id} className={`h-8 px-2 rounded-lg flex items-center gap-1 text-xs ${u.status === "active" ? "text-danger hover:bg-red-50 dark:hover:bg-red-500/10" : "text-success hover:bg-emerald-50 dark:hover:bg-emerald-500/10"}`}><Power className="h-3.5 w-3.5" />{u.status === "active" ? "Deactivate" : "Activate"}</button>}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
