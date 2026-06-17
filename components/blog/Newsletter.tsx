"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Mail, Loader2 } from "lucide-react";

export function Newsletter() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("success"));
      setEmail("");
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-gradient-primary p-8 sm:p-12 text-white shadow-xl shadow-primary/20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
          <Mail className="h-7 w-7" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold">{t("title")}</h2>
        <p className="mt-2 text-white/80">{t("subtitle")}</p>
        <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 h-12 rounded-xl px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 rounded-xl bg-white text-primary font-semibold hover:bg-slate-100 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("subscribe")}
          </button>
        </form>
      </div>
    </div>
  );
}
