import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

interface WoopFields {
  w: string;
  o: string;
  ob: string;
  p: string;
}

function parseFields(raw: string): WoopFields {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as WoopFields;
  } catch {
    // fall through
  }
  return { w: "", o: "", ob: "", p: "" };
}

const WOOP_CONFIG = [
  {
    key: "w" as const,
    label: "Wish",
    desc: "원하는 것",
    bg: "bg-purple-50",
    border: "border-purple-200",
    labelColor: "text-purple-700",
  },
  {
    key: "o" as const,
    label: "Outcome",
    desc: "최고의 결과",
    bg: "bg-blue-50",
    border: "border-blue-200",
    labelColor: "text-blue-700",
  },
  {
    key: "ob" as const,
    label: "Obstacle",
    desc: "방해 요소",
    bg: "bg-orange-50",
    border: "border-orange-200",
    labelColor: "text-orange-700",
  },
  {
    key: "p" as const,
    label: "Plan",
    desc: "실행 계획",
    bg: "bg-green-50",
    border: "border-green-200",
    labelColor: "text-green-700",
  },
];

export function WoopNodeView({ node, updateAttributes }: NodeViewProps) {
  const fields = parseFields(node.attrs.fields as string);

  function setField(key: keyof WoopFields, value: string) {
    updateAttributes({ fields: JSON.stringify({ ...fields, [key]: value }) });
  }

  return (
    <NodeViewWrapper
      className="template-woop my-3 rounded-lg border border-gray-200 bg-white p-4"
      data-template-type="woop"
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        WOOP
      </div>

      <div className="space-y-3">
        {WOOP_CONFIG.map(({ key, label, desc, bg, border, labelColor }) => (
          <div
            key={key}
            className={`rounded-lg border p-3 ${bg} ${border}`}
          >
            <div className={`mb-1 text-sm font-bold ${labelColor}`}>
              {label}{" "}
              <span className="text-xs font-normal text-gray-500">— {desc}</span>
            </div>
            <textarea
              value={fields[key]}
              onChange={(e) => setField(key, e.target.value)}
              className={`h-16 w-full resize-none border-none bg-transparent text-sm text-gray-800 outline-none`}
              placeholder={`${label}을(를) 입력하세요...`}
            />
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
}
