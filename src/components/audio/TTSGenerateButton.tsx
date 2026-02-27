"use client";

import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import {
  Mic2,
  ChevronDown,
  Check,
  Play,
  Square,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const OPENAI_VOICES = [
  { id: "alloy", label: "Alloy", description: "Neutral & balanced" },
  { id: "echo", label: "Echo", description: "Warm & resonant" },
  { id: "fable", label: "Fable", description: "Expressive & animated" },
  { id: "onyx", label: "Onyx", description: "Deep & authoritative" },
  { id: "nova", label: "Nova", description: "Energetic & bright" },
  { id: "shimmer", label: "Shimmer", description: "Clear & gentle" },
] as const;

type VoiceId = (typeof OPENAI_VOICES)[number]["id"];

interface TTSGenerateButtonProps {
  bookId: string;
  totalChapters: number;
  totalWords: number;
  onGenerate: (voiceId: VoiceId) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

function formatEstimatedTime(words: number): string {
  // ~150 wpm reading speed, TTS roughly 1min per 1000 chars, ~5 chars per word
  const estimatedMinutes = Math.ceil((words * 5) / 1000);
  if (estimatedMinutes < 60) return `~${estimatedMinutes} min`;
  const h = Math.floor(estimatedMinutes / 60);
  const m = estimatedMinutes % 60;
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`;
}

function formatEstimatedCost(words: number): string {
  // OpenAI TTS pricing: ~$15 per 1M characters, ~5 chars per word
  const chars = words * 5;
  const cost = (chars / 1_000_000) * 15;
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
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>("alloy");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = () => {
    if (isPreviewPlaying) {
      audioRef.current?.pause();
      setIsPreviewPlaying(false);
      return;
    }
    // In a real implementation this would call a preview API endpoint
    // For now we show a visual indicator only
    setIsPreviewPlaying(true);
    setTimeout(() => setIsPreviewPlaying(false), 3000);
  };

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      await onGenerate(selectedVoice);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start TTS generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          className={cn("gap-2", className)}
          disabled={disabled}
          type="button"
        >
          <Mic2 className="h-4 w-4" />
          Generate Audiobook
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl focus:outline-none">
          <div className="flex items-start justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Generate Audiobook
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Chapters</span>
              <span className="text-sm font-semibold text-gray-900">
                {totalChapters}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Est. time</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatEstimatedTime(totalWords)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Est. cost</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatEstimatedCost(totalWords)}
              </span>
            </div>
          </div>

          {/* Voice selector */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Voice
            </label>
            <Select.Root
              value={selectedVoice}
              onValueChange={(v) => setSelectedVoice(v as VoiceId)}
            >
              <Select.Trigger className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content className="z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  <Select.Viewport className="p-1">
                    {OPENAI_VOICES.map((voice) => (
                      <Select.Item
                        key={voice.id}
                        value={voice.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none data-[state=checked]:font-medium"
                      >
                        <Select.ItemIndicator>
                          <Check className="h-3.5 w-3.5 text-gray-900" />
                        </Select.ItemIndicator>
                        <div className="flex flex-col">
                          <Select.ItemText>{voice.label}</Select.ItemText>
                          <span className="text-xs text-gray-400">
                            {voice.description}
                          </span>
                        </div>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Preview button */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
            >
              {isPreviewPlaying ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  Stop preview
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Preview voice
                </>
              )}
            </button>
            {isPreviewPlaying && (
              <p className="mt-1 text-xs text-gray-400">
                Playing sample for &ldquo;
                {OPENAI_VOICES.find((v) => v.id === selectedVoice)?.label}&rdquo;…
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Notice */}
          <p className="mb-5 text-xs text-gray-400">
            Generation runs in the background. You can close this page and come back
            later. Costs are estimates based on OpenAI TTS pricing.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <Button variant="outline" className="flex-1" disabled={isGenerating}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              className="flex-1"
              onClick={handleGenerate}
              disabled={isGenerating}
              isLoading={isGenerating}
            >
              {isGenerating ? "Starting…" : "Start Generation"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
