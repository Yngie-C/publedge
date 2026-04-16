"use client";

import type { Element } from "html-react-parser";

// Registry will be populated as reader template components are created
const TEMPLATE_REGISTRY: Record<
  string,
  React.ComponentType<{ element: Element; chapterId: string }>
> = {};

export function registerTemplate(
  type: string,
  Component: React.ComponentType<{ element: Element; chapterId: string }>
) {
  TEMPLATE_REGISTRY[type] = Component;
}

/**
 * Given a DOM element with data-template-type, return the matching React component
 * or null if no match (caller should render original HTML).
 */
export function getTemplateComponent(
  templateType: string
): React.ComponentType<{ element: Element; chapterId: string }> | null {
  return TEMPLATE_REGISTRY[templateType] ?? null;
}
