import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-on-surface mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "block h-10 w-full rounded-lg border bg-input-bg px-3 text-sm text-on-surface shadow-xs placeholder:text-on-surface-quaternary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-400/20",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-input-border hover:border-input-border-hover focus:border-input-border-focus",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
