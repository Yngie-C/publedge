"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface HeroSectionProps {
  totalBooks?: number;
}

export function HeroSection({ totalBooks }: HeroSectionProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          className="flex flex-col items-center gap-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            콘텐츠을 발견하고, 읽고, 출판하세요
          </h1>

          <p className="text-sm text-gray-300">
            다양한 콘텐츠을 탐색하고 나만의 콘텐츠을 만들어보세요
          </p>

          <form onSubmit={handleSearch} className="w-full max-w-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="콘텐츠 검색..."
                className="w-full rounded-full border border-white/20 bg-white/10 py-3 pl-12 pr-6 text-white placeholder:text-gray-400 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
              />
            </div>
          </form>

          {totalBooks != null && (
            <p className="text-xs text-gray-400">
              콘텐츠 {totalBooks.toLocaleString("ko-KR")}권 등록됨
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
