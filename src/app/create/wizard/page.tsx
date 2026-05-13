"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { StepIndicator } from "@/components/wizard/StepIndicator";
import { Step1BookInfo } from "@/components/wizard/Step1BookInfo";
import {
  Step2CreationMethod,
  type CreationMethod,
} from "@/components/wizard/Step2CreationMethod";
import { Step3CoverImage } from "@/components/wizard/Step3CoverImage";
import { Step4Complete } from "@/components/wizard/Step4Complete";
import { markWizardCompleted } from "@/lib/wizard-utils";

const STEP_LABELS = ["기본 정보", "작성 방식", "커버 이미지", "준비 완료"];
const TOTAL_STEPS = 4;

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [bookInfo, setBookInfo] = useState({
    title: "",
    description: "",
    language: "ko",
    price: 0,
  });

  // Step 2 state
  const [creationMethod, setCreationMethod] = useState<CreationMethod | null>(
    null
  );

  // Step 3 state (only for "upload" path)
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverSkipped, setCoverSkipped] = useState(false);

  // Only used for "upload" path
  const [bookId, setBookId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const canProceedFromStep1 = bookInfo.title.trim().length > 0;
  const canProceedFromStep3 = coverUrl !== null || coverSkipped;

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step]);

  /** "직접 작성" path: create book → redirect to editor with wizard banner */
  const handleDirectWrite = async () => {
    setIsCreating(true);
    setError("");

    try {
      const bookRes = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookInfo.title.trim(),
          description: bookInfo.description.trim() || null,
          language: bookInfo.language,
          source_type: "text",
          price: bookInfo.price,
        }),
      });

      if (!bookRes.ok) {
        const json = await bookRes.json();
        throw new Error(json.error ?? "콘텐츠 생성에 실패했습니다.");
      }

      const bookJson = await bookRes.json();
      const newBookId = bookJson.data.id;

      // Create empty chapter
      for (let attempt = 0; attempt < 2; attempt++) {
        const chapterRes = await fetch("/api/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            book_id: newBookId,
            title: "챕터 1",
            content_html: "",
            content_raw: "",
            order_index: 0,
          }),
        });
        if (chapterRes.ok) break;
      }

      // Mark wizard completed and redirect to editor
      // The editor page will show an extended wizard banner
      markWizardCompleted();
      router.push(`/create/edit/${newBookId}?wizard=1`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "오류가 발생했습니다."
      );
      setIsCreating(false);
    }
  };

  /** "파일 업로드" path: create book → continue wizard (cover → complete → upload) */
  const handleUploadCreate = async () => {
    setIsCreating(true);
    setError("");

    try {
      const bookRes = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookInfo.title.trim(),
          description: bookInfo.description.trim() || null,
          language: bookInfo.language,
          source_type: "text",
          price: bookInfo.price,
        }),
      });

      if (!bookRes.ok) {
        const json = await bookRes.json();
        throw new Error(json.error ?? "콘텐츠 생성에 실패했습니다.");
      }

      const bookJson = await bookRes.json();
      const newBookId = bookJson.data.id;
      setBookId(newBookId);

      // Move to Step 3 (cover)
      setStep(3);
      setIsCreating(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "오류가 발생했습니다."
      );
      setIsCreating(false);
    }
  };

  const goToUploadPage = () => {
    if (bookId) {
      const params = new URLSearchParams({
        title: bookInfo.title,
        description: bookInfo.description,
        language: bookInfo.language,
        price: String(bookInfo.price),
      });
      markWizardCompleted();
      router.push(`/create/upload?${params.toString()}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            labels={STEP_LABELS}
          />
        </div>

        {/* Step Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 && "책 정보를 알려주세요"}
            {step === 2 && "어떻게 책을 만들까요?"}
            {step === 3 && "커버 이미지를 설정해주세요"}
            {step === 4 && "책 만들 준비가 끝났어요!"}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {step === 1 &&
              "입력하신 정보는 나중에 언제든지 수정할 수 있어요."}
            {step === 2 &&
              "직접 작성하면 에디터에서 계속 가이드를 받으며 책을 만들어요."}
            {step === 3 &&
              "표지를 업로드하거나, 나중에 설정할 수 있어요."}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {step === 1 && (
            <Step1BookInfo data={bookInfo} onChange={setBookInfo} />
          )}
          {step === 2 && (
            <Step2CreationMethod
              value={creationMethod}
              onChange={setCreationMethod}
            />
          )}
          {step === 3 && (
            <Step3CoverImage
              bookId={bookId}
              onSkip={() => {
                setCoverSkipped(true);
                setCoverUrl(null);
              }}
              onComplete={(url) => setCoverUrl(url)}
            />
          )}
          {step === 4 && bookId && (
            <Step4Complete
              method="upload"
              bookTitle={bookInfo.title}
              bookId={bookId}
              onGoToEditor={() => {}}
              onGoToUpload={goToUploadPage}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {step < TOTAL_STEPS && (
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={step === 1}
            >
              이전
            </Button>

            <Button
              onClick={() => {
                if (step === 2) {
                  if (creationMethod === "write") {
                    handleDirectWrite();
                  } else if (creationMethod === "upload") {
                    handleUploadCreate();
                  }
                } else if (step === 3) {
                  setStep(4);
                } else {
                  goNext();
                }
              }}
              disabled={
                isCreating ||
                (step === 1 && !canProceedFromStep1) ||
                (step === 2 && creationMethod === null) ||
                (step === 3 && !canProceedFromStep3)
              }
              isLoading={isCreating}
            >
              {step === 3 ? "완료" : "다음"}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
