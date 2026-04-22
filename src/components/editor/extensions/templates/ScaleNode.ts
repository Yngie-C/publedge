import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ScaleNodeView } from "./ScaleNodeView";

export const ScaleNode = createTemplateNode("scale", "scale", {
  min: {
    default: "1",
    parseHTML: (el) => el.getAttribute("data-min") || "1",
    renderHTML: (attrs) => ({ "data-min": attrs.min as string }),
  },
  max: {
    default: "10",
    parseHTML: (el) => el.getAttribute("data-max") || "10",
    renderHTML: (attrs) => ({ "data-max": attrs.max as string }),
  },
  labelMin: {
    default: "낮음",
    parseHTML: (el) => el.getAttribute("data-label-min") || "낮음",
    renderHTML: (attrs) => ({ "data-label-min": attrs.labelMin as string }),
  },
  labelMax: {
    default: "높음",
    parseHTML: (el) => el.getAttribute("data-label-max") || "높음",
    renderHTML: (attrs) => ({ "data-label-max": attrs.labelMax as string }),
  },
  value: {
    default: "5",
    parseHTML: (el) => el.getAttribute("data-value") || "5",
    renderHTML: (attrs) => ({ "data-value": attrs.value as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(ScaleNodeView);
  },
});
