"use client";

import { Calendar } from "lucide-react";

const DAYS = [
  { value: "mon", label: "월요일" },
  { value: "tue", label: "화요일" },
  { value: "wed", label: "수요일" },
  { value: "thu", label: "목요일" },
  { value: "fri", label: "금요일" },
  { value: "sat", label: "토요일" },
  { value: "sun", label: "일요일" },
];

interface ScheduleSettingsProps {
  scheduleDay: string;
  scheduleDescription: string;
  onScheduleDayChange: (day: string) => void;
  onScheduleDescriptionChange: (desc: string) => void;
}

export function ScheduleSettings({
  scheduleDay,
  scheduleDescription,
  onScheduleDayChange,
  onScheduleDescriptionChange,
}: ScheduleSettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">연재 일정 (선택)</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-gray-600">연재 요일</label>
        <select
          value={scheduleDay}
          onChange={(e) => onScheduleDayChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        >
          <option value="">요일 선택 안함</option>
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-gray-600">연재 주기 설명</label>
        <input
          type="text"
          placeholder="예: 매주 월요일 오전 10시 업데이트"
          value={scheduleDescription}
          onChange={(e) => onScheduleDescriptionChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        />
        <p className="text-xs text-gray-400">독자에게 표시되는 연재 주기 안내 문구입니다.</p>
      </div>
    </div>
  );
}
