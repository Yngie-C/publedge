import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function ScaleNodeView({ node, updateAttributes }: NodeViewProps) {
  const min = parseInt(node.attrs.min as string, 10) || 1;
  const max = parseInt(node.attrs.max as string, 10) || 10;
  const labelMin = (node.attrs.labelMin as string) ?? "낮음";
  const labelMax = (node.attrs.labelMax as string) ?? "높음";
  const value = parseInt(node.attrs.value as string, 10) || 5;

  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <NodeViewWrapper className="template-scale" data-template-type="scale">
      <div className="border border-gray-200 rounded-lg p-4 my-2 bg-white">
        <div className="flex flex-wrap gap-1 justify-center mb-3">
          {steps.map((n) => (
            <button
              key={n}
              onClick={() => updateAttributes({ value: String(n) })}
              className={`w-9 h-9 text-sm rounded border transition-colors ${
                value === n
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <input
            value={labelMin}
            onChange={(e) => updateAttributes({ labelMin: e.target.value })}
            placeholder="낮음"
            className="w-24 border border-gray-200 rounded px-1 py-0.5 text-xs outline-none"
          />
          <span className="text-gray-400">←</span>
          <span className="font-medium text-gray-700">현재 값: {value}</span>
          <span className="text-gray-400">→</span>
          <input
            value={labelMax}
            onChange={(e) => updateAttributes({ labelMax: e.target.value })}
            placeholder="높음"
            className="w-24 border border-gray-200 rounded px-1 py-0.5 text-xs outline-none text-right"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
