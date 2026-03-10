"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  label?: string;
  description?: string;
  error?: string;
  options: RadioGroupOption[];
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  showOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  className?: string;
}

export function RadioGroup({
  label,
  description,
  error,
  options,
  name,
  value,
  defaultValue,
  onChange,
  showOther = false,
  otherValue = "",
  onOtherChange,
  className,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selected = value !== undefined ? value : internalValue;

  function handleChange(val: string) {
    if (value === undefined) setInternalValue(val);
    onChange?.(val);
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-on-surface mb-1">
          {label}
        </label>
      )}
      {description && (
        <p className="mb-1.5 text-xs text-on-surface-tertiary">
          {description}
        </p>
      )}
      <div className={cn("grid gap-2", className)}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className="group flex items-start gap-3 rounded-lg border border-input-border bg-input-bg px-3.5 py-2.5 transition-colors duration-150 hover:border-input-border-hover has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50 dark:has-[:checked]:border-brand-600 dark:has-[:checked]:bg-brand-950/30 cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => handleChange(opt.value)}
              className="mt-0.5 h-4 w-4 border-input-border text-brand-600 accent-brand-600 focus:ring-2 focus:ring-brand-500/20"
            />
            <div className="min-w-0">
              <span className="text-sm font-medium text-on-surface">
                {opt.label}
              </span>
              {opt.description && (
                <p className="mt-0.5 text-xs text-on-surface-tertiary">
                  {opt.description}
                </p>
              )}
            </div>
          </label>
        ))}

        {showOther && (
          <label className="group flex items-start gap-3 rounded-lg border border-input-border bg-input-bg px-3.5 py-2.5 transition-colors duration-150 hover:border-input-border-hover has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50 dark:has-[:checked]:border-brand-600 dark:has-[:checked]:bg-brand-950/30 cursor-pointer">
            <input
              type="radio"
              name={name}
              value="OTHER"
              checked={selected === "OTHER"}
              onChange={() => handleChange("OTHER")}
              className="mt-0.5 h-4 w-4 border-input-border text-brand-600 accent-brand-600 focus:ring-2 focus:ring-brand-500/20"
            />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-on-surface">
                Other
              </span>
              {selected === "OTHER" && (
                <textarea
                  placeholder="Please specify..."
                  rows={2}
                  value={otherValue}
                  onChange={(e) => onOtherChange?.(e.target.value)}
                  className="mt-2 block w-full rounded-md border border-input-border bg-surface px-3 py-2 text-sm text-on-surface shadow-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-input-border-focus placeholder:text-on-surface-quaternary"
                />
              )}
            </div>
          </label>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
