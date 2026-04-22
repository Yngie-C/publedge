"use client";

import { useState, useEffect, useRef } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface QuadrantItem {
  text: string;
}

interface QuadrantState {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

interface Props {
  element: Element;
  chapterId: string;
}

function QuadrantReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";
  const labelX = element.attribs["data-label-x"] || "X축";
  const labelY = element.attribs["data-label-y"] || "Y축";

  const parseItems = (): QuadrantItem[] => {
    try {
      const raw = element.attribs["data-items"] || "[]";
      return JSON.parse(raw) as QuadrantItem[];
    } catch {
      return [{text:""},{text:""},{text:""},{text:""}];
    }
  };

  const [state, setState] = useState<QuadrantState>(() => {
    const saved = getTemplateState<QuadrantState>(chapterId, nodeId);
    if (saved) return saved;
    const items = parseItems();
    return {
      q1: items[0]?.text ?? "",
      q2: items[1]?.text ?? "",
      q3: items[2]?.text ?? "",
      q4: items[3]?.text ?? "",
    };
  });

  useEffect(() => {
    setTemplateState<QuadrantState>(chapterId, nodeId, state);
  }, [state, chapterId, nodeId]);

  const update = (key: keyof QuadrantState) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const quadrants: { key: keyof QuadrantState; label: string }[] = [
    { key: "q1", label: "Q1" },
    { key: "q2", label: "Q2" },
    { key: "q3", label: "Q3" },
    { key: "q4", label: "Q4" },
  ];

  return (
    <section className="template-quadrant my-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Y axis label */}
      <div className="mb-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
        ▲ {labelY}
      </div>
      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-0 border border-gray-300 dark:border-gray-600">
        {quadrants.map(({ key, label }, idx) => (
          <div
            key={key}
            className={`relative border-gray-300 p-2 dark:border-gray-600 ${
              idx === 0 ? "border-b border-r" :
              idx === 1 ? "border-b border-l" :
              idx === 2 ? "border-t border-r" :
              "border-t border-l"
            }`}
          >
            <span className="mb-1 block text-xs font-medium text-gray-400 dark:text-gray-500">
              {label}
            </span>
            <textarea
              value={state[key]}
              onChange={update(key)}
              rows={4}
              className="w-full resize-y rounded border-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:text-gray-200 dark:placeholder-gray-500"
              placeholder="내용을 입력하세요..."
            />
          </div>
        ))}
      </div>
      {/* X axis label */}
      <div className="mt-1 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
        {labelX} ▶
      </div>
    </section>
  );
}

registerTemplate("quadrant", QuadrantReader);
export default QuadrantReader;
