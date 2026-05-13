"use client";

import { PenLine, Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step4CompleteProps {
  method: "write" | "upload";
  bookTitle: string;
  bookId: string;
  onGoToEditor: () => void;
  onGoToUpload: () => void;
}

export function Step4Complete({
  method,
  bookTitle,
  bookId,
  onGoToEditor,
  onGoToUpload,
}: Step4CompleteProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="rounded-full bg-green-100 p-4">
        <BookOpen className="h-8 w-8 text-green-600" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          책이 준비되었어요!
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          &ldquo;{bookTitle}&rdquo; 책을 만들 준비가 끝났어요.
          {method === "write"
            ? " 이제 에디터에서 글을 작성해볼까요?"
            : " 이제 파일을 업로드해볼까요?"}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {method === "write" ? (
          <Button
            onClick={onGoToEditor}
            size="lg"
            className="flex items-center justify-center gap-2 rounded-full"
          >
            <PenLine className="h-4 w-4" />
            에디터에서 작성 시작하기
          </Button>
        ) : (
          <Button
            onClick={onGoToUpload}
            size="lg"
            className="flex items-center justify-center gap-2 rounded-full"
          >
            <Upload className="h-4 w-4" />
            파일 업로드하러 가기
          </Button>
        )}
      </div>
    </div>
  );
}
