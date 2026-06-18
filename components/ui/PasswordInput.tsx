"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show the leading lock icon (default true). */
  withIcon?: boolean;
}

/** Password field with a show/hide (eye) toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, withIcon = true, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        {withIcon && <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
        <input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn(
            "w-full h-11 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/60",
            "text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition",
            withIcon ? "pl-10" : "pl-4",
            "pr-11",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
