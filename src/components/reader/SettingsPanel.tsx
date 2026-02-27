"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Slider from "@radix-ui/react-slider";
import { X } from "lucide-react";
import type { ReaderTheme } from "@/types";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fontSize: number;
  lineHeight: number;
  theme: ReaderTheme;
  onFontSizeChange: (value: number) => void;
  onLineHeightChange: (value: number) => void;
  onThemeChange: (theme: ReaderTheme) => void;
}

const THEMES: { value: ReaderTheme; label: string; bg: string; text: string }[] = [
  { value: "light", label: "Light", bg: "bg-white", text: "text-gray-900" },
  { value: "sepia", label: "Sepia", bg: "bg-amber-50", text: "text-amber-950" },
  { value: "dark", label: "Dark", bg: "bg-gray-950", text: "text-gray-100" },
];

export function SettingsPanel({
  open,
  onOpenChange,
  fontSize,
  lineHeight,
  theme,
  onFontSizeChange,
  onLineHeightChange,
  onThemeChange,
}: SettingsPanelProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed right-4 top-16 z-50 w-80 rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 p-5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-4 data-[state=open]:slide-in-from-right-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Reader Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close settings"
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            {/* Font Size */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Font Size
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                  {fontSize}px
                </span>
              </div>
              <Slider.Root
                min={12}
                max={32}
                step={1}
                value={[fontSize]}
                onValueChange={([v]) => onFontSizeChange(v)}
                className="relative flex items-center select-none touch-none w-full h-5"
              >
                <Slider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-1.5">
                  <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors" />
              </Slider.Root>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">12</span>
                <span className="text-xs text-gray-400">32</span>
              </div>
            </div>

            {/* Line Height */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Line Height
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                  {lineHeight.toFixed(1)}
                </span>
              </div>
              <Slider.Root
                min={1.2}
                max={2.0}
                step={0.1}
                value={[lineHeight]}
                onValueChange={([v]) => onLineHeightChange(parseFloat(v.toFixed(1)))}
                className="relative flex items-center select-none touch-none w-full h-5"
              >
                <Slider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-1.5">
                  <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors" />
              </Slider.Root>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">1.2</span>
                <span className="text-xs text-gray-400">2.0</span>
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onThemeChange(t.value)}
                    className={[
                      "flex flex-col items-center justify-center gap-1 py-3 rounded-lg border-2 text-xs font-medium transition-all",
                      t.bg,
                      t.text,
                      theme === t.value
                        ? "border-indigo-500 shadow-sm"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300",
                    ].join(" ")}
                  >
                    <span className="text-base leading-none">A</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
