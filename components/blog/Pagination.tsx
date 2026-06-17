import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  basePath,
  page,
  total,
  perPage,
  extraParams = "",
}: {
  basePath: string;
  page: number;
  total: number;
  perPage: number;
  extraParams?: string;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const href = (p: number) => `${basePath}?page=${p}${extraParams ? `&${extraParams}` : ""}`;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      {page > 1 && (
        <Link href={href(page - 1)} className="h-10 w-10 rounded-xl flex items-center justify-center border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {nums.map((n, i) => {
        const gap = i > 0 && n - nums[i - 1] > 1;
        return (
          <span key={n} className="flex items-center">
            {gap && <span className="px-2 text-slate-400">…</span>}
            <Link
              href={href(n)}
              className={`h-10 min-w-10 px-3 rounded-xl flex items-center justify-center text-sm font-medium ${
                n === page
                  ? "btn-gradient"
                  : "border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {n}
            </Link>
          </span>
        );
      })}
      {page < pages && (
        <Link href={href(page + 1)} className="h-10 w-10 rounded-xl flex items-center justify-center border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
