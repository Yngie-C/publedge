import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function ColumnListNodeView({ node, updateAttributes }: NodeViewProps) {
  const columns = parseInt(node.attrs.columns as string, 10) || 2;
  const items: string[] = (() => {
    try {
      return JSON.parse(node.attrs.items as string) as string[];
    } catch {
      return ["열1 내용", "열2 내용"];
    }
  })();

  const setColumns = (count: number) => {
    const next = [...items];
    while (next.length < count) next.push("");
    updateAttributes({
      columns: String(count),
      items: JSON.stringify(next.slice(0, count)),
    });
  };

  const setItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    updateAttributes({ items: JSON.stringify(next) });
  };

  return (
    <NodeViewWrapper className="template-columnList" data-template-type="columnList">
      <div className="border border-gray-200 rounded-lg p-4 my-2 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-600">열 수:</span>
          {[2, 3, 4].map((count) => (
            <button
              key={count}
              onClick={() => setColumns(count)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                columns === count
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {count}열
            </button>
          ))}
        </div>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">열 {i + 1}</div>
              <textarea
                value={items[i] ?? ""}
                onChange={(e) => setItem(i, e.target.value)}
                placeholder={`열 ${i + 1} 내용`}
                className="w-full min-h-[80px] text-sm resize-none outline-none border-none"
              />
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
