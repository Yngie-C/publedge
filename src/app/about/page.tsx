import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Headphones,
  BookOpen,
  BarChart3,
  Zap,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "소개",
  description:
    "inspic은 텍스트를 전자책과 오디오북으로 변환하는 지식 콘텐츠 플랫폼입니다.",
};

const features = [
  {
    icon: FileText,
    title: "텍스트만 있으면 충분합니다",
    description:
      "글을 입력하거나 파일(TXT, MD, DOCX)을 업로드하세요. 자동으로 챕터가 나뉘고, 웹에서 바로 읽을 수 있는 전자책이 됩니다.",
  },
  {
    icon: Headphones,
    title: "오디오북 자동 생성",
    description:
      "텍스트를 음성으로 변환해 오디오북을 만들어 드립니다. 추가 비용이나 녹음 장비 없이 듣는 콘텐츠를 제공하세요.",
  },
  {
    icon: BookOpen,
    title: "최적화된 리더 경험",
    description:
      "폰트 크기 조절, 다크 모드, 하이라이트, 북마크 — 독자가 모바일에서도 편안하게 읽을 수 있는 환경을 제공합니다.",
  },
  {
    icon: BarChart3,
    title: "판매와 분석",
    description:
      "콘텐츠에 가격을 설정하고 바로 판매하세요. 판매 현황, 열람 수, 리뷰를 대시보드에서 한눈에 확인할 수 있습니다.",
  },
  {
    icon: Zap,
    title: "30분이면 출판 완료",
    description:
      "기획안 제출, 심사, 편집 과정이 없습니다. 글을 쓰고 발행 버튼을 누르면 바로 독자에게 전달됩니다.",
  },
  {
    icon: Users,
    title: "크리에이터 중심 구조",
    description:
      "콘텐츠의 저작권은 크리에이터에게 귀속됩니다. 투명한 수수료, 빠른 정산, 독자 데이터 — 크리에이터가 주인공입니다.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      {/* Hero */}
      <section className="mb-20 text-center">
        <h1 className="mb-4 font-logo text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          텍스트를 전자책과 오디오북으로
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
          inspic은 누구나 자신의 지식과 이야기를 전자책과 오디오북으로 만들어
          독자에게 전달할 수 있는 콘텐츠 플랫폼입니다.
        </p>
      </section>

      {/* Features Grid */}
      <section className="mb-20">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">
          inspic이 제공하는 것
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
            >
              <feature.icon className="mb-3 h-8 w-8 text-brand-600" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-20">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900">
          어떻게 시작하나요?
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "글을 작성하세요",
              description:
                "에디터에서 직접 쓰거나, 이미 작성한 파일을 업로드하세요.",
            },
            {
              step: "2",
              title: "발행하세요",
              description:
                "가격을 설정하고 발행 버튼을 누르면 전자책이 완성됩니다. 오디오북도 한 번의 클릭으로.",
            },
            {
              step: "3",
              title: "독자를 만나세요",
              description:
                "마켓플레이스에 공개되어 독자가 읽고, 듣고, 리뷰를 남깁니다.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                {item.step}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-brand-100 bg-white px-6 py-14 text-center">
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-brand-200 opacity-30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-brand-200 opacity-30 blur-3xl" />
        <div className="relative">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            나만의 콘텐츠를 출판해보세요
          </h2>
          <p className="mb-8 text-gray-500">
            누구나 무료로 시작할 수 있습니다. 글만 있으면 충분해요.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block rounded-full bg-brand-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>
    </div>
  );
}
