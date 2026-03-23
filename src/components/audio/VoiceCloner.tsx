"use client";

import { useState, useRef } from "react";
import { Play, Square, Upload, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceClonerProps {
  onVoiceCreated?: (voice: { id: string; name: string; preview_audio_url: string | null }) => void;
  className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FORMATS = ".wav,.mp3,.m4a";

export function VoiceCloner({ onVoiceCreated, className }: VoiceClonerProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [refText, setRefText] = useState("");
  const [consent, setConsent] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      setError("음성 파일은 10MB 이하여야 합니다.");
      return;
    }
    setFile(selected);
    setError(null);
  };

  const handleClone = async () => {
    if (!file || !name.trim() || !refText.trim() || !consent) return;
    setError(null);
    setIsCloning(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/voices/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ref_audio: base64,
          ref_text: refText.trim(),
          consent_confirmed: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "목소리 복제에 실패했습니다.");

      setPreviewUrl(json.data.preview_audio_url);
      onVoiceCreated?.(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목소리 복제에 실패했습니다.");
    } finally {
      setIsCloning(false);
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

  const canClone = name.trim() && file && refText.trim() && consent;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 내 목소리"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* File upload */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">참조 음성 (3~30초)</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
        >
          {file ? (
            <>
              <Mic2 className="h-5 w-5 text-gray-500" />
              <p className="text-sm text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-gray-400" />
              <p className="text-sm text-gray-500">WAV, MP3, M4A (최대 10MB)</p>
              <p className="text-xs text-gray-400">클릭하여 업로드</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">참조 텍스트</label>
        <textarea
          value={refText}
          onChange={(e) => setRefText(e.target.value)}
          placeholder="업로드한 음성에서 말하는 내용을 입력해주세요"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Consent checkbox */}
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
        <span className="text-sm text-gray-600">이 음성의 사용 권한을 확인했습니다</span>
      </label>

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
          <span className="text-xs text-green-600">✓ 복제 완료</span>
        </div>
      )}

      <Button
        onClick={handleClone}
        disabled={!canClone || isCloning}
        isLoading={isCloning}
        variant="outline"
        className="gap-2"
      >
        <Mic2 className="h-4 w-4" />
        {isCloning ? "복제 중..." : previewUrl ? "다시 복제" : "복제하고 미리 듣기"}
      </Button>
    </div>
  );
}
