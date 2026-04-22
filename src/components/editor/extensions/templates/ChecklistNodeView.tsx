import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

interface ChecklistItem {
  text: string;
  checked: boolean;
}

function parseItems(raw: string): ChecklistItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ChecklistItem[];
  } catch {
    // fall through
  }
  return [{ text: "항목 1", checked: false }];
}

export function ChecklistNodeView({ node, updateAttributes }: NodeViewProps) {
  const items: ChecklistItem[] = parseItems(node.attrs.items as string);

  function setItems(next: ChecklistItem[]) {
    updateAttributes({ items: JSON.stringify(next) });
  }

  function toggle(index: number) {
    const next = items.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    setItems(next);
  }

  function updateText(index: number, text: string) {
    const next = items.map((item, i) =>
      i === index ? { ...item, text } : item
    );
    setItems(next);
  }

  function addItem() {
    setItems([...items, { text: `항목 ${items.length + 1}`, checked: false }]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  return (
    <NodeViewWrapper
      className="template-checklist my-3 rounded-lg border border-gray-200 bg-white p-4"
      data-template-type="checklist"
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        체크리스트
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggle(i)}
              className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 accent-blue-500"
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateText(i, e.target.value)}
              className={`flex-1 border-none bg-transparent text-sm outline-none ${
                item.checked ? "text-gray-400 line-through" : "text-gray-800"
              }`}
              placeholder="항목 텍스트"
            />
            <button
              onClick={() => removeItem(i)}
              className="flex-shrink-0 text-gray-300 hover:text-red-400"
              title="삭제"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={addItem}
        className="mt-3 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
      >
        <span className="text-base font-bold">+</span> 항목 추가
      </button>
    </NodeViewWrapper>
  );
}
