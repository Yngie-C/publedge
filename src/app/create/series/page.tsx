"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { ScheduleSettings } from "@/components/series/ScheduleSettings";

const LANGUAGES = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
];

export default function CreateSeriesPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("ko");
  const [price, setPrice] = useState<number>(0);
  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const validate = (): boolean => {
    if (!title.trim()) {
      setError("시리즈 제목을 입력해주세요.");
      return false;
    }
    setError("");
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsCreating(true);
    setError("");

    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          language,
          price,
          schedule_day: scheduleDay || null,
          schedule_description: scheduleDescription.trim() || null,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "시리즈 생성에 실패했습니다.");
      }

      const json = await res.json();
      const seriesId = json.data?.id;

      router.push(`/series/${seriesId}/manage`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-8">
          <Link
            href="/create"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">새 시리즈 시작</h1>
          <p className="mt-2 text-gray-500">연재 시리즈의 기본 정보를 입력하세요.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Input
              label="시리즈 제목 *"
              type="text"
              placeholder="시리즈 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">설명 (선택)</label>
              <textarea
                placeholder="시리즈에 대한 간단한 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">언어</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
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
              <label className="text-sm font-medium text-gray-700">가격 (원)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  원
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {price === 0
                  ? "무료로 공개됩니다"
                  : `판매 가격: ${price.toLocaleString("ko-KR")}원`}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <ScheduleSettings
                scheduleDay={scheduleDay}
                scheduleDescription={scheduleDescription}
                onScheduleDayChange={setScheduleDay}
                onScheduleDescriptionChange={setScheduleDescription}
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={handleCreate}
                isLoading={isCreating}
                disabled={isCreating}
                size="lg"
                className="w-full rounded-full"
              >
                시리즈 만들기
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
