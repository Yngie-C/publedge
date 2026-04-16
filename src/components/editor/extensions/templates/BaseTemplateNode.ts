import { Node, mergeAttributes } from "@tiptap/core";
import { generateNodeId } from "@/lib/template-node-id";

export interface BaseTemplateNodeOptions {
  templateType: string;
}

/**
 * Creates a TipTap Node for an interactive template block.
 * All template nodes share: data-template-type, data-node-id, and a <section> wrapper.
 */
export function createTemplateNode(
  name: string,
  templateType: string,
  extraAttrs: Record<string, { default: string | number | boolean | null; parseHTML?: (el: HTMLElement) => string | number | boolean | null; renderHTML?: (attrs: Record<string, unknown>) => Record<string, string> | null }> = {}
) {
  return Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
      return {
        nodeId: {
          default: null,
          parseHTML: (el: HTMLElement) => el.getAttribute("data-node-id") || generateNodeId(),
          renderHTML: (attrs) => ({ "data-node-id": attrs.nodeId as string }),
        },
        ...extraAttrs,
      };
    },

    parseHTML() {
      return [{ tag: `section[data-template-type="${templateType}"]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "section",
        mergeAttributes(HTMLAttributes, { "data-template-type": templateType }),
        0,
      ];
    },
  });
}
