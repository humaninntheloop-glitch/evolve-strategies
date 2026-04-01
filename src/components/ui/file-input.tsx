"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UploadStatus = "idle" | "uploading" | "done" | "error";

interface FileInputProps {
  recordId: string;
  existingFile?: { name: string; size: number } | null;
  onUploadComplete?: () => void;
  onRemoveComplete?: () => void;
  disabled?: boolean;
}

export function FileInput({
  recordId,
  existingFile,
  onUploadComplete,
  onRemoveComplete,
  disabled,
}: FileInputProps) {
  const [status, setStatus] = useState<UploadStatus>(existingFile ? "done" : "idle");
  const [fileName, setFileName] = useState(existingFile?.name ?? "");
  const [fileSize, setFileSize] = useState(existingFile?.size ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("File type not supported. Use PDF, Word, Excel, images, or text files.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("File too large. Maximum size is 10 MB.");
        return;
      }

      setStatus("uploading");
      setFileName(file.name);
      setFileSize(file.size);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/records/${recordId}/attachment`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(data.error ?? "Upload failed");
        }

        setStatus("done");
        onUploadComplete?.();
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [recordId, onUploadComplete]
  );

  async function handleRemove() {
    setError(null);
    try {
      const res = await fetch(`/api/records/${recordId}/attachment`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Remove failed" }));
        throw new Error(data.error ?? "Remove failed");
      }
      setStatus("idle");
      setFileName("");
      setFileSize(0);
      if (inputRef.current) inputRef.current.value = "";
      onRemoveComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || status === "uploading") return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (status === "done" && fileName) {
    return (
      <div>
        <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-inset px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-on-surface-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-on-surface truncate">{fileName}</p>
            <p className="text-xs text-on-surface-tertiary">{formatFileSize(fileSize)}</p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && status !== "uploading") setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && status !== "uploading" && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-950/20"
            : "border-border-default hover:border-input-border-hover bg-surface-inset",
          (disabled || status === "uploading") && "opacity-60 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleChange}
          disabled={disabled || status === "uploading"}
        />

        {status === "uploading" ? (
          <>
            <svg className="h-6 w-6 animate-spin text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-on-surface-secondary">Uploading {fileName}...</p>
          </>
        ) : (
          <>
            <svg className="h-6 w-6 text-on-surface-quaternary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-on-surface-secondary">
              <span className="font-medium text-brand-600 dark:text-brand-400">Click to upload</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-on-surface-quaternary">
              PDF, Word, Excel, images, or text (max 10 MB)
            </p>
          </>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
