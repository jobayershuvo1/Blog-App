"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/primitives";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function RegisterAuthorPage() {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    writingSample: "",
    website: "",
    twitter: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/author-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          bio: form.bio,
          writingSample: form.writingSample,
          socialLinks: { website: form.website, twitter: form.twitter },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center animate-fade-in">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-4 font-serif text-2xl font-bold">Application submitted!</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Thanks for applying. Our team will review your request and email you when a decision is made.
        </p>
        <Link href="/" className="btn-gradient mt-6 inline-flex h-11 px-6 rounded-xl font-semibold items-center">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-3xl font-bold">{t("authorTitle")}</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Tell us about yourself. Approved authors can publish to the blog.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="password">{t("password")}</Label>
          <PasswordInput id="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 8 characters" withIcon={false} />
        </div>
        <div>
          <Label htmlFor="bio">{t("bio")}</Label>
          <Textarea id="bio" required rows={3} minLength={20} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A short introduction (min 20 characters)" />
        </div>
        <div>
          <Label htmlFor="sample">{t("writingSample")}</Label>
          <Textarea id="sample" rows={4} value={form.writingSample} onChange={(e) => set("writingSample", e.target.value)} placeholder="Paste a sample of your writing (optional)" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
          </div>
          <div>
            <Label htmlFor="twitter">Twitter</Label>
            <Input id="twitter" value={form.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="https://twitter.com/…" />
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          {t("submit")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Already approved?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">{t("signIn")}</Link>
      </p>
    </div>
  );
}
