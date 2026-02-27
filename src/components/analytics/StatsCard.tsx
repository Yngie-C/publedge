"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  change?: number; // percentage change, positive = up, negative = down
  suffix?: string;
  className?: string;
}

function useCountUp(target: number, duration = 1000): number {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    start.current = null;

    const step = (timestamp: number) => {
      if (!start.current) start.current = timestamp;
      const elapsed = timestamp - start.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      }
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return count;
}

export function StatsCard({
  label,
  value,
  icon,
  change,
  suffix = "",
  className,
}: StatsCardProps) {
  const animatedValue = useCountUp(value);

  const changeDir =
    change === undefined ? null : change > 0 ? "up" : change < 0 ? "down" : "neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="rounded-lg bg-gray-100 p-2 text-gray-600">{icon}</div>
      </div>

      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900">
          {animatedValue.toLocaleString()}
          {suffix && (
            <span className="ml-1 text-lg font-medium text-gray-400">
              {suffix}
            </span>
          )}
        </p>

        {changeDir && change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              changeDir === "up" && "bg-green-50 text-green-700",
              changeDir === "down" && "bg-red-50 text-red-700",
              changeDir === "neutral" && "bg-gray-50 text-gray-500",
            )}
          >
            {changeDir === "up" && <TrendingUp className="h-3 w-3" />}
            {changeDir === "down" && <TrendingDown className="h-3 w-3" />}
            {changeDir === "neutral" && <Minus className="h-3 w-3" />}
            <span>
              {changeDir === "up" ? "+" : ""}
              {change}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
