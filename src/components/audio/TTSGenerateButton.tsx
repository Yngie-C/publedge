"use client";

import { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Mic2,
  Play,
  Square,
  X,
  AlertCircle,
  Upload,
  Sparkles,
  Check,
  Trash2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { CustomVoice } from "@/types";

// ── Preset voices ────────────────────────────────────────────────
const PRESET_VOICES = [
  { id: "Sohee", label: "소희", description: "따뜻하고 감성적인 한국어 여성", lang: "ko" },
  { id: "Chelsie", label: "Chelsie", description: "Friendly and warm English female", lang: "en" },
  { id: "Ethan", label: "Ethan", description: "Calm and steady English male", lang: "en" },
  { id: "Cherry", label: "Cherry", description: "Bright and cheerful female", lang: "en" },
  { id: "Serena", label: "Serena", description: "Elegant and refined female", lang: "en" },
  { id: "Aura", label: "Aura", description: "Soft and soothing female", lang: "en" },
];

// ── Types ────────────────────────────────────────────────────────
type TabId = "preset" | "design" | "clone";

interface TTSGenerateButtonProps {
  bookId: string;
  totalChapters: number;
  totalWords: number;
  onGenerate: (voiceId: string, voiceProvider?: string, customVoiceId?: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────
function formatEstimatedTime(words: number): string {
  const estimatedMinutes = Math.ceil((words * 5) / 1000);
  if (estimatedMinutes < 60) return `~${estimatedMinutes}분`;
  const h = Math.floor(estimatedMinutes / 60);
  const m = estimatedMinutes % 60;
  return m > 0 ? `~${h}시간 ${m}분` : `~${h}시간`;
}

function formatEstimatedCost(words: number): string {
  // Qwen3 pricing: $0.115/10K chars, ~5 chars per word
  const chars = words * 5;
  const cost = (chars / 10_000) * 0.115;
  return `~$${cost.toFixed(2)}`;
}

export function TTSGenerateButton({
  bookId: _bookId,
  totalChapters,
  totalWords,
  onGenerate,
  disabled = false,
  className,
}: TTSGenerateButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("preset");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preset tab state
  const [selectedPresetVoice, setSelectedPresetVoice] = useState("Sohee");
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Design tab state
  const [designName, setDesignName] = useState("");
  const [designInstructions, setDesignInstructions] = useState("");
  const [isDesigning, setIsDesigning] = useState(false);
  const [designedVoice, setDesignedVoice] = useState<CustomVoice | null>(null);

  // Clone tab state
  const [cloneName, setCloneName] = useState("");
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloneRefText, setCloneRefText] = useState("");
  const [cloneConsent, setCloneConsent] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [clonedVoice, setClonedVoice] = useState<CustomVoice | null>(null);

  // Custom voices list
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch custom voices when dialog opens
  useEffect(() => {
    if (!open) return;
    fetchCustomVoices();
  }, [open]);

  const fetchCustomVoices = async () => {
    try {
      const res = await fetch("/api/voices");
      if (res.ok) {
        const { data } = await res.json();
        setCustomVoices(data.custom ?? []);
      }
    } catch {
      // ignore
    }
  };

  // Preview audio playback
  const handlePreview = (audioUrl: string | null, voiceId: string) => {
    if (!audioUrl) return;
    if (previewingVoiceId === voiceId) {
      audioRef.current?.pause();
      setPreviewingVoiceId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPreviewingVoiceId(null);
    audio.play();
    setPreviewingVoiceId(voiceId);
  };

  // Generate audiobook
  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      if (activeTab === "preset") {
        const customVoice = customVoices.find((v) => v.id === selectedPresetVoice);
        if (customVoice) {
          await onGenerate(`custom:${customVoice.id}`, "qwen3", customVoice.id);
        } else {
          await onGenerate(selectedPresetVoice, "qwen3");
        }
      } else if (activeTab === "design" && designedVoice) {
        await onGenerate(`custom:${designedVoice.id}`, "qwen3", designedVoice.id);
      } else if (activeTab === "clone" && clonedVoice) {
        await onGenerate(`custom:${clonedVoice.id}`, "qwen3", clonedVoice.id);
      } else {
        throw new Error("목소리를 먼저 선택하거나 생성해주세요.");
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오디오북 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Design a voice
  const handleDesignVoice = async () => {
    setError(null);
    setIsDesigning(true);
    try {
      const res = await fetch("/api/voices/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: designName, instructions: designInstructions }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "목소리 생성에 실패했습니다.");
      setDesignedVoice(json.data);
      await fetchCustomVoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "목소리 생성에 실패했습니다.");
    } finally {
      setIsDesigning(false);
    }
  };

  // Clone a voice
  const handleCloneVoice = async () => {
    if (!cloneFile || !cloneConsent) return;
    setError(null);
    setIsCloning(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(cloneFile);
      });

      const res = await fetch("/api/voices/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cloneName,
          ref_audio: base64,
          ref_text: cloneRefText,
          consent_confirmed: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "목소리 복제에 실패했습니다.");
      setClonedVoice(json.data);
      await fetchCustomVoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "목소리 복제에 실패했습니다.");
    } finally {
      setIsCloning(false);
    }
  };

  // Soft-delete custom voice (sets is_active = false on server)
  const handleDeleteVoice = async (voiceId: string) => {
    if (!confirm("이 목소리를 삭제하시겠습니까? 이미 생성된 오디오북에는 영향이 없습니다.")) return;
    try {
      const res = await fetch(`/api/voices/${voiceId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "삭제에 실패했습니다.");
      }
      setCustomVoices((prev) => prev.filter((v) => v.id !== voiceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  // Check if generate is possible
  const canGenerate =
    activeTab === "preset" ||
    (activeTab === "design" && designedVoice !== null) ||
    (activeTab === "clone" && clonedVoice !== null);

  // File size formatter
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className={cn("gap-2", className)} disabled={disabled} type="button">
          <Mic2 className="h-4 w-4" />
          오디오북 생성
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              오디오북 생성
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Stats bar */}
          <div className="mb-5 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">챕터 수</span>
              <span className="text-sm font-semibold text-gray-900">{totalChapters}개</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">예상 시간</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatEstimatedTime(totalWords)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">예상 비용</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatEstimatedCost(totalWords)}
              </span>
              <span className="text-[10px] text-gray-400">OpenAI 대비 약 23% 저렴</span>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("preset")}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === "preset"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              목소리 선택
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("design")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === "design"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              목소리 디자인
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("clone")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === "clone"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Mic2 className="h-3.5 w-3.5" />
              목소리 복제
            </button>
          </div>

          {/* ── Preset Tab ── */}
          {activeTab === "preset" && (
            <div className="space-y-2 mb-5">
              {PRESET_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => setSelectedPresetVoice(voice.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left",
                    selectedPresetVoice === voice.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{voice.label}</span>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        {voice.lang}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{voice.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled
                      title="미리 듣기 준비 중"
                      className="p-1.5 rounded-md text-gray-300 cursor-not-allowed"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    {selectedPresetVoice === voice.id && (
                      <Check className="h-4 w-4 text-gray-900" />
                    )}
                  </div>
                </button>
              ))}

              {/* Custom voices section */}
              {customVoices.length > 0 && (
                <>
                  <p className="text-xs font-medium text-gray-500 pt-3 pb-1">커스텀 목소리</p>
                  {customVoices.map((voice) => (
                    <button
                      key={voice.id}
                      type="button"
                      onClick={() => setSelectedPresetVoice(voice.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left",
                        selectedPresetVoice === voice.id
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{voice.name}</span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              voice.type === "designed"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {voice.type === "designed" ? "디자인" : "복제"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {voice.preview_audio_url && (
                          <button
                            type="button"
                            title="미리 듣기"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(voice.preview_audio_url, voice.id);
                            }}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            {previewingVoiceId === voice.id ? (
                              <Square className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          title="삭제"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVoice(voice.id);
                          }}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {selectedPresetVoice === voice.id && (
                          <Check className="h-4 w-4 text-gray-900 ml-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── Design Tab ── */}
          {activeTab === "design" && (
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
                <input
                  type="text"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                  placeholder="나만의 목소리 이름"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  목소리 설명
                </label>
                <textarea
                  value={designInstructions}
                  onChange={(e) => setDesignInstructions(e.target.value)}
                  maxLength={3200}
                  rows={4}
                  placeholder="30대 남성, 차분하고 따뜻한 톤, 책 읽어주는 느낌"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {designInstructions.length}/3200
                </p>
              </div>

              {designedVoice ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">{designedVoice.name}</p>
                    <p className="text-xs text-green-600">목소리 생성 완료</p>
                  </div>
                  {designedVoice.preview_audio_url && (
                    <button
                      type="button"
                      onClick={() =>
                        handlePreview(designedVoice.preview_audio_url, designedVoice.id)
                      }
                      className="p-1.5 rounded-md text-green-700 hover:bg-green-100 transition-colors"
                    >
                      {previewingVoiceId === designedVoice.id ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDesignVoice}
                  disabled={isDesigning || !designName.trim() || !designInstructions.trim()}
                  className="w-full gap-2"
                >
                  {isDesigning ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      미리 듣기
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* ── Clone Tab ── */}
          {activeTab === "clone" && (
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="복제할 목소리 이름"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                />
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  음성 파일
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/wav,audio/mpeg,audio/mp4,audio/x-m4a"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 10 * 1024 * 1024) {
                      setCloneFile(file);
                    } else if (file) {
                      setError("파일 크기는 10MB 이하여야 합니다.");
                    }
                  }}
                />
                {cloneFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <Volume2 className="h-4 w-4 text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{cloneFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(cloneFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCloneFile(null)}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-6 w-full border-2 border-dashed rounded-lg border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    <Upload className="h-5 w-5 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm text-gray-600">클릭하여 파일 업로드</p>
                      <p className="text-xs text-gray-400 mt-0.5">WAV, MP3, M4A · 최대 10MB</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Reference text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  참조 텍스트
                </label>
                <textarea
                  value={cloneRefText}
                  onChange={(e) => setCloneRefText(e.target.value)}
                  rows={3}
                  placeholder="업로드한 음성의 대본을 입력해주세요"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 resize-none"
                />
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cloneConsent}
                  onChange={(e) => setCloneConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  이 음성의 사용 권한을 확인했습니다
                </span>
              </label>

              {clonedVoice ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">{clonedVoice.name}</p>
                    <p className="text-xs text-green-600">목소리 복제 완료</p>
                  </div>
                  {clonedVoice.preview_audio_url && (
                    <button
                      type="button"
                      onClick={() =>
                        handlePreview(clonedVoice.preview_audio_url, clonedVoice.id)
                      }
                      className="p-1.5 rounded-md text-green-700 hover:bg-green-100 transition-colors"
                    >
                      {previewingVoiceId === clonedVoice.id ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloneVoice}
                  disabled={isCloning || !cloneFile || !cloneRefText.trim() || !cloneConsent}
                  className="w-full gap-2"
                >
                  {isCloning ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      복제 중...
                    </>
                  ) : (
                    <>
                      <Mic2 className="h-4 w-4" />
                      복제하고 미리 듣기
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Notice */}
          <p className="mb-5 text-xs text-gray-400">
            생성은 백그라운드에서 진행됩니다. 예상 비용은 Qwen3-TTS 기준입니다.
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <Button variant="outline" className="flex-1" disabled={isGenerating}>
                취소
              </Button>
            </Dialog.Close>
            <Button
              className="flex-1 gap-2"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              isLoading={isGenerating}
            >
              {isGenerating ? (
                "생성 중..."
              ) : (
                <>
                  <Mic2 className="h-4 w-4" />
                  오디오북 생성
                </>
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </Dialog.Root>
  );
}
