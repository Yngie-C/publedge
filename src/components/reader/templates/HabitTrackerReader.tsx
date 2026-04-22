"use client";

import { useState, useEffect } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface Habit {
  name: string;
  checks: boolean[];
}

type HabitState = boolean[][];

interface Props {
  element: Element;
  chapterId: string;
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function HabitTrackerReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";

  const parseHabits = (): Habit[] => {
    try {
      const raw = element.attribs["data-habits"] || "[]";
      return JSON.parse(raw) as Habit[];
    } catch {
      return [];
    }
  };

  const habits = parseHabits();

  const [checks, setChecks] = useState<HabitState>(() => {
    const saved = getTemplateState<HabitState>(chapterId, nodeId);
    if (saved && saved.length === habits.length) return saved;
    return habits.map((h) => {
      const base = h.checks ?? [];
      return Array.from({ length: 7 }, (_, i) => base[i] ?? false);
    });
  });

  useEffect(() => {
    setTemplateState<HabitState>(chapterId, nodeId, checks);
  }, [checks, chapterId, nodeId]);

  const toggle = (habitIdx: number, dayIdx: number) => {
    setChecks((prev) =>
      prev.map((row, hi) =>
        hi === habitIdx
          ? row.map((val, di) => (di === dayIdx ? !val : val))
          : row
      )
    );
  };

  return (
    <section className="template-habit-tracker my-4 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-32 border-b border-gray-300 pb-2 text-left font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300">
              습관
            </th>
            {DAY_LABELS.map((day) => (
              <th
                key={day}
                className="border-b border-gray-300 pb-2 text-center font-semibold text-gray-600 dark:border-gray-600 dark:text-gray-300"
              >
                {day}
              </th>
            ))}
            <th className="border-b border-gray-300 pb-2 text-center font-semibold text-gray-500 dark:border-gray-600 dark:text-gray-400">
              달성
            </th>
          </tr>
        </thead>
        <tbody>
          {habits.map((habit, hi) => {
            const row = checks[hi] ?? Array(7).fill(false);
            const doneCount = row.filter(Boolean).length;
            return (
              <tr key={hi} className="border-b border-gray-200 last:border-0 dark:border-gray-700">
                <td className="py-2 pr-2 text-gray-800 dark:text-gray-200">{habit.name}</td>
                {Array.from({ length: 7 }, (_, di) => (
                  <td key={di} className="py-2 text-center">
                    <button
                      onClick={() => toggle(hi, di)}
                      aria-label={`${habit.name} ${DAY_LABELS[di]} 체크`}
                      className={`h-6 w-6 rounded-full border transition-colors ${
                        row[di]
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300 bg-white text-gray-300 hover:border-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400"
                      }`}
                    >
                      {row[di] ? "✓" : ""}
                    </button>
                  </td>
                ))}
                <td className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {doneCount}/7
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

registerTemplate("habit-tracker", HabitTrackerReader);
export default HabitTrackerReader;
