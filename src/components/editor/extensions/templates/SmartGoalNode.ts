import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SmartGoalNodeView } from "./SmartGoalNodeView";

export const SmartGoalNode = createTemplateNode("smartGoal", "smartGoal", {
  fields: {
    default: JSON.stringify({ s: "", m: "", a: "", r: "", t: "" }),
    parseHTML: (el) =>
      el.getAttribute("data-fields") ||
      JSON.stringify({ s: "", m: "", a: "", r: "", t: "" }),
    renderHTML: (attrs) => ({ "data-fields": attrs.fields as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(SmartGoalNodeView);
  },
});
