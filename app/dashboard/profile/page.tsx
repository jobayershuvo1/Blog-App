"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Camera, Loader2, Save, KeyRound } from "lucide-react";
import { Card, Input, Textarea, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Skeleton } from "@/components/ui/Skeleton";

interface Profile {
  name: string;
  email: string;
  username?: string | null;
  avatar: string;
  bio: string;
  socialLinks: Record<string, string>;
}

export default function ProfilePage() {
  const { update: updateSession } = useSession();
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // password section
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setP(d.profile))
      .catch(() => toast.error("Couldn't load your profile."));
  }, []);

  async function uploadAvatar(file: File) {
    if (file.size > 5 * 1024 * 1024) return toast.error("Max image size is 5MB.");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setP((prev) => (prev ? { ...prev, avatar: data.url } : prev));
      toast.success("Photo uploaded — don't forget to save.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    if (!p) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: p.name, avatar: p.avatar, bio: p.bio, socialLinks: p.socialLinks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Profile saved.");
      await updateSession?.({ name: p.name, image: p.avatar });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (pw.next !== pw.confirm) return toast.error("New passwords don't match.");
    if (pw.next.length < 8) return toast.error("New password must be at least 8 characters.");
    setSavingPw(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Password changed.");
      setPw({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setSavingPw(false);
    }
  }

  if (!p) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const setSocial = (k: string, v: string) => setP({ ...p, socialLinks: { ...p.socialLinks, [k]: v } });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Update your photo, name, and details.</p>
      </div>

      {/* Profile card */}
      <Card className="p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {p.avatar ? (
              <Image src={p.avatar} alt={p.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
                {p.name.charAt(0)}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-600 transition"
              aria-label="Change photo"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
          </div>
          <div>
            <p className="font-medium">{p.name}</p>
            <p className="text-sm text-slate-400">{p.email}</p>
            <button onClick={() => fileRef.current?.click()} className="mt-1 text-xs font-medium text-primary hover:underline">
              Change photo
            </button>
          </div>
        </div>

        <div>
          <Label>Name</Label>
          <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea rows={3} value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} placeholder="A short bio shown on your author page" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["website", "twitter", "facebook", "linkedin"] as const).map((k) => (
            <div key={k}>
              <Label className="capitalize">{k}</Label>
              <Input value={p.socialLinks?.[k] || ""} onChange={(e) => setSocial(k, e.target.value)} placeholder="https://" />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button loading={saving} onClick={saveProfile}><Save className="h-4 w-4" />Save changes</Button>
        </div>
      </Card>

      {/* Change password */}
      <Card className="p-6 space-y-4">
        <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="h-5 w-5 text-primary" /> Change password</h3>
        <div>
          <Label>Current password</Label>
          <PasswordInput value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>New password</Label>
            <PasswordInput value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="At least 8 characters" />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <PasswordInput value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" loading={savingPw} onClick={changePassword} disabled={!pw.current || !pw.next}>Update password</Button>
        </div>
      </Card>
    </div>
  );
}
