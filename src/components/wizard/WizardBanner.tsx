"use client";

import { useState } from "react";
import { X, ChevronRight, ImageIcon, Eye, Megaphone } from "lucide-react";

interface WizardBannerProps {
  bookId: string;
}

type GuideStep = "write" | "cover" | "preview" | "publish";

export function WizardBanner({ bookId }: WizardBannerProps) {
  const [visible, setVisible] = useState(true);
  const [currentGuide, setCurrentGuide] = useState<GuideStep>("write");

  if (!visible) return null;

  const steps: { key: GuideStep; icon: React.ReactNode; title: string; description: string; action?: { label: string; href?: string } }[] = [
    {
      key: "write",
      icon: <span className="text-lg">✍️</span>,
      title: "첫 챕터를 작성해보세요",
      description: "에디터에서 자유롭게 글을 쓰고, 필요하면 오른쪽 + 버튼으로 챕터를 추가할 수 있어요.",
    },
    {
      key: "cover",
      icon: <ImageIcon className="h-5 w-5" />,
      title: "커버 이미지를 설정해보세요",
      description: "책 표지는 독자의 첫인상이에요. 우측 상단 '설정'에서 커버 이미지를 추가할 수 있어요.",
      action: { label: "설정 열기" },
    },
    {
      key: "preview",
      icon: <Eye className="h-5 w-5" />,
      title: "미리보기로 확인해보세요",
      description: "독자에게 어떻게 보일지 미리 확인할 수 있어요. 내용이 잘 나오는지 체크해보세요.",
      action: { label: "미리보기", href: `/create/preview/${bookId}` },
    },
    {
      key: "publish",
      icon: <Megaphone className="h-5 w-5" />,
      title: "책을 출판해보세요!",
      description: "내용이 만족스러우면 상단의 '출판' 버튼을 눌러 세상에 공개해보세요.",
    },
  ];

  const current = steps.find((s) => s.key === currentGuide)!;
  const currentIdx = steps.findIndex((s) => s.key === currentGuide);

  return (
    <div className="border-b border-brand-200 bg-gradient-to-r from-brand-50 to-orange-50 px-4 py-3 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
          {current.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{current.title}</p>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
              {currentIdx + 1}/{steps.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{current.description}</p>
          <div className="mt-2 flex items-center gap-2">
            {current.action?.href ? (
              <a
                href={current.action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
              >
                {current.action.label}
                <ChevronRight className="h-3 w-3" />
              </a>
            ) : current.action ? (
              <span className="text-xs text-brand-600 font-medium">
                {current.action.label}
              </span>
            ) : null}
            {currentIdx < steps.length - 1 && (
              <button
                type="button"
                onClick={() => setCurrentGuide(steps[currentIdx + 1].key)}
                className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
              >
                다음 안내 보기
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
