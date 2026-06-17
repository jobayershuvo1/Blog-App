import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ─── Card ──────────────────────────────────────────────── */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-surface-dark-card shadow-sm",
        className
      )}
      {...props}
    />
  );
}

/* ─── Badge ─────────────────────────────────────────────── */
type BadgeColor = "primary" | "gray" | "green" | "yellow" | "red" | "blue";
const badgeColors: Record<BadgeColor, string> = {
  primary: "bg-primary/10 text-primary dark:bg-primary/20",
  gray: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  yellow: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
};

export function Badge({
  color = "gray",
  className,
  style,
  children,
}: {
  color?: BadgeColor;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeColors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ─── Input ─────────────────────────────────────────────── */
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/60",
        "px-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

/* ─── Textarea ──────────────────────────────────────────── */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/60",
      "px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ─── Select ────────────────────────────────────────────── */
export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full h-11 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/60",
      "px-3 text-sm text-slate-900 dark:text-slate-100",
      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/* ─── Label ─────────────────────────────────────────────── */
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5", className)}
      {...props}
    />
  );
}
