"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/primitives";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center animate-fade-in">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-4 font-serif text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a password reset link.
          It expires in 1 hour.
        </p>
        <Link href="/login" className="btn-gradient mt-6 inline-flex h-11 px-6 rounded-xl font-semibold items-center">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-3xl font-bold">Forgot password?</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="you@example.com" />
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Send reset link
        </Button>
      </form>

      <Link href="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </div>
  );
}
