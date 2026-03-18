"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatsCounterProps {
  icon: LucideIcon;
  value: number;
  label: string;
}

export function StatsCounter({ icon: Icon, value, label }: StatsCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!inView || value === 0) return;
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center gap-2 p-6"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Icon className="h-8 w-8 text-gray-400" />
      <span className="text-3xl font-bold text-gray-900">
        {displayValue.toLocaleString("ko-KR")}
      </span>
      <span className="text-sm text-gray-500">{label}</span>
    </motion.div>
  );
}
