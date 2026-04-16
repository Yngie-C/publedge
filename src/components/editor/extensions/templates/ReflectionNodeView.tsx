import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export function ReflectionNodeView({ node, updateAttributes }: NodeViewProps) {
  const prompt =
    (node.attrs.prompt as string) ?? "이 챕터에서 가장 인상 깊었던 점은?";
  const placeholder =
    (node.attrs.placeholder as string) ?? "여기에 답변을 작성하세요...";

  return (
    <NodeViewWrapper
      className="template-reflection my-3 rounded-lg border border-purple-200 bg-purple-50 p-4"
      data-template-type="reflection"
    >
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-400">
        성찰 질문
      </div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => updateAttributes({ prompt: e.target.value })}
        className="mb-3 w-full border-none bg-transparent text-sm font-semibold text-gray-800 outline-none placeholder:text-gray-400"
        placeholder="질문을 입력하세요..."
      />
      <div className="rounded border border-gray-200 bg-white px-3 py-2">
        <p className="text-sm text-gray-400">{placeholder}</p>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <input
          type="text"
          value={placeholder}
          onChange={(e) => updateAttributes({ placeholder: e.target.value })}
          className="flex-1 border-none bg-transparent text-xs text-gray-400 outline-none"
          placeholder="응답 안내 문구 (placeholder)"
        />
      </div>
    </NodeViewWrapper>
  );
}
