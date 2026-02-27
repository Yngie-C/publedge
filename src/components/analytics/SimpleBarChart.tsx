"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BarDataItem {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarDataItem[];
  title?: string;
  className?: string;
  valueLabel?: string;
  height?: number;
}

export function SimpleBarChart({
  data,
  title,
  className,
  valueLabel = "",
  height = 200,
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-gray-200 bg-white p-6",
          className,
        )}
      >
        <p className="text-sm text-gray-400">데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white p-5",
        className,
      )}
    >
      {title && (
        <p className="mb-4 text-sm font-semibold text-gray-700">{title}</p>
      )}

      {/* Vertical bar chart */}
      <div
        className="flex items-end gap-2"
        style={{ height: `${height}px` }}
      >
        {data.map((item, i) => {
          const pct = (item.value / maxValue) * 100;
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow">
                  {item.value.toLocaleString()}
                  {valueLabel}
                </div>
                <div className="mx-auto h-1.5 w-1.5 -translate-y-px rotate-45 bg-gray-900" />
              </div>

              {/* Bar */}
              <motion.div
                className="w-full rounded-t-md bg-gray-900"
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                style={{ minHeight: item.value > 0 ? "4px" : "0px" }}
              />

              {/* Label */}
              <p className="mt-1.5 truncate text-center text-[10px] text-gray-400 w-full px-0.5">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Y-axis reference lines (background grid) */}
      <div className="mt-2 flex justify-between text-xs text-gray-300">
        <span>0</span>
        <span>{Math.round(maxValue / 2).toLocaleString()}</span>
        <span>{maxValue.toLocaleString()}</span>
      </div>
    </div>
  );
}
