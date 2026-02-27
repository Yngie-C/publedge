"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const displayValue = readonly ? value : (hovered || value);
  const iconSize = sizeMap[size];

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => !readonly && setHovered(0)}
      aria-label={`Rating: ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        // Half-star support for display-only
        const half =
          readonly && star - 0.5 <= value && value < star;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            className={cn(
              "relative transition-transform",
              !readonly &&
                "cursor-pointer hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded",
              readonly && "cursor-default",
            )}
            onMouseEnter={() => !readonly && setHovered(star)}
            onClick={() => !readonly && onChange?.(star)}
          >
            {half ? (
              <span className="relative inline-block">
                <Star
                  className={cn(iconSize, "text-gray-200")}
                  fill="currentColor"
                />
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: "50%" }}
                >
                  <Star
                    className={cn(iconSize, "text-yellow-400")}
                    fill="currentColor"
                  />
                </span>
              </span>
            ) : (
              <Star
                className={cn(
                  iconSize,
                  filled ? "text-yellow-400" : "text-gray-200",
                  !readonly && !filled && "hover:text-yellow-300",
                )}
                fill="currentColor"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
