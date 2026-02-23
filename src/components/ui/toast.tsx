"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { X, CheckCircle, WarningCircle, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: CheckCircle,
    error: WarningCircle,
    info: Info,
  };

  const styles = {
    success: "border-emerald-200 dark:border-emerald-800",
    error: "border-red-200 dark:border-red-800",
    info: "border-border-default",
  };

  const iconStyles = {
    success: "text-emerald-600 dark:text-emerald-400",
    error: "text-red-600 dark:text-red-400",
    info: "text-zinc-600 dark:text-zinc-400",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-surface-elevated px-4 py-3 shadow-lg animate-fade-in-up",
                styles[t.type]
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", iconStyles[t.type])} />
              <p className="text-sm text-on-surface">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 shrink-0 rounded-md p-0.5 text-on-surface-quaternary transition-colors hover:text-on-surface-secondary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
