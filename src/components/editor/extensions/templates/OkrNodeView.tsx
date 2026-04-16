import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

interface KeyResult {
  text: string;
  progress: number;
}

function parseKeyResults(raw: string): KeyResult[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as KeyResult[];
  } catch {
    // fall through
  }
  return [{ text: "", progress: 0 }];
}

export function OkrNodeView({ node, updateAttributes }: NodeViewProps) {
  const objective = (node.attrs.objective as string) || "";
  const keyResults = parseKeyResults(node.attrs.keyResults as string);

  function setKeyResults(next: KeyResult[]) {
    updateAttributes({ keyResults: JSON.stringify(next) });
  }

  function updateKrText(index: number, text: string) {
    setKeyResults(keyResults.map((kr, i) => (i === index ? { ...kr, text } : kr)));
  }

  function updateKrProgress(index: number, progress: number) {
    const clamped = Math.max(0, Math.min(100, progress));
    setKeyResults(keyResults.map((kr, i) => (i === index ? { ...kr, progress: clamped } : kr)));
  }

  function addKr() {
    setKeyResults([...keyResults, { text: "", progress: 0 }]);
  }

  function removeKr(index: number) {
    if (keyResults.length === 1) return;
    setKeyResults(keyResults.filter((_, i) => i !== index));
  }

  return (
    <NodeViewWrapper
      className="template-okr my-3 rounded-lg border border-gray-200 bg-white p-4"
      data-template-type="okr"
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        OKR
      </div>

      {/* Objective */}
      <div className="mb-4">
        <div className="mb-1 text-sm font-bold text-gray-700">Objective</div>
        <input
          type="text"
          value={objective}
          onChange={(e) => updateAttributes({ objective: e.target.value })}
          className="w-full rounded border border-gray-200 px-3 py-2 text-base font-semibold text-gray-800 outline-none focus:border-blue-400"
          placeholder="목표를 입력하세요..."
        />
      </div>

      {/* Key Results */}
      <div className="mb-2 text-sm font-bold text-gray-700">Key Results</div>
      <ul className="space-y-2">
        {keyResults.map((kr, i) => (
          <li key={i} className="ml-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">KR{i + 1}</span>
            <input
              type="text"
              value={kr.text}
              onChange={(e) => updateKrText(i, e.target.value)}
              className="flex-1 border-none bg-transparent text-sm text-gray-800 outline-none"
              placeholder="핵심 결과 입력..."
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={kr.progress}
                onChange={(e) => updateKrProgress(i, Number(e.target.value))}
                className="w-14 rounded border border-gray-200 px-1 py-0.5 text-center text-xs outline-none focus:border-blue-400"
                min={0}
                max={100}
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <button
              onClick={() => removeKr(i)}
              className="flex-shrink-0 text-gray-300 hover:text-red-400"
              title="삭제"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={addKr}
        className="mt-3 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
      >
        <span className="text-base font-bold">+</span> KR 추가
      </button>
    </NodeViewWrapper>
  );
}
