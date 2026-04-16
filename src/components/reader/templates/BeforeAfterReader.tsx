"use client";

import { useState, useEffect, useRef } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface Props {
  element: Element;
  chapterId: string;
}

interface BeforeAfterState {
  before: string;
  after: string;
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="w-full resize-none overflow-hidden rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      rows={3}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value);
        if (ref.current) {
          ref.current.style.height = "auto";
          ref.current.style.height = ref.current.scrollHeight + "px";
        }
      }}
    />
  );
}

function BeforeAfterReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";
  const defaultBefore = element.attribs["data-before"] || "";
  const defaultAfter = element.attribs["data-after"] || "";

  const [values, setValues] = useState<BeforeAfterState>({
    before: defaultBefore,
    after: defaultAfter,
  });

  useEffect(() => {
    const saved = getTemplateState<BeforeAfterState>(chapterId, nodeId);
    if (saved) setValues(saved);
  }, [chapterId, nodeId]);

  function handleChange(key: keyof BeforeAfterState, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    setTemplateState(chapterId, nodeId, next);
  }

  return (
    <section className="template-before-after my-4 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-bold text-indigo-700 text-sm mb-1">Before</p>
          <AutoResizeTextarea
            value={values.before}
            onChange={(v) => handleChange("before", v)}
            placeholder="현재 상태를 입력하세요..."
          />
        </div>
        <div>
          <p className="font-bold text-indigo-700 text-sm mb-1">After</p>
          <AutoResizeTextarea
            value={values.after}
            onChange={(v) => handleChange("after", v)}
            placeholder="목표 상태를 입력하세요..."
          />
        </div>
      </div>
    </section>
  );
}

registerTemplate("before-after", BeforeAfterReader);
export default BeforeAfterReader;
