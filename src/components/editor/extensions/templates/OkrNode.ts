import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { OkrNodeView } from "./OkrNodeView";

export const OkrNode = createTemplateNode("okr", "okr", {
  objective: {
    default: "",
    parseHTML: (el) => el.getAttribute("data-objective") || "",
    renderHTML: (attrs) => ({ "data-objective": attrs.objective as string }),
  },
  keyResults: {
    default: JSON.stringify([{ text: "", progress: 0 }]),
    parseHTML: (el) =>
      el.getAttribute("data-key-results") ||
      JSON.stringify([{ text: "", progress: 0 }]),
    renderHTML: (attrs) => ({ "data-key-results": attrs.keyResults as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(OkrNodeView);
  },
});
