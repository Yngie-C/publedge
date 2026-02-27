"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string[];
  maxSizeMB?: number;
  className?: string;
}

const DEFAULT_ACCEPT = [".txt", ".md", ".docx"];

export function FileDropzone({
  onFileSelect,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 20,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const getMaxSize = (file: File): number => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (ext === ".txt" || ext === ".md") return 5 * 1024 * 1024;
    return maxSizeMB * 1024 * 1024;
  };

  const validate = useCallback(
    (file: File): string => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!accept.includes(ext)) {
        return `지원하지 않는 파일 형식입니다. (지원: ${accept.join(", ")})`;
      }
      const maxBytes = getMaxSize(file);
      if (file.size > maxBytes) {
        const mb = Math.round(maxBytes / 1024 / 1024);
        return `파일 크기가 너무 큽니다. (최대 ${mb}MB)`;
      }
      return "";
    },
    [accept, maxSizeMB],
  );

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        setSelectedFile(null);
        return;
      }
      setError("");
      setSelectedFile(file);
      onFileSelect(file);
    },
    [validate, onFileSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors",
          isDragging
            ? "border-gray-900 bg-gray-50"
            : "border-gray-300 bg-white hover:border-gray-400",
          !selectedFile && "cursor-pointer",
        )}
      >
        {selectedFile ? (
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-gray-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Upload className="h-7 w-7 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {accept.join(", ")} 지원 &middot; TXT/MD 최대 5MB, DOCX 최대 {maxSizeMB}MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
