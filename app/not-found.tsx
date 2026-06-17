import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="font-serif text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="btn-gradient mt-6 h-11 px-6 rounded-xl font-semibold inline-flex items-center">
        Back home
      </Link>
    </div>
  );
}
