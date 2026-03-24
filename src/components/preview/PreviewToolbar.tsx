"use client";

import Link from "next/link";
import { ArrowLeft, Monitor, Tablet, Smartphone, BookOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "detail" | "reader";
type Viewport = "desktop" | "tablet" | "mobile";

interface Props {
  bookId: string;
  bookTitle: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  viewport: Viewport;
  onViewportChange: (vp: Viewport) => void;
}

const viewports: { key: Viewport; icon: typeof Monitor; label: string }[] = [
  { key: "desktop", icon: Monitor, label: "Desktop" },
  { key: "tablet", icon: Tablet, label: "Tablet" },
  { key: "mobile", icon: Smartphone, label: "Mobile" },
];

export function PreviewToolbar({
  bookId,
  bookTitle,
  viewMode,
  onViewModeChange,
  viewport,
  onViewportChange,
}: Props) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shadow-sm">
      {/* Left: back + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/create/edit/${bookId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            편집으로
          </Link>
        </Button>
        <span className="hidden text-sm font-medium text-gray-600 sm:block">
          {bookTitle}
        </span>
      </div>

      {/* Center: view mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        <button
          onClick={() => onViewModeChange("detail")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            viewMode === "detail"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          책 상세
        </button>
        <button
          onClick={() => onViewModeChange("reader")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            viewMode === "reader"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          리더
        </button>
      </div>

      {/* Right: viewport toggle */}
      <div className="flex items-center gap-1">
        {viewports.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onViewportChange(key)}
            title={label}
            className={cn(
              "rounded-lg p-2 transition-colors",
              viewport === key
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
