"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center">
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isCompleted
                    ? "bg-gray-900 text-white"
                    : isCurrent
                      ? "bg-gray-900 text-white ring-2 ring-gray-900/20"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  isCurrent ? "font-semibold text-gray-900" : "text-gray-400"
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {/* Connector line */}
            {stepNum < totalSteps && (
              <div
                className={`mx-3 h-[2px] w-10 sm:w-16 rounded-full transition-colors ${
                  stepNum < currentStep ? "bg-gray-900" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
