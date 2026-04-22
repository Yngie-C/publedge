"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface Props {
  element: Element;
  chapterId: string;
}

function ReflectionReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";
  const prompt = element.attribs["data-prompt"] || "";
  const placeholder =
    element.attribs["data-placeholder"] || "여기에 생각을 적어보세요...";

  const [value, setValue] = useState<string>(() => {
    return getTemplateState<string>(chapterId, nodeId) ?? "";
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  useEffect(() => {
    setTemplateState<string>(chapterId, nodeId, value);
  }, [value, chapterId, nodeId]);

  return (
    <section className="template-reflection my-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      {prompt && (
        <p className="mb-3 text-sm font-bold leading-relaxed text-gray-800 dark:text-gray-100">
          {prompt}
        </p>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        rows={3}
        className="w-full resize-none overflow-hidden rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
      />
    </section>
  );
}

registerTemplate("reflection", ReflectionReader);
export default ReflectionReader;
