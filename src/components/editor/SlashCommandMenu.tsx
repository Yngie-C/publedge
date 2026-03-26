"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlashMenuItem {
  title: string;
  aliases: string[];
  icon: LucideIcon;
  command: (props: { editor: Editor; range: { from: number; to: number } }) => void;
}

interface SlashCommandMenuProps {
  items: SlashMenuItem[];
  command: (item: SlashMenuItem) => void;
  editor: Editor;
}

export interface SlashCommandMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection when items change
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command]
    );

    // Expose onKeyDown to parent (suggestion renderer)
    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="w-64 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500 shadow-lg">
          결과 없음
        </div>
      );
    }

    return (
      <div
        className="w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        role="listbox"
        style={{ maxHeight: "300px" }}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <div className="font-medium">{item.title}</div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }
);

SlashCommandMenu.displayName = "SlashCommandMenu";
