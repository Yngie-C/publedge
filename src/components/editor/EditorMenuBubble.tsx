"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Bold, Italic, Link, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";

interface BubbleButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

function BubbleButton({ onClick, isActive, title, children }: BubbleButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        "text-gray-700 hover:bg-gray-100",
        isActive && "bg-gray-900 text-white hover:bg-gray-800",
      )}
    >
      {children}
    </button>
  );
}

interface EditorMenuBubbleProps {
  editor: Editor;
}

interface BubblePos {
  top: number;
  left: number;
}

export function EditorMenuBubble({ editor }: EditorMenuBubbleProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<BubblePos>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateBubble = () => {
      const { state, view } = editor;
      const { selection } = state;
      const { empty, from, to } = selection;

      if (empty || !view.hasFocus()) {
        setVisible(false);
        return;
      }

      // Get selection bounding rect
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setVisible(false);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0) {
        setVisible(false);
        return;
      }

      const menuWidth = 156; // approx width of the bubble
      const menuHeight = 36;
      const gap = 8;

      const left = Math.max(
        8,
        rect.left + rect.width / 2 - menuWidth / 2 + window.scrollX,
      );
      const top = rect.top + window.scrollY - menuHeight - gap;

      setPos({ top, left });
      setVisible(true);
    };

    // Listen to editor selection changes
    editor.on("selectionUpdate", updateBubble);
    editor.on("blur", () => setVisible(false));

    // Also listen to mouse up for initial selection
    document.addEventListener("mouseup", updateBubble);
    document.addEventListener("keyup", updateBubble);

    return () => {
      editor.off("selectionUpdate", updateBubble);
      editor.off("blur", () => setVisible(false));
      document.removeEventListener("mouseup", updateBubble);
      document.removeEventListener("keyup", updateBubble);
    };
  }, [editor]);

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL을 입력하세요:", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-md"
    >
      <BubbleButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="굵게"
      >
        <Bold className="h-3.5 w-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="기울임"
      >
        <Italic className="h-3.5 w-3.5" />
      </BubbleButton>
      <BubbleButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive("highlight")}
        title="형광펜"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </BubbleButton>
      <div className="mx-0.5 h-4 w-px bg-gray-200" />
      <BubbleButton
        onClick={addLink}
        isActive={editor.isActive("link")}
        title="링크"
      >
        <Link className="h-3.5 w-3.5" />
      </BubbleButton>
    </div>
  );
}
