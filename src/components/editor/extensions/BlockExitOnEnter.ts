import { Extension } from "@tiptap/core";

export const BlockExitOnEnter = Extension.create({
  name: "blockExitOnEnter",
  priority: 150, // Higher than CodeBlock's default 100

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $head } = state.selection;

        // Case 1: Heading — always exit to paragraph on Enter
        if ($head.parent.type.name === "heading") {
          if ($head.parent.textContent === "") {
            // Empty heading → convert to paragraph
            return editor.commands.setNode("paragraph");
          }
          // Has text → split block, convert the new (second) block to paragraph
          // e.g., {H2}"텍스트A|텍스트B" → {H2}"텍스트A" + {P}"텍스트B"
          return editor.chain().splitBlock().setNode("paragraph").run();
        }

        // Case 2: Blockquote — wrapper node, $head.parent is inner paragraph
        // Must check $head.node(-1) for the blockquote wrapper
        if (
          $head.depth >= 2 &&
          $head.node(-1).type.name === "blockquote" &&
          $head.parent.textContent === ""
        ) {
          return editor.commands.lift("blockquote");
        }

        // Case 3: CodeBlock — direct textblock, exit only when ENTIRE block is empty
        if ($head.parent.type.name === "codeBlock" && $head.parent.textContent.length === 0) {
          return editor.commands.setNode("paragraph");
        }

        // All other cases: return false to let default behavior run
        return false;
      },
    };
  },
});
