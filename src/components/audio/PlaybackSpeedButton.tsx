"use client";

import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface PlaybackSpeedButtonProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  className?: string;
}

export function PlaybackSpeedButton({
  speed,
  onSpeedChange,
  className,
}: PlaybackSpeedButtonProps) {
  const label = speed === 1 ? "1x" : `${speed}x`;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "min-w-[40px] rounded px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900",
            className
          )}
          aria-label={`Playback speed: ${label}`}
          type="button"
        >
          {label}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
          sideOffset={6}
          align="center"
        >
          <div className="flex flex-col gap-0.5">
            {SPEEDS.map((s) => (
              <Popover.Close asChild key={s}>
                <button
                  onClick={() => onSpeedChange(s)}
                  className={cn(
                    "rounded px-4 py-1.5 text-sm font-medium text-left transition-colors hover:bg-gray-100",
                    s === speed
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "text-gray-700"
                  )}
                  type="button"
                >
                  {s === 1 ? "1x (Normal)" : `${s}x`}
                </button>
              </Popover.Close>
            ))}
          </div>
          <Popover.Arrow className="fill-gray-200" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
