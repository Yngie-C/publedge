import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ColumnListNodeView } from "./ColumnListNodeView";

export const ColumnListNode = createTemplateNode("columnList", "columnList", {
  columns: {
    default: "2",
    parseHTML: (el) => el.getAttribute("data-columns") || "2",
    renderHTML: (attrs) => ({ "data-columns": attrs.columns as string }),
  },
  items: {
    default: JSON.stringify(["열1 내용", "열2 내용"]),
    parseHTML: (el) =>
      el.getAttribute("data-items") || JSON.stringify(["열1 내용", "열2 내용"]),
    renderHTML: (attrs) => ({ "data-items": attrs.items as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(ColumnListNodeView);
  },
});
