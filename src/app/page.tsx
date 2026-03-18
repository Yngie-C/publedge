"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Monitor, ArrowRight, PlusCircle, Search } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Variants } from "framer-motion";

const features = [
  {
    icon: PlusCircle,
    title: "전자책 만들기",
    description:
      "TXT, Markdown, DOCX 파일을 업로드하거나 직접 작성하여 전자책을 만드세요. 챕터 자동 감지 및 편집이 가능합니다.",
  },
  {
    icon: Headphones,
    title: "오디오북 변환",
    description:
      "AI 음성 합성 기술로 전자책을 오디오북으로 변환하세요. 다양한 목소리와 언어를 지원합니다. (출시 예정)",
  },
  {
    icon: Monitor,
    title: "웹 리더",
    description:
      "어디서든 브라우저로 전자책을 읽으세요. 북마크, 하이라이트, 읽기 설정을 지원합니다.",
  },
  {
    icon: Search,
    title: "전자책 탐색",
    description:
      "다양한 전자책을 발견하고, 저자를 팔로우하고, 리뷰를 남겨보세요.",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function LandingPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6 max-w-3xl"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Publedge
          </h1>

          <p className="text-xl text-gray-500 max-w-xl leading-relaxed">
            읽고, 만들고, 공유하세요. 전자책의 모든 것을 한 곳에서.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <>
                <Button size="lg" asChild>
                  <Link href="/explore" className="flex items-center gap-2">
                    탐색하기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/create">새 전자책 만들기</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/explore" className="flex items-center gap-2">
                    둘러보기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/signup">시작하기</Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              모든 출판 과정을 한 곳에서
            </h2>
            <p className="mt-3 text-gray-500">
              복잡한 도구 없이 Publedge 하나로 전자책 출판의 처음부터 끝까지.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {features.map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                variants={itemVariants}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gray-900">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gray-900 px-4 py-16 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <h2 className="mb-4 text-3xl font-bold text-white">
            지금 바로 첫 전자책을 만들어보세요
          </h2>
          <p className="mb-8 text-gray-400">
            회원가입은 무료입니다. 신용카드가 필요하지 않습니다.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link
              href={user ? "/create" : "/auth/signup"}
              className="flex items-center gap-2"
            >
              {user ? "새 전자책 만들기" : "무료로 시작하기"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
