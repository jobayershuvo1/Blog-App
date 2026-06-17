import Link from "next/link";
import { ThemeToggle } from "@/components/blog/ThemeToggle";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "BlogForge";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-primary p-12 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <Link href="/" className="flex items-center gap-2 relative">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 font-bold">B</span>
          <span className="font-serif text-2xl font-bold">{SITE_NAME}</span>
        </Link>
        <div className="relative">
          <h2 className="font-serif text-4xl font-bold leading-tight">Stories worth sharing.</h2>
          <p className="mt-4 text-white/80 max-w-md">
            A modern, multilingual publishing platform for writers and readers around the world.
          </p>
        </div>
        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white font-bold">B</span>
            <span className="font-serif text-lg font-bold">{SITE_NAME}</span>
          </Link>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
