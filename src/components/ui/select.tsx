import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, description, error, id, options, placeholder, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-on-surface mb-1">
            {label}
          </label>
        )}
        {description && (
          <p className="mb-1.5 text-xs text-on-surface-tertiary">
            {description}
          </p>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "block h-10 w-full rounded-lg border bg-input-bg px-3 text-sm text-on-surface shadow-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-400/20",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-input-border hover:border-input-border-hover focus:border-input-border-focus",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };
