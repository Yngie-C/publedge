import { createTemplateNode } from "./BaseTemplateNode";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ReflectionNodeView } from "./ReflectionNodeView";

export const ReflectionNode = createTemplateNode("reflection", "reflection", {
  prompt: {
    default: "이 챕터에서 가장 인상 깊었던 점은?",
    parseHTML: (el) =>
      el.getAttribute("data-prompt") || "이 챕터에서 가장 인상 깊었던 점은?",
    renderHTML: (attrs) => ({ "data-prompt": attrs.prompt as string }),
  },
  placeholder: {
    default: "여기에 답변을 작성하세요...",
    parseHTML: (el) =>
      el.getAttribute("data-placeholder") || "여기에 답변을 작성하세요...",
    renderHTML: (attrs) => ({ "data-placeholder": attrs.placeholder as string }),
  },
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(ReflectionNodeView);
  },
});
