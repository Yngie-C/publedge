import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { HabitTrackerNodeView } from "./HabitTrackerNodeView";

export const HabitTrackerNode = createTemplateNode(
  "habitTracker",
  "habitTracker",
  {
    habits: {
      default: JSON.stringify([
        {
          name: "습관 1",
          checks: [false, false, false, false, false, false, false],
        },
      ]),
      parseHTML: (el) =>
        el.getAttribute("data-habits") ||
        JSON.stringify([
          {
            name: "습관 1",
            checks: [false, false, false, false, false, false, false],
          },
        ]),
      renderHTML: (attrs) => ({ "data-habits": attrs.habits as string }),
    },
  }
).extend({
  addNodeView() {
    return ReactNodeViewRenderer(HabitTrackerNodeView);
  },
});
