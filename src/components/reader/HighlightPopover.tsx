"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

interface HighlightColor {
  key: string;
  label: string;
  bg: string;
  ring: string;
}

const COLORS: HighlightColor[] = [
  { key: "yellow", label: "Yellow", bg: "bg-yellow-300", ring: "ring-yellow-400" },
  { key: "green", label: "Green", bg: "bg-green-300", ring: "ring-green-400" },
  { key: "blue", label: "Blue", bg: "bg-blue-300", ring: "ring-blue-400" },
  { key: "pink", label: "Pink", bg: "bg-pink-300", ring: "ring-pink-400" },
];

interface HighlightPopoverProps {
  /** Viewport position where the popover should appear */
  position: { x: number; y: number } | null;
  onSave: (color: string, note: string) => void;
  onCancel: () => void;
}

export function HighlightPopover({
  position,
  onSave,
  onCancel,
}: HighlightPopoverProps) {
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Reset state when popover appears
  useEffect(() => {
    if (position) {
      setSelectedColor("yellow");
      setNote("");
      setShowNote(false);
    }
  }, [position]);

  // Dismiss on outside click
  useEffect(() => {
    if (!position) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [position, onCancel]);

  if (!position) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: position.x,
    top: position.y - 8,
    transform: "translate(-50%, -100%)",
    zIndex: 60,
  };

  return (
    <div
      ref={ref}
      style={style}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[220px]"
    >
      {/* Color picker row */}
      <div className="flex items-center gap-2 mb-2">
        {COLORS.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelectedColor(c.key)}
            aria-label={c.label}
            className={[
              "w-7 h-7 rounded-full transition-all",
              c.bg,
              selectedColor === c.key
                ? `ring-2 ring-offset-1 ${c.ring}`
                : "hover:scale-110",
            ].join(" ")}
          />
        ))}

        <div className="flex-1" />

        {/* Toggle note */}
        <button
          onClick={() => setShowNote((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
        >
          {showNote ? "Hide note" : "Add note"}
        </button>
      </div>

      {/* Note input */}
      {showNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="w-full text-xs p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400 mb-2"
        />
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
        <button
          onClick={() => onSave(selectedColor, note)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
        >
          <Check className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
}
