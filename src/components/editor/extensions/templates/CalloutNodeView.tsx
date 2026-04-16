import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Info, AlertTriangle, Lightbulb, FileText } from "lucide-react";

type CalloutType = "info" | "warning" | "tip" | "note";

const CALLOUT_CONFIG: Record<
  CalloutType,
  { label: string; Icon: React.ElementType; bg: string; border: string; iconColor: string }
> = {
  info: {
    label: "정보",
    Icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
  },
  warning: {
    label: "경고",
    Icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
  },
  tip: {
    label: "팁",
    Icon: Lightbulb,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
  },
  note: {
    label: "노트",
    Icon: FileText,
    bg: "bg-gray-50",
    border: "border-gray-200",
    iconColor: "text-gray-500",
  },
};

const CALLOUT_TYPES: CalloutType[] = ["info", "warning", "tip", "note"];

export function CalloutNodeView({ node, updateAttributes }: NodeViewProps) {
  const calloutType = (node.attrs.calloutType as CalloutType) ?? "info";
  const content = (node.attrs.content as string) ?? "";

  const config = CALLOUT_CONFIG[calloutType] ?? CALLOUT_CONFIG.info;
  const { Icon } = config;

  return (
    <NodeViewWrapper
      className={`template-callout my-3 rounded-lg border p-4 ${config.bg} ${config.border}`}
      data-template-type="callout"
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
        <select
          value={calloutType}
          onChange={(e) =>
            updateAttributes({ calloutType: e.target.value as CalloutType })
          }
          className={`border-none bg-transparent text-xs font-semibold uppercase tracking-wide outline-none ${config.iconColor}`}
        >
          {CALLOUT_TYPES.map((type) => (
            <option key={type} value={type}>
              {CALLOUT_CONFIG[type].label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={content}
        onChange={(e) => updateAttributes({ content: e.target.value })}
        placeholder="내용을 입력하세요..."
        rows={3}
        className="w-full resize-none border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
      />
    </NodeViewWrapper>
  );
}
