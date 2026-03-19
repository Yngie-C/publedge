import type { Metadata } from "next";
import { FaqAccordion } from "./FaqAccordion";
import type { FaqItem } from "./FaqAccordion";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
};

const faqItems: FaqItem[] = [
  {
    question: "결제가 안 돼요. 어떻게 하나요?",
    answer:
      "토스페이먼츠를 통해 결제가 진행됩니다. 카드 정보를 확인하시고, 문제가 지속되면 contact@inspic.kr로 문의해주세요.",
  },
  {
    question: "환불은 어떻게 하나요?",
    answer:
      "디지털 콘텐츠 특성상 콘텐츠 열람 후에는 환불이 제한됩니다. 미열람 상태에서 구매 후 7일 이내에 환불을 요청하시면 전액 환불해드립니다. contact@inspic.kr로 문의해주세요.",
  },
  {
    question: "모바일에서도 볼 수 있나요?",
    answer:
      "네, inspic은 모바일 웹에 최적화되어 있습니다. 별도 앱 설치 없이 모바일 브라우저에서 바로 읽고 들을 수 있습니다. 폰트 크기 조절, 다크 모드 등 편리한 읽기 환경을 제공합니다.",
  },
  {
    question: "오디오북은 어떻게 듣나요?",
    answer:
      "콘텐츠에 오디오북이 생성되어 있다면, 콘텐츠 상세 페이지에서 '듣기' 버튼을 눌러 바로 재생할 수 있습니다. 재생 속도 조절(0.5x~2.0x)과 챕터 이동이 가능합니다.",
  },
  {
    question: "하이라이트와 북마크는 어떻게 사용하나요?",
    answer:
      "읽기 화면에서 텍스트를 드래그하면 하이라이트를 추가할 수 있습니다. 색상을 선택하고 메모도 남길 수 있어요. 북마크는 현재 읽고 있는 위치를 저장하는 기능입니다.",
  },
  {
    question: "내 콘텐츠를 올리고 싶어요. 어떻게 하나요?",
    answer:
      "회원가입 후 스튜디오에서 '새 콘텐츠 만들기'를 통해 텍스트를 입력하거나 파일(TXT, MD, DOCX)을 업로드할 수 있습니다. 입력한 텍스트는 자동으로 전자책 형태로 변환되며, AI 오디오북도 생성할 수 있습니다.",
  },
  {
    question: "AI 오디오북의 음성 품질은 어떤가요?",
    answer:
      "OpenAI의 최신 TTS 기술을 활용하여 자연스러운 음성을 제공합니다. 현재 다양한 음성 옵션을 지원하며, 지속적으로 품질을 개선하고 있습니다.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">자주 묻는 질문</h1>
      <p className="mb-8 text-gray-500">
        inspic 이용에 대해 궁금한 점을 확인하세요.
      </p>
      <FaqAccordion items={faqItems} />
    </div>
  );
}
