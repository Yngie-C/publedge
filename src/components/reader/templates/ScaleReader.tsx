"use client";

import { useState, useEffect } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface Props {
  element: Element;
  chapterId: string;
}

interface ScaleState {
  value: number | null;
}

function ScaleReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";
  const min = parseInt(element.attribs["data-min"] || "1", 10);
  const max = parseInt(element.attribs["data-max"] || "10", 10);
  const labelMin = element.attribs["data-label-min"] || "";
  const labelMax = element.attribs["data-label-max"] || "";
  const defaultValue = element.attribs["data-value"]
    ? parseInt(element.attribs["data-value"], 10)
    : null;

  const [selected, setSelected] = useState<number | null>(defaultValue);

  useEffect(() => {
    const saved = getTemplateState<ScaleState>(chapterId, nodeId);
    if (saved && saved.value !== undefined) setSelected(saved.value);
  }, [chapterId, nodeId]);

  function handleSelect(val: number) {
    const next = val === selected ? null : val;
    setSelected(next);
    setTemplateState<ScaleState>(chapterId, nodeId, { value: next });
  }

  const steps: number[] = [];
  for (let i = min; i <= max; i++) steps.push(i);

  return (
    <section className="template-scale my-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 flex-wrap">
        {labelMin && (
          <span className="text-xs text-gray-500 shrink-0">{labelMin}</span>
        )}
        <div className="flex gap-1 flex-wrap">
          {steps.map((val) => (
            <button
              key={val}
              onClick={() => handleSelect(val)}
              className={`w-8 h-8 rounded text-sm font-medium border transition-colors ${
                selected === val
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
        {labelMax && (
          <span className="text-xs text-gray-500 shrink-0">{labelMax}</span>
        )}
      </div>
    </section>
  );
}

registerTemplate("scale", ScaleReader);
export default ScaleReader;
