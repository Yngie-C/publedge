import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BeforeAfterNodeView } from "./BeforeAfterNodeView";

export const BeforeAfterNode = createTemplateNode("beforeAfter", "beforeAfter", {
  before: {
    default: "",
    parseHTML: (el) => el.getAttribute("data-before") || "",
    renderHTML: (attrs) => ({ "data-before": attrs.before as string }),
  },
  after: {
    default: "",
    parseHTML: (el) => el.getAttribute("data-after") || "",
    renderHTML: (attrs) => ({ "data-after": attrs.after as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(BeforeAfterNodeView);
  },
});
