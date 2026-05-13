"use client";

import { Input } from "@/components/ui/input";

const LANGUAGES = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
];

interface BookBasics {
  title: string;
  description: string;
  language: string;
  price: number;
}

interface Step1BookInfoProps {
  data: BookBasics;
  onChange: (data: BookBasics) => void;
}

export function Step1BookInfo({ data, onChange }: Step1BookInfoProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-gray-500">
        만들고 싶은 책의 기본 정보를 입력해주세요. 모든 항목은 나중에 수정할 수 있어요.
      </p>

      <Input
        label="책 제목 *"
        type="text"
        placeholder="예: 나의 첫 번째 전자책"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          책 설명 (선택)
        </label>
        <textarea
          placeholder="어떤 내용의 책인지 간단히 소개해주세요"
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">언어</label>
        <select
          value={data.language}
          onChange={(e) => onChange({ ...data, language: e.target.value })}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          가격 (원)
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="100"
            value={data.price}
            onChange={(e) =>
              onChange({
                ...data,
                price: Math.max(0, parseInt(e.target.value) || 0),
              })
            }
            placeholder="0"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            원
          </span>
        </div>
        <p className="text-xs text-gray-400">
          {data.price === 0
            ? "무료로 공개됩니다"
            : `판매 가격: ${data.price.toLocaleString("ko-KR")}원`}
        </p>
      </div>
    </div>
  );
}
