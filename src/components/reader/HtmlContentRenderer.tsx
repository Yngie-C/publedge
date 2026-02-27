"use client";

import { sanitizeForRender } from "@/lib/sanitize";
import type { ReaderTheme } from "@/types";
import { useMemo } from "react";

interface HtmlContentRendererProps {
  html: string;
  theme: ReaderTheme;
  fontSize: number;
  lineHeight: number;
  className?: string;
}

const themeClasses: Record<ReaderTheme, string> = {
  light: "bg-white text-gray-900",
  dark: "bg-gray-950 text-gray-100",
  sepia: "bg-amber-50 text-amber-950",
};

export function HtmlContentRenderer({
  html,
  theme,
  fontSize,
  lineHeight,
  className = "",
}: HtmlContentRendererProps) {
  const sanitized = useMemo(() => sanitizeForRender(html), [html]);

  return (
    <div
      className={[
        "reader-content w-full h-full",
        themeClasses[theme],
        className,
      ].join(" ")}
      style={{ fontSize: `${fontSize}px`, lineHeight }}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
