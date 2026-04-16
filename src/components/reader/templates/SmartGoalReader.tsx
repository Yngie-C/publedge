"use client";

import { useState, useEffect, useRef } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface Props {
  element: Element;
  chapterId: string;
}

interface SmartFields {
  s: string;
  m: string;
  a: string;
  r: string;
  t: string;
}

const LABELS: { key: keyof SmartFields; label: string; description: string }[] = [
  { key: "s", label: "S", description: "Specific — 구체적으로 무엇을 달성할 것인가?" },
  { key: "m", label: "M", description: "Measurable — 어떻게 측정할 것인가?" },
  { key: "a", label: "A", description: "Achievable — 달성 가능한가?" },
  { key: "r", label: "R", description: "Relevant — 목표와 관련이 있는가?" },
  { key: "t", label: "T", description: "Time-bound — 언제까지 달성할 것인가?" },
];

function SmartGoalReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";
  let defaultFields: SmartFields = { s: "", m: "", a: "", r: "", t: "" };
  try {
    const parsed = JSON.parse(element.attribs["data-fields"] || "{}");
    defaultFields = { ...defaultFields, ...parsed };
  } catch {
    // keep defaults
  }

  const [values, setValues] = useState<SmartFields>(defaultFields);

  useEffect(() => {
    const saved = getTemplateState<SmartFields>(chapterId, nodeId);
    if (saved) setValues(saved);
  }, [chapterId, nodeId]);

  function handleChange(key: keyof SmartFields, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    setTemplateState(chapterId, nodeId, next);
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  return (
    <section className="template-smart-goal my-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
      <h3 className="text-sm font-bold text-blue-800 mb-3">SMART 목표 설정</h3>
      <div className="flex flex-col gap-3">
        {LABELS.map(({ key, label, description }) => (
          <div key={key}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-bold text-blue-700 text-base">{label}</span>
              <span className="text-xs text-gray-500">{description}</span>
            </div>
            <AutoResizeTextarea
              value={values[key]}
              onChange={(v) => handleChange(key, v)}
              placeholder={`${label} 항목을 입력하세요...`}
            />
          </div>
        ))}
      </div>
    </section>
  );
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
      className="w-full resize-none overflow-hidden rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
      rows={2}
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

registerTemplate("smart-goal", SmartGoalReader);
export default SmartGoalReader;
