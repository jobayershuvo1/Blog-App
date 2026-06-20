"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send, CheckCircle2 } from "lucide-react";
import { Card, Input, Textarea, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="mt-8 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h3 className="mt-3 font-serif text-xl font-bold">Message sent!</h3>
        <p className="mt-1 text-slate-500 dark:text-slate-400">We&apos;ll get back to you soon.</p>
      </Card>
    );
  }

  return (
    <Card className="mt-8 p-6">
      <h2 className="font-serif text-2xl font-bold mb-4">Send us a message</h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input required value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        </div>
        <div><Label>Subject</Label><Input required value={f.subject} onChange={(e) => set("subject", e.target.value)} /></div>
        <div><Label>Message</Label><Textarea rows={5} required value={f.message} onChange={(e) => set("message", e.target.value)} /></div>
        <Button type="submit" loading={loading}><Send className="h-4 w-4" />Send message</Button>
      </form>
    </Card>
  );
}
