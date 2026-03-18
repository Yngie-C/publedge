"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FILTERS = [
  { label: "전체", href: "/explore" },
  { label: "무료", href: "/explore?priceRange=free" },
  { label: "한국어", href: "/explore?language=ko" },
  { label: "English", href: "/explore?language=en" },
  { label: "최신순", href: "/explore?sort=newest" },
  { label: "인기순", href: "/explore?sort=popular" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function QuickFilterBar() {
  return (
    <motion.div
      className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {FILTERS.map((filter) => (
        <motion.div key={filter.href} variants={item}>
          <Link
            href={filter.href}
            className="inline-block whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {filter.label}
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
