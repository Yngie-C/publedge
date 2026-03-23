"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChapterPublishFormProps {
  seriesId: string;
  nextOrderIndex: number;
  onSuccess?: () => void;
}

export function ChapterPublishForm({ seriesId, nextOrderIndex, onSuccess }: ChapterPublishFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateDraft = async () => {
    if (!title.trim()) {
      setError("챕터 제목을 입력해주세요.");
      return;
    }
    setError("");
    setIsCreating(true);
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: seriesId,
          title: title.trim(),
          content_html: "",
          content_raw: "",
          order_index: nextOrderIndex,
          status: "draft",
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "챕터 생성에 실패했습니다.");
      }
      const json = await res.json();
      const chapterId = json.data?.id;
      if (chapterId) {
        router.push(`/editor/${seriesId}?chapter=${chapterId}`);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-base font-semibold text-gray-900 flex items-center gap-2">
        <PenLine className="h-4 w-4 text-gray-400" />
        새 챕터 작성
      </h3>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={`${nextOrderIndex + 1}화 제목을 입력하세요`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateDraft()}
          />
        </div>
        <Button
          onClick={handleCreateDraft}
          isLoading={isCreating}
          disabled={isCreating}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
          작성하기
        </Button>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        임시저장 상태로 생성됩니다. 에디터에서 내용을 완성하고 발행하세요.
      </p>
    </div>
  );
}
