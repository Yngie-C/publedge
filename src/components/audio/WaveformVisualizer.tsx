"use client";

import { cn } from "@/lib/utils";

interface WaveformVisualizerProps {
  isPlaying: boolean;
  className?: string;
  barCount?: number;
}

export function WaveformVisualizer({
  isPlaying,
  className,
  barCount = 5,
}: WaveformVisualizerProps) {
  return (
    <div
      className={cn("flex items-end gap-0.5 h-4", className)}
      aria-hidden="true"
    >
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-0.5 rounded-full bg-current",
            isPlaying ? "animate-equalizer" : "h-1"
          )}
          style={
            isPlaying
              ? {
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.6 + (i % 3) * 0.15}s`,
                }
              : undefined
          }
        />
      ))}
      <style jsx>{`
        @keyframes equalizer {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 16px;
          }
        }
        .animate-equalizer {
          animation: equalizer ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
