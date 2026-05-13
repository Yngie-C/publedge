"use client";

import { PenLine, Upload } from "lucide-react";

export type CreationMethod = "write" | "upload";

interface Step2CreationMethodProps {
  value: CreationMethod | null;
  onChange: (value: CreationMethod) => void;
}

export function Step2CreationMethod({
  value,
  onChange,
}: Step2CreationMethodProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        어떻게 책을 만들지 선택해주세요. 언제든지 파일을 추가로 업로드할 수 있어요.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("write")}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
            value === "write"
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div
            className={`rounded-full p-3 ${
              value === "write" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            <PenLine className="h-6 w-6" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">직접 작성하기</div>
            <div className="mt-1 text-xs text-gray-500">
              에디터에서 직접 글을 작성하며 책을 만들어요
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange("upload")}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
            value === "upload"
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div
            className={`rounded-full p-3 ${
              value === "upload" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">파일 업로드하기</div>
            <div className="mt-1 text-xs text-gray-500">
              TXT, Markdown, DOCX 파일로 한 번에 불러와요
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
