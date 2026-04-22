"use client";

import type { Element } from "html-react-parser";
import { registerTemplate } from "./TemplateRenderer";

interface Props {
  element: Element;
  chapterId: string;
}

function ColumnListReader({ element }: Props) {
  const columns = parseInt(element.attribs["data-columns"] || "2", 10);
  let items: string[] = [];
  try {
    items = JSON.parse(element.attribs["data-items"] || "[]");
  } catch {
    items = [];
  }

  const gridClass = `grid gap-3 grid-cols-${columns}`;

  return (
    <section className="template-column-list my-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className={gridClass}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-white border border-gray-200 rounded text-sm text-gray-800"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

registerTemplate("column-list", ColumnListReader);
export default ColumnListReader;
