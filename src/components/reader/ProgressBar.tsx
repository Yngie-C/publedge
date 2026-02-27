"use client";

interface ProgressBarProps {
  currentPage: number;
  totalPages: number;
  percentage: number;
  className?: string;
}

export function ProgressBar({
  currentPage,
  totalPages,
  percentage,
  className = "",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`w-full ${className}`}>
      <div className="relative h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1 px-1">
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {currentPage} / {totalPages}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}
