"use client";

import { useState, useEffect } from "react";
import type { Element } from "html-react-parser";
import { getTemplateState, setTemplateState } from "@/lib/template-storage";
import { registerTemplate } from "./TemplateRenderer";

interface ChecklistItem {
  text: string;
  checked: boolean;
}

interface Props {
  element: Element;
  chapterId: string;
}

function ChecklistReader({ element, chapterId }: Props) {
  const nodeId = element.attribs["data-node-id"] || "";
  const rawItems = element.attribs["data-items"] || "[]";

  const parseItems = (): ChecklistItem[] => {
    try {
      return JSON.parse(rawItems) as ChecklistItem[];
    } catch {
      return [];
    }
  };

  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const saved = getTemplateState<boolean[]>(chapterId, nodeId);
    const base = parseItems();
    if (saved && saved.length === base.length) {
      return base.map((item, i) => ({ ...item, checked: saved[i] }));
    }
    return base;
  });

  useEffect(() => {
    setTemplateState<boolean[]>(
      chapterId,
      nodeId,
      items.map((item) => item.checked)
    );
  }, [items, chapterId, nodeId]);

  const toggle = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <section className="template-checklist my-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <input
              type="checkbox"
              id={`${nodeId}-item-${index}`}
              checked={item.checked}
              onChange={() => toggle(index)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-blue-600 dark:border-gray-600"
            />
            <label
              htmlFor={`${nodeId}-item-${index}`}
              className={`cursor-pointer text-sm leading-relaxed ${
                item.checked
                  ? "text-gray-400 line-through dark:text-gray-500"
                  : "text-gray-800 dark:text-gray-200"
              }`}
            >
              {item.text}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

registerTemplate("checklist", ChecklistReader);
export default ChecklistReader;
