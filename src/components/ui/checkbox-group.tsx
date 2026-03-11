"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxGroupOption {
  value: string;
  label: string;
  description?: string;
}

export interface CheckboxGroupProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange"> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  options: CheckboxGroupOption[];
  /** Name used for all checkboxes — use formData.getAll(name) */
  name: string;
  defaultValues?: string[];
  /** Controlled mode: current selected values */
  values?: string[];
  /** Controlled mode: called when selection changes */
  onChange?: (values: string[]) => void;
  /** If true, show "Other" option with a textarea */
  showOther?: boolean;
  otherName?: string;
  otherDefaultValue?: string;
  /** Controlled mode: other textarea value */
  otherValue?: string;
  /** Controlled mode: other textarea change handler */
  onOtherChange?: (value: string) => void;
}

const CheckboxGroup = forwardRef<HTMLInputElement, CheckboxGroupProps>(
  (
    {
      className,
      label,
      description,
      error,
      required,
      id,
      options,
      name,
      defaultValues = [],
      values,
      onChange,
      showOther = false,
      otherName,
      otherDefaultValue,
      otherValue,
      onOtherChange,
      ...props
    },
    ref
  ) => {
    const isControlled = onChange !== undefined;

    function isChecked(val: string) {
      if (isControlled && values) return values.includes(val);
      return undefined; // let defaultChecked handle it
    }

    function handleToggle(val: string) {
      if (!isControlled || !values) return;
      const next = values.includes(val)
        ? values.filter((v) => v !== val)
        : [...values, val];
      onChange!(next);
    }

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-on-surface mb-1">
            {label}
            {required && <span className="ml-1 text-xs font-normal text-on-surface-tertiary">(required)</span>}
          </label>
        )}
        {description && (
          <p className="mb-1.5 text-xs text-on-surface-tertiary">
            {description}
          </p>
        )}
        <div
          className={cn(
            "grid gap-2",
            className
          )}
        >
          {options.map((opt) => (
            <label
              key={opt.value}
              className="group flex items-start gap-3 rounded-lg border border-input-border bg-input-bg px-3.5 py-2.5 transition-colors duration-150 hover:border-input-border-hover has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50 dark:has-[:checked]:border-brand-600 dark:has-[:checked]:bg-brand-950/30 cursor-pointer"
            >
              <input
                ref={ref}
                type="checkbox"
                name={name}
                value={opt.value}
                {...(isControlled
                  ? { checked: isChecked(opt.value), onChange: () => handleToggle(opt.value) }
                  : { defaultChecked: defaultValues.includes(opt.value) }
                )}
                className="mt-0.5 h-4 w-4 rounded border-input-border text-brand-600 accent-brand-600 focus:ring-2 focus:ring-brand-500/20"
                {...props}
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
                type="checkbox"
                name={name}
                value="OTHER"
                {...(isControlled
                  ? { checked: isChecked("OTHER"), onChange: () => handleToggle("OTHER") }
                  : { defaultChecked: defaultValues.includes("OTHER") }
                )}
                className="mt-0.5 h-4 w-4 rounded border-input-border text-brand-600 accent-brand-600 focus:ring-2 focus:ring-brand-500/20"
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-on-surface">
                  Other
                </span>
                {isControlled ? (
                  values?.includes("OTHER") && (
                    <textarea
                      placeholder="Please specify..."
                      rows={2}
                      value={otherValue ?? ""}
                      onChange={(e) => onOtherChange?.(e.target.value)}
                      className="mt-2 block w-full rounded-md border border-input-border bg-surface px-3 py-2 text-sm text-on-surface shadow-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-input-border-focus placeholder:text-on-surface-quaternary"
                    />
                  )
                ) : (
                  otherName && (
                    <textarea
                      name={otherName}
                      defaultValue={otherDefaultValue}
                      placeholder="Please specify..."
                      rows={2}
                      className="mt-2 block w-full rounded-md border border-input-border bg-surface px-3 py-2 text-sm text-on-surface shadow-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 focus:border-input-border-focus placeholder:text-on-surface-quaternary"
                    />
                  )
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
);

CheckboxGroup.displayName = "CheckboxGroup";
export { CheckboxGroup };
