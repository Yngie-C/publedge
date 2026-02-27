"use client";

import { useEffect, useRef } from "react";

interface SwipeHandlerProps {
  onNext: () => void;
  onPrev: () => void;
  children: React.ReactNode;
  className?: string;
}

const SWIPE_THRESHOLD = 50; // px

export function SwipeHandler({
  onNext,
  onPrev,
  children,
  className = "",
}: SwipeHandlerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        onPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      onNext(); // swipe left → next page
    } else {
      onPrev(); // swipe right → prev page
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`touch-pan-y select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
