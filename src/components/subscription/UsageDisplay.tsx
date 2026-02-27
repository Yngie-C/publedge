"use client";

import { Headphones, HardDrive, AlertTriangle } from "lucide-react";
import type { Subscription } from "@/types/social";
import { cn } from "@/lib/utils";

interface UsageDisplayProps {
  subscription: Subscription;
}

interface ProgressBarProps {
  used: number;
  limit: number;
  label: string;
  unit: string;
  icon: React.ReactNode;
  warningThreshold?: number;
}

function ProgressBar({
  used,
  limit,
  label,
  unit,
  icon,
  warningThreshold = 0.8,
}: ProgressBarProps) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = pct >= warningThreshold * 100;
  const isFull = pct >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{icon}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {(isWarning || isFull) && (
            <AlertTriangle
              className={cn(
                "h-3.5 w-3.5",
                isFull ? "text-red-500" : "text-yellow-500",
              )}
            />
          )}
        </div>
        <span className="text-sm text-gray-500">
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isFull
              ? "bg-red-500"
              : isWarning
              ? "bg-yellow-400"
              : "bg-gray-900",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isFull && (
        <p className="text-xs text-red-600">한도에 도달했습니다. 플랜을 업그레이드하세요.</p>
      )}
      {isWarning && !isFull && (
        <p className="text-xs text-yellow-600">
          한도의 {Math.round(pct)}%를 사용했습니다.
        </p>
      )}
    </div>
  );
}

function formatStorage(mb: number): { value: number; unit: string } {
  if (mb >= 1000) return { value: mb / 1000, unit: "GB" };
  return { value: mb, unit: "MB" };
}

export function UsageDisplay({ subscription }: UsageDisplayProps) {
  const storageFmt = formatStorage(subscription.storage_limit_mb);
  // For demo: used storage is simulated as 0 since we don't track it in this schema
  const storageUsed = 0;
  const storageUsedFmt = formatStorage(storageUsed);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
      <h3 className="text-sm font-semibold text-gray-900">사용량</h3>

      <ProgressBar
        used={subscription.tts_used_this_month}
        limit={subscription.tts_monthly_limit}
        label="TTS 변환 (이번 달)"
        unit="권"
        icon={<Headphones className="h-4 w-4" />}
      />

      <ProgressBar
        used={storageUsedFmt.value}
        limit={storageFmt.value}
        label="저장 공간"
        unit={storageFmt.unit}
        icon={<HardDrive className="h-4 w-4" />}
      />

      {subscription.current_period_end && (
        <p className="text-xs text-gray-400">
          다음 갱신일:{" "}
          {new Date(subscription.current_period_end).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
