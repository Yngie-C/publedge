"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  FileText,
  CheckSquare,
  Languages,
  ImagePlus,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type AIAction = "summarize" | "proofread" | "translate" | "cover";

type SupportedLanguage = "ko" | "en" | "ja" | "zh";

const LANGUAGE_OPTIONS: { value: SupportedLanguage; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
];

const COVER_STYLES = [
  { value: "modern", label: "모던" },
  { value: "classic", label: "클래식" },
  { value: "minimalist", label: "미니멀" },
  { value: "illustration", label: "일러스트" },
] as const;

type CoverStyle = (typeof COVER_STYLES)[number]["value"];

interface Correction {
  original: string;
  suggested: string;
  reason: string;
}

interface AIAssistantPanelProps {
  /** Current editor content (plain text or HTML) */
  content: string;
  /** Book title — used for cover generation */
  bookTitle?: string;
  /** Book description — used for cover generation */
  bookDescription?: string;
  /** Book ID — used for cover generation upload */
  bookId?: string;
  /** Called with improved text when user clicks "적용" */
  onApply?: (text: string) => void;
  /** Called with new cover URL */
  onCoverGenerated?: (coverUrl: string) => void;
  className?: string;
}

export function AIAssistantPanel({
  content,
  bookTitle = "",
  bookDescription = "",
  bookId,
  onApply,
  onCoverGenerated,
  className,
}: AIAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Summarize state
  const [summary, setSummary] = useState<string | null>(null);

  // Proofread state
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [improvedText, setImprovedText] = useState<string | null>(null);

  // Translate state
  const [sourceLang, setSourceLang] = useState<SupportedLanguage>("ko");
  const [targetLang, setTargetLang] = useState<SupportedLanguage>("en");
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  // Cover state
  const [coverStyle, setCoverStyle] = useState<CoverStyle>("modern");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const resetResults = () => {
    setSummary(null);
    setCorrections([]);
    setImprovedText(null);
    setTranslatedText(null);
    setCoverUrl(null);
    setError(null);
  };

  const handleAction = async (action: AIAction) => {
    setActiveAction(action);
    resetResults();
    setIsLoading(true);
    setError(null);

    try {
      if (action === "summarize") {
        const res = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: content }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "요약에 실패했습니다.");
        }
        const json = await res.json();
        setSummary(json.data?.summary ?? "");
      } else if (action === "proofread") {
        const res = await fetch("/api/ai/proofread", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: content }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "교정에 실패했습니다.");
        }
        const json = await res.json();
        setCorrections(json.data?.corrections ?? []);
        setImprovedText(json.data?.improved_text ?? null);
      } else if (action === "translate") {
        const res = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: content,
            source_language: sourceLang,
            target_language: targetLang,
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "번역에 실패했습니다.");
        }
        const json = await res.json();
        setTranslatedText(json.data?.translated_text ?? null);
      } else if (action === "cover") {
        const res = await fetch("/api/ai/cover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: bookTitle,
            description: bookDescription,
            style: coverStyle,
            book_id: bookId,
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "표지 생성에 실패했습니다.");
        }
        const json = await res.json();
        const url = json.data?.cover_url ?? null;
        setCoverUrl(url);
        if (url) onCoverGenerated?.(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = (text: string) => {
    onApply?.(text);
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l border-gray-200 bg-white transition-all duration-200",
        isOpen ? "w-72 min-w-[18rem]" : "w-10 min-w-[2.5rem]",
        className,
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-12 w-full flex-shrink-0 items-center border-b border-gray-200 px-3 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
      >
        {isOpen ? (
          <>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="ml-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI 어시스턴트
            </span>
          </>
        ) : (
          <ChevronLeft className="h-4 w-4 flex-shrink-0 mx-auto" />
        )}
      </button>

      {isOpen && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Action buttons */}
          <div className="flex-shrink-0 space-y-1 p-3 border-b border-gray-100">
            <ActionButton
              icon={<FileText className="h-4 w-4" />}
              label="요약"
              active={activeAction === "summarize"}
              loading={isLoading && activeAction === "summarize"}
              onClick={() => handleAction("summarize")}
            />
            <ActionButton
              icon={<CheckSquare className="h-4 w-4" />}
              label="교정"
              active={activeAction === "proofread"}
              loading={isLoading && activeAction === "proofread"}
              onClick={() => handleAction("proofread")}
            />
            {/* Translate with lang selectors */}
            <div className="space-y-1.5">
              <ActionButton
                icon={<Languages className="h-4 w-4" />}
                label="번역"
                active={activeAction === "translate"}
                loading={isLoading && activeAction === "translate"}
                onClick={() => handleAction("translate")}
              />
              {(activeAction === "translate" || true) && (
                <div className="flex items-center gap-1.5 pl-1">
                  <select
                    value={sourceLang}
                    onChange={(e) =>
                      setSourceLang(e.target.value as SupportedLanguage)
                    }
                    className="flex-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs text-gray-700 focus:border-gray-900 focus:outline-none"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400">→</span>
                  <select
                    value={targetLang}
                    onChange={(e) =>
                      setTargetLang(e.target.value as SupportedLanguage)
                    }
                    className="flex-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-1 text-xs text-gray-700 focus:border-gray-900 focus:outline-none"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {/* Cover generation */}
            <div className="space-y-1.5">
              <ActionButton
                icon={<ImagePlus className="h-4 w-4" />}
                label="표지 생성"
                active={activeAction === "cover"}
                loading={isLoading && activeAction === "cover"}
                onClick={() => handleAction("cover")}
              />
              <div className="flex flex-wrap gap-1 pl-1">
                {COVER_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setCoverStyle(s.value)}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                      coverStyle === s.value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            )}

            {/* Summary result */}
            {!isLoading && summary && (
              <ResultBlock
                title="요약 결과"
                text={summary}
                onCopy={() => handleCopy(summary)}
                onApply={() => handleApply(summary)}
                copied={copied}
              />
            )}

            {/* Proofread result */}
            {!isLoading && (corrections.length > 0 || improvedText) && (
              <div className="space-y-3">
                {corrections.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-700">
                      교정 사항 ({corrections.length}개)
                    </p>
                    <div className="space-y-2">
                      {corrections.map((c, i) => (
                        <div
                          key={i}
                          className="rounded border border-gray-200 bg-white p-2 text-xs"
                        >
                          <p className="text-red-600 line-through">
                            {c.original}
                          </p>
                          <p className="text-green-700 font-medium">
                            {c.suggested}
                          </p>
                          <p className="mt-0.5 text-gray-400">{c.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {improvedText && (
                  <ResultBlock
                    title="교정된 텍스트"
                    text={improvedText}
                    onCopy={() => handleCopy(improvedText)}
                    onApply={() => handleApply(improvedText)}
                    copied={copied}
                  />
                )}
              </div>
            )}

            {/* Translate result */}
            {!isLoading && translatedText && (
              <ResultBlock
                title="번역 결과"
                text={translatedText}
                onCopy={() => handleCopy(translatedText)}
                onApply={() => handleApply(translatedText)}
                copied={copied}
              />
            )}

            {/* Cover result */}
            {!isLoading && coverUrl && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  생성된 표지
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt="생성된 표지"
                  className="w-full rounded-lg border border-gray-200 shadow-sm"
                />
                <p className="text-xs text-green-600 text-center">
                  표지가 업데이트되었습니다
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  loading?: boolean;
  onClick: () => void;
}

function ActionButton({
  icon,
  label,
  active,
  loading,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-purple-50 text-purple-700"
          : "text-gray-700 hover:bg-gray-100",
        "disabled:pointer-events-none disabled:opacity-60",
      )}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {label}
    </button>
  );
}

interface ResultBlockProps {
  title: string;
  text: string;
  onCopy: () => void;
  onApply: () => void;
  copied: boolean;
}

function ResultBlock({
  title,
  text,
  onCopy,
  onApply,
  copied,
}: ResultBlockProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <p className="text-xs font-semibold text-gray-700">{title}</p>
        <button
          onClick={onCopy}
          className="text-gray-400 transition-colors hover:text-gray-700"
          title="복사"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap">
          {text}
        </p>
      </div>
      <div className="border-t border-gray-200 px-3 py-2">
        <Button size="sm" variant="secondary" onClick={onApply} className="w-full text-xs h-7">
          적용
        </Button>
      </div>
    </div>
  );
}
