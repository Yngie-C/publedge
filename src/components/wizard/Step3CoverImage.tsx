"use client";

import { useState, useRef } from "react";
import { ImageIcon, Upload, X } from "lucide-react";

interface Step3CoverImageProps {
  bookId: string | null; // null when we haven't created the book yet
  onSkip: () => void;
  onComplete: (coverUrl: string | null) => void;
}

export function Step3CoverImage({
  bookId,
  onSkip,
  onComplete,
}: Step3CoverImageProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    // Show local preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload if we have a bookId
    if (bookId) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch(`/api/books/${bookId}/cover`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "커버 업로드에 실패했습니다.");
        }

        const json = await res.json();
        onComplete(json.data.cover_image_url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다."
        );
      } finally {
        setUploading(false);
      }
    } else {
      // No bookId yet — just keep the preview, upload will happen later
      onComplete(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        책의 표지 이미지를 설정해주세요. 나중에 언제든지 변경할 수 있어요.
      </p>

      {preview ? (
        <div className="relative mx-auto w-48">
          <img
            src={preview}
            alt="커버 미리보기"
            className="aspect-[3/4] w-full rounded-xl border border-gray-200 object-cover shadow-sm"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mx-auto flex w-48 flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <div className="rounded-full bg-gray-100 p-3">
            <ImageIcon className="h-6 w-6 text-gray-500" />
          </div>
          <span className="text-sm text-gray-500">
            클릭해서 이미지 선택
          </span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {uploading && (
        <p className="text-center text-sm text-gray-500">업로드 중...</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onSkip}
        className="text-center text-sm text-gray-400 underline underline-offset-2 hover:text-gray-600"
      >
        나중에 설정할게요
      </button>
    </div>
  );
}
