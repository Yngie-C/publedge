import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { QuadrantNodeView } from "./QuadrantNodeView";

export const QuadrantNode = createTemplateNode("quadrant", "quadrant", {
  labelX: {
    default: "긴급함",
    parseHTML: (el) => el.getAttribute("data-label-x") || "긴급함",
    renderHTML: (attrs) => ({ "data-label-x": attrs.labelX as string }),
  },
  labelY: {
    default: "중요함",
    parseHTML: (el) => el.getAttribute("data-label-y") || "중요함",
    renderHTML: (attrs) => ({ "data-label-y": attrs.labelY as string }),
  },
  items: {
    default: JSON.stringify(["", "", "", ""]),
    parseHTML: (el) =>
      el.getAttribute("data-items") || JSON.stringify(["", "", "", ""]),
    renderHTML: (attrs) => ({ "data-items": attrs.items as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(QuadrantNodeView);
  },
});
