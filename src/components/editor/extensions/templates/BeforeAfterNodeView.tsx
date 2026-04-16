import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function BeforeAfterNodeView({ node, updateAttributes }: NodeViewProps) {
  const before = (node.attrs.before as string) ?? "";
  const after = (node.attrs.after as string) ?? "";

  return (
    <NodeViewWrapper
      className="template-before-after my-3 rounded-lg border border-gray-200 bg-white p-4"
      data-template-type="beforeAfter"
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Before / After
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-red-400">Before</span>
          <textarea
            value={before}
            onChange={(e) => updateAttributes({ before: e.target.value })}
            rows={4}
            placeholder="변화 이전 상태를 입력하세요..."
            className="w-full resize-none rounded border border-red-100 bg-red-50 p-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-red-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-green-500">After</span>
          <textarea
            value={after}
            onChange={(e) => updateAttributes({ after: e.target.value })}
            rows={4}
            placeholder="변화 이후 상태를 입력하세요..."
            className="w-full resize-none rounded border border-green-100 bg-green-50 p-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-green-300"
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
