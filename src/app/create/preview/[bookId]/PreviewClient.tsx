"use client";

import { PreviewToolbar } from "@/components/preview/PreviewToolbar";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { useState } from "react";

type ViewMode = "detail" | "reader";
type Viewport = "desktop" | "tablet" | "mobile";

interface Props {
  bookId: string;
  bookTitle: string;
}

export function PreviewClient({ bookId, bookTitle }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [viewport, setViewport] = useState<Viewport>("desktop");

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <PreviewToolbar
        bookId={bookId}
        bookTitle={bookTitle}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewport={viewport}
        onViewportChange={setViewport}
      />
      <PreviewFrame bookId={bookId} viewMode={viewMode} viewport={viewport} />
    </div>
  );
}
