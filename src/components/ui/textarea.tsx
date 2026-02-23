import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-on-surface mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "block w-full rounded-lg border bg-input-bg px-3 py-2.5 text-sm text-on-surface shadow-xs placeholder:text-on-surface-quaternary transition-colors duration-150 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-400/20",
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

Textarea.displayName = "Textarea";
export { Textarea };
