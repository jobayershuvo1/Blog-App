"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/primitives";
import { PasswordInput } from "@/components/ui/PasswordInput";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed.");
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center animate-fade-in">
        <h1 className="font-serif text-2xl font-bold">Invalid link</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">This reset link is missing or malformed.</p>
        <Link href="/forgot-password" className="btn-gradient mt-6 inline-flex h-11 px-6 rounded-xl font-semibold items-center">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center animate-fade-in">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-4 font-serif text-2xl font-bold">Password reset!</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-3xl font-bold">Set a new password</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Choose a strong password you don&apos;t use elsewhere.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput id="confirm" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" />
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Reset password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto" />}>
      <ResetForm />
    </Suspense>
  );
}
