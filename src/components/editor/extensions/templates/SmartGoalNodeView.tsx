import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

interface SmartFields {
  s: string;
  m: string;
  a: string;
  r: string;
  t: string;
}

const SMART_LABELS: { key: keyof SmartFields; label: string; desc: string }[] = [
  { key: "s", label: "S — Specific", desc: "구체적인 목표가 무엇인가요?" },
  { key: "m", label: "M — Measurable", desc: "어떻게 측정할 수 있나요?" },
  { key: "a", label: "A — Achievable", desc: "달성 가능한 목표인가요?" },
  { key: "r", label: "R — Relevant", desc: "왜 중요한 목표인가요?" },
  { key: "t", label: "T — Time-bound", desc: "언제까지 달성할 건가요?" },
];

export function SmartGoalNodeView({ node, updateAttributes }: NodeViewProps) {
  const fields: SmartFields = (() => {
    try {
      return JSON.parse(node.attrs.fields as string) as SmartFields;
    } catch {
      return { s: "", m: "", a: "", r: "", t: "" };
    }
  })();

  const setField = (key: keyof SmartFields, value: string) => {
    updateAttributes({ fields: JSON.stringify({ ...fields, [key]: value }) });
  };

  return (
    <NodeViewWrapper className="template-smartGoal" data-template-type="smartGoal">
      <div className="border border-gray-200 rounded-lg p-4 my-2 bg-white">
        <h3 className="text-sm font-bold text-gray-700 mb-3">SMART 목표 설정</h3>
        <div className="flex flex-col gap-3">
          {SMART_LABELS.map(({ key, label, desc }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">{label}</label>
              <p className="text-xs text-gray-400">{desc}</p>
              <textarea
                value={fields[key]}
                onChange={(e) => setField(key, e.target.value)}
                placeholder={desc}
                className="w-full min-h-[60px] text-sm resize-none outline-none border border-gray-200 rounded p-2"
              />
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
