import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ChevronDown } from "lucide-react";

export function ToggleNodeView({ node, updateAttributes }: NodeViewProps) {
  const summary = (node.attrs.summary as string) ?? "클릭하여 펼치기";
  const content = (node.attrs.content as string) ?? "";
  const [open, setOpen] = useState(false);

  return (
    <NodeViewWrapper
      className="template-toggle my-3 rounded-lg border border-gray-200 bg-white"
      data-template-type="toggle"
    >
      <div
        className="flex cursor-pointer items-center gap-2 px-4 py-3 select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
        <input
          type="text"
          value={summary}
          onChange={(e) => updateAttributes({ summary: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 border-none bg-transparent text-sm font-semibold text-gray-800 outline-none"
          placeholder="제목을 입력하세요..."
        />
      </div>
      {open && (
        <div className="border-t border-gray-100 px-4 py-3">
          <textarea
            value={content}
            onChange={(e) => updateAttributes({ content: e.target.value })}
            rows={4}
            className="w-full resize-none border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            placeholder="내용을 입력하세요..."
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}
