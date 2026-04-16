import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

function parseItems(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 4) return parsed as string[];
  } catch {
    // fall through
  }
  return ["", "", "", ""];
}

const QUADRANT_LABELS = ["1사분면", "2사분면", "3사분면", "4사분면"];

export function QuadrantNodeView({ node, updateAttributes }: NodeViewProps) {
  const items = parseItems(node.attrs.items as string);
  const labelX = (node.attrs.labelX as string) || "긴급함";
  const labelY = (node.attrs.labelY as string) || "중요함";

  function setItem(index: number, value: string) {
    const next = items.map((item, i) => (i === index ? value : item));
    updateAttributes({ items: JSON.stringify(next) });
  }

  return (
    <NodeViewWrapper
      className="template-quadrant my-3 rounded-lg border border-gray-200 bg-white p-4"
      data-template-type="quadrant"
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        2x2 사분면
      </div>

      {/* Axis labels */}
      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">X축 (가로):</span>
          <input
            type="text"
            value={labelX}
            onChange={(e) => updateAttributes({ labelX: e.target.value })}
            className="w-24 rounded border border-gray-200 px-2 py-0.5 text-xs outline-none focus:border-blue-400"
            placeholder="긴급함"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Y축 (세로):</span>
          <input
            type="text"
            value={labelY}
            onChange={(e) => updateAttributes({ labelY: e.target.value })}
            className="w-24 rounded border border-gray-200 px-2 py-0.5 text-xs outline-none focus:border-blue-400"
            placeholder="중요함"
          />
        </div>
      </div>

      {/* Y-axis label */}
      <div className="flex">
        <div className="flex w-8 items-center justify-center">
          <span
            className="text-xs font-medium text-gray-500"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {labelY}
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-1">
            {items.map((item, i) => (
              <div
                key={i}
                className="relative rounded border border-gray-200 bg-gray-50 p-2"
              >
                <div className="mb-1 text-xs font-medium text-gray-400">
                  {QUADRANT_LABELS[i]}
                </div>
                <textarea
                  value={item}
                  onChange={(e) => setItem(i, e.target.value)}
                  className="h-20 w-full resize-none border-none bg-transparent text-sm text-gray-800 outline-none"
                  placeholder="내용 입력..."
                />
              </div>
            ))}
          </div>

          {/* X-axis label */}
          <div className="mt-1 text-center text-xs font-medium text-gray-500">
            {labelX}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
