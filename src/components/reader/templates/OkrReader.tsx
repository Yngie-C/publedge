"use client";

import { useState, useEffect } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface KeyResult {
  text: string;
  progress: number;
}

interface Props {
  element: Element;
  chapterId: string;
}

function OkrReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";
  const objective = element.attribs["data-objective"] || "";

  const parseKeyResults = (): KeyResult[] => {
    try {
      const raw = element.attribs["data-key-results"] || "[]";
      return JSON.parse(raw) as KeyResult[];
    } catch {
      return [];
    }
  };

  const [progresses, setProgresses] = useState<number[]>(() => {
    const saved = getTemplateState<number[]>(chapterId, nodeId);
    const base = parseKeyResults();
    if (saved && saved.length === base.length) return saved;
    return base.map((kr) => kr.progress ?? 0);
  });

  const keyResults = parseKeyResults();

  useEffect(() => {
    setTemplateState<number[]>(chapterId, nodeId, progresses);
  }, [progresses, chapterId, nodeId]);

  const updateProgress = (index: number, value: number) => {
    setProgresses((prev) => prev.map((p, i) => (i === index ? value : p)));
  };

  const avgProgress =
    progresses.length > 0
      ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
      : 0;

  return (
    <section className="template-okr my-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Objective */}
      <div className="mb-4">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400">
          Objective
        </span>
        <p className="text-base font-bold text-gray-900 dark:text-gray-100">
          {objective}
        </p>
      </div>

      {/* Overall progress */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>전체 진행률</span>
          <span className="font-semibold">{avgProgress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      {/* Key Results */}
      <div className="space-y-3">
        <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Key Results
        </span>
        {keyResults.map((kr, index) => {
          const progress = progresses[index] ?? 0;
          return (
            <div key={index} className="rounded border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-700">
              <p className="mb-2 text-sm text-gray-800 dark:text-gray-200">{kr.text}</p>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => updateProgress(index, Number(e.target.value))}
                  className="h-2 flex-1 cursor-pointer accent-blue-500"
                />
                <span className="w-10 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {progress}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

registerTemplate("okr", OkrReader);
export default OkrReader;
