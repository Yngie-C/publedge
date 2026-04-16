import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ToggleNodeView } from "./ToggleNodeView";

export const ToggleNode = createTemplateNode("toggle", "toggle", {
  summary: {
    default: "클릭하여 펼치기",
    parseHTML: (el) => el.getAttribute("data-summary") || "클릭하여 펼치기",
    renderHTML: (attrs) => ({ "data-summary": attrs.summary as string }),
  },
  content: {
    default: "",
    parseHTML: (el) => el.getAttribute("data-content") || "",
    renderHTML: (attrs) => ({ "data-content": attrs.content as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(ToggleNodeView);
  },
});
