"use client";

import { useState, useCallback } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function VolumeControl({
  volume,
  onVolumeChange,
  className,
}: VolumeControlProps) {
  const [lastVolume, setLastVolume] = useState(volume > 0 ? volume : 0.8);

  const handleMuteToggle = useCallback(() => {
    if (volume > 0) {
      setLastVolume(volume);
      onVolumeChange(0);
    } else {
      onVolumeChange(lastVolume);
    }
  }, [volume, lastVolume, onVolumeChange]);

  const VolumeIcon =
    volume === 0
      ? VolumeX
      : volume < 0.33
        ? Volume
        : volume < 0.66
          ? Volume1
          : Volume2;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={handleMuteToggle}
        className="text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
        aria-label={volume === 0 ? "Unmute" : "Mute"}
        type="button"
      >
        <VolumeIcon className="h-4 w-4" />
      </button>

      <SliderPrimitive.Root
        className="relative flex items-center select-none touch-none w-20 h-5"
        min={0}
        max={1}
        step={0.01}
        value={[volume]}
        onValueChange={([v]) => onVolumeChange(v)}
        aria-label="Volume"
      >
        <SliderPrimitive.Track className="bg-gray-200 relative grow rounded-full h-1">
          <SliderPrimitive.Range className="absolute bg-gray-900 rounded-full h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full bg-gray-900 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 hover:scale-110 transition-transform" />
      </SliderPrimitive.Root>
    </div>
  );
}
