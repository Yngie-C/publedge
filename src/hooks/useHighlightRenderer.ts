"use client";

import type { Highlight } from "@/types";
import { useCallback } from "react";

const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: "rgba(253, 224, 71, 0.5)",
  green: "rgba(134, 239, 172, 0.5)",
  blue: "rgba(147, 197, 253, 0.5)",
  pink: "rgba(249, 168, 212, 0.5)",
};

/**
 * Renders highlight marks into a container element by finding text ranges.
 * Uses a simple text-search approach with TreeWalker to locate text nodes,
 * then wraps matching ranges with <mark> elements.
 */
export function useHighlightRenderer() {
  /**
   * Apply all highlights for the current chapter to the given container.
   * Clears previous marks before reapplying.
   */
  const applyHighlights = useCallback(
    (container: HTMLElement, highlights: Highlight[], chapterId: string) => {
      // Remove existing highlight marks
      const existing = container.querySelectorAll("mark[data-highlight-id]");
      existing.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      });

      // Normalize text nodes after cleanup
      container.normalize();

      const chapterHighlights = highlights.filter(
        (h) => h.chapter_id === chapterId
      );

      for (const highlight of chapterHighlights) {
        try {
          wrapTextInContainer(container, highlight);
        } catch {
          // Silently skip highlights that can't be applied (e.g. content changed)
        }
      }
    },
    []
  );

  /**
   * Capture the current window selection as highlight input data.
   * Returns null if no valid selection exists.
   */
  const captureSelection = useCallback((): {
    selected_text: string;
    prefix_context: string;
    suffix_context: string;
    range: Range;
  } | null => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const selected_text = selection.toString().trim();
    if (!selected_text) return null;

    // Grab up to 100 chars of context before and after
    const fullText =
      range.startContainer.textContent ?? "";
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    const prefix_context = fullText.slice(
      Math.max(0, startOffset - 100),
      startOffset
    );
    const suffix_context = fullText.slice(
      endOffset,
      Math.min(fullText.length, endOffset + 100)
    );

    return { selected_text, prefix_context, suffix_context, range };
  }, []);

  return { applyHighlights, captureSelection };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function wrapTextInContainer(container: HTMLElement, highlight: Highlight) {
  const { selected_text, color } = highlight;
  if (!selected_text) return;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  // Find the first text node sequence that contains the target text
  const fullText = textNodes.map((n) => n.textContent ?? "").join("");
  const idx = fullText.indexOf(selected_text);
  if (idx === -1) return;

  // Map character offsets to (nodeIndex, offsetInNode)
  let charCount = 0;
  let startNodeIdx = -1;
  let startOffset = 0;
  let endNodeIdx = -1;
  let endOffset = 0;

  for (let i = 0; i < textNodes.length; i++) {
    const len = textNodes[i].textContent?.length ?? 0;
    if (startNodeIdx === -1 && charCount + len > idx) {
      startNodeIdx = i;
      startOffset = idx - charCount;
    }
    if (
      endNodeIdx === -1 &&
      charCount + len >= idx + selected_text.length
    ) {
      endNodeIdx = i;
      endOffset = idx + selected_text.length - charCount;
      break;
    }
    charCount += len;
  }

  if (startNodeIdx === -1 || endNodeIdx === -1) return;

  const range = document.createRange();
  range.setStart(textNodes[startNodeIdx], startOffset);
  range.setEnd(textNodes[endNodeIdx], endOffset);

  const mark = document.createElement("mark");
  mark.dataset.highlightId = highlight.id;
  mark.style.backgroundColor =
    HIGHLIGHT_COLOR_MAP[color] ?? HIGHLIGHT_COLOR_MAP.yellow;
  mark.style.borderRadius = "2px";
  mark.style.padding = "0";

  try {
    range.surroundContents(mark);
  } catch {
    // If surroundContents fails (cross-node selection), extract and wrap
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
  }
}
