import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { WoopNodeView } from "./WoopNodeView";

export const WoopNode = createTemplateNode("woop", "woop", {
  fields: {
    default: JSON.stringify({ w: "", o: "", ob: "", p: "" }),
    parseHTML: (el) =>
      el.getAttribute("data-fields") ||
      JSON.stringify({ w: "", o: "", ob: "", p: "" }),
    renderHTML: (attrs) => ({ "data-fields": attrs.fields as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(WoopNodeView);
  },
});
