"use client";

import { Calendar, Users, BookOpen, Clock } from "lucide-react";
import type { SeriesMetadata } from "@/types";

const DAY_LABELS: Record<string, string> = {
  mon: "월요일",
  tue: "화요일",
  wed: "수요일",
  thu: "목요일",
  fri: "금요일",
  sat: "토요일",
  sun: "일요일",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ongoing: { label: "연재중", className: "bg-green-100 text-green-700" },
  hiatus: { label: "휴재", className: "bg-amber-100 text-amber-700" },
  completed: { label: "완결", className: "bg-blue-100 text-blue-700" },
};

interface SeriesInfoProps {
  metadata: SeriesMetadata;
  publishedChapterCount: number;
  subscriberCount?: number;
}

export function SeriesInfo({ metadata, publishedChapterCount, subscriberCount }: SeriesInfoProps) {
  const statusInfo = STATUS_LABELS[metadata.series_status];
  const dayLabel = metadata.schedule_day ? DAY_LABELS[metadata.schedule_day] : null;
  const lastPublished = metadata.last_chapter_published_at
    ? new Date(metadata.last_chapter_published_at).toLocaleDateString("ko-KR")
    : null;

  return (
    <div className="flex flex-wrap gap-3">
      {/* Series status */}
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>

      {/* Published chapters */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
        <BookOpen className="h-3.5 w-3.5" />
        총 {publishedChapterCount}화
      </span>

      {/* Subscriber count */}
      {subscriberCount !== undefined && subscriberCount > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          <Users className="h-3.5 w-3.5" />
          구독자 {subscriberCount.toLocaleString()}명
        </span>
      )}

      {/* Schedule */}
      {(dayLabel || metadata.schedule_description) && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          <Calendar className="h-3.5 w-3.5" />
          {metadata.schedule_description ?? `매주 ${dayLabel} 업데이트`}
        </span>
      )}

      {/* Last published */}
      {lastPublished && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          <Clock className="h-3.5 w-3.5" />
          최근 업데이트 {lastPublished}
        </span>
      )}
    </div>
  );
}
