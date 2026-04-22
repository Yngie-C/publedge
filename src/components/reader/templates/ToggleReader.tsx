"use client";

import { useState, useEffect } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface Props {
  element: Element;
  chapterId: string;
}

function ToggleReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";
  const summary = element.attribs["data-summary"] || "";
  const content = element.attribs["data-content"] || "";

  const [open, setOpen] = useState<boolean>(() => {
    return getTemplateState<boolean>(chapterId, nodeId) ?? false;
  });

  useEffect(() => {
    setTemplateState<boolean>(chapterId, nodeId, open);
  }, [open, chapterId, nodeId]);

  return (
    <section className="template-toggle my-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span
          className="text-xs text-gray-500 transition-transform duration-200 dark:text-gray-400"
          aria-hidden="true"
          style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{summary}</span>
      </button>
      {open && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{content}</p>
        </div>
      )}
    </section>
  );
}

registerTemplate("toggle", ToggleReader);
export default ToggleReader;
