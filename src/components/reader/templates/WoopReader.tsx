"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface WoopFields {
  w: string;
  o: string;
  ob: string;
  p: string;
}

interface Props {
  element: Element;
  chapterId: string;
}

const WOOP_CONFIG: {
  key: keyof WoopFields;
  label: string;
  bg: string;
  border: string;
  badge: string;
}[] = [
  {
    key: "w",
    label: "Wish",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-300 dark:border-yellow-700",
    badge: "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
  },
  {
    key: "o",
    label: "Outcome",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-300 dark:border-green-700",
    badge: "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200",
  },
  {
    key: "ob",
    label: "Obstacle",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-300 dark:border-red-700",
    badge: "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200",
  },
  {
    key: "p",
    label: "Plan",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-300 dark:border-blue-700",
    badge: "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
  },
];

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange(e);
        resize();
      }}
      placeholder={placeholder}
      rows={2}
      className={className}
      style={{ overflow: "hidden", resize: "none" }}
    />
  );
}

function WoopReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";

  const parseFields = (): WoopFields => {
    try {
      const raw = element.attribs["data-fields"] || "{}";
      return JSON.parse(raw) as WoopFields;
    } catch {
      return { w: "", o: "", ob: "", p: "" };
    }
  };

  const [fields, setFields] = useState<WoopFields>(() => {
    const saved = getTemplateState<WoopFields>(chapterId, nodeId);
    if (saved) return saved;
    return parseFields();
  });

  useEffect(() => {
    setTemplateState<WoopFields>(chapterId, nodeId, fields);
  }, [fields, chapterId, nodeId]);

  const update = (key: keyof WoopFields) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <section className="template-woop my-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      {WOOP_CONFIG.map(({ key, label, bg, border, badge }) => (
        <div
          key={key}
          className={`rounded-lg border p-3 ${bg} ${border}`}
        >
          <span className={`mb-2 inline-block rounded px-2 py-0.5 text-xs font-bold ${badge}`}>
            {label}
          </span>
          <AutoResizeTextarea
            value={fields[key]}
            onChange={update(key)}
            placeholder={`${label}을(를) 입력하세요...`}
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none dark:text-gray-200 dark:placeholder-gray-500"
          />
        </div>
      ))}
    </section>
  );
}

registerTemplate("woop", WoopReader);
export default WoopReader;
