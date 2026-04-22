import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ChecklistNodeView } from "./ChecklistNodeView";

export const ChecklistNode = createTemplateNode("checklist", "checklist", {
  items: {
    default: JSON.stringify([{ text: "항목 1", checked: false }]),
    parseHTML: (el) =>
      el.getAttribute("data-items") ||
      JSON.stringify([{ text: "항목 1", checked: false }]),
    renderHTML: (attrs) => ({ "data-items": attrs.items as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(ChecklistNodeView);
  },
});
