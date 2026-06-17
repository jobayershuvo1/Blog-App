"use client";

import { useState } from "react";
import { Facebook, Twitter, Linkedin, MessageCircle, Link2, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export function ShareButtons({ url, title, postId }: { url: string; title: string; postId: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  function track() {
    fetch(`/api/posts/${postId}/share`, { method: "POST" }).catch(() => {});
  }

  const links = [
    { name: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, color: "hover:bg-[#1877f2]" },
    { name: "Twitter", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`, color: "hover:bg-[#1da1f2]" },
    { name: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${enc(title + " " + url)}`, color: "hover:bg-[#25d366]" },
    { name: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, color: "hover:bg-[#0a66c2]" },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("linkCopied"));
      track();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-1">{t("share")}:</span>
      {links.map(({ name, icon: Icon, href, color }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={track}
          aria-label={`Share on ${name}`}
          className={`h-10 w-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-white transition ${color}`}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={copy}
        aria-label={t("copyLink")}
        className="h-10 w-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
