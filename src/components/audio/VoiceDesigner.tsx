"use client";

import { useState, useRef } from "react";
import { Play, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceDesignerProps {
  onVoiceCreated?: (voice: { id: string; name: string; preview_audio_url: string | null }) => void;
  className?: string;
}

const MAX_INSTRUCTIONS_CHARS = 3200;

export function VoiceDesigner({ onVoiceCreated, className }: VoiceDesignerProps) {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isDesigning, setIsDesigning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleDesign = async () => {
    if (!name.trim() || !instructions.trim()) return;
    setError(null);
    setIsDesigning(true);

    try {
      const res = await fetch("/api/voices/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), instructions: instructions.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "목소리 생성에 실패했습니다.");

      setPreviewUrl(json.data.preview_audio_url);
      onVoiceCreated?.(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목소리 생성에 실패했습니다.");
    } finally {
      setIsDesigning(false);
    }
  };

  const handlePlayPreview = () => {
    if (!previewUrl) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 따뜻한 남성 내레이터"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">목소리 설명</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          maxLength={MAX_INSTRUCTIONS_CHARS}
          placeholder="30대 남성, 차분하고 따뜻한 톤, 책 읽어주는 느낌"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="mt-1 text-xs text-gray-400 text-right">
          {instructions.length}/{MAX_INSTRUCTIONS_CHARS}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {previewUrl && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayPreview}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? "정지" : "미리 듣기"}
          </button>
          <span className="text-xs text-green-600">✓ 목소리 생성 완료</span>
        </div>
      )}

      <Button
        onClick={handleDesign}
        disabled={!name.trim() || !instructions.trim() || isDesigning}
        isLoading={isDesigning}
        variant="outline"
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {isDesigning ? "생성 중..." : previewUrl ? "다시 생성" : "미리 듣기"}
      </Button>
    </div>
  );
}
