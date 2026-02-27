"use client";

import { Check, Zap } from "lucide-react";
import type { SubscriptionPlan, PlanFeatures } from "@/types/social";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: SubscriptionPlan;
  features: PlanFeatures;
  isCurrentPlan: boolean;
  isRecommended?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading?: boolean;
}

export function PlanCard({
  plan,
  features,
  isCurrentPlan,
  isRecommended = false,
  onSelect,
  isLoading = false,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-shadow",
        isRecommended
          ? "border-gray-900 bg-gray-900 text-white shadow-xl"
          : "border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-md",
      )}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-gray-900">
            <Zap className="h-3 w-3" />
            추천
          </span>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              isRecommended
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-600",
            )}
          >
            현재 플랜
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3
          className={cn(
            "text-lg font-bold",
            isRecommended ? "text-white" : "text-gray-900",
          )}
        >
          {features.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-1">
          {features.price === 0 ? (
            <span
              className={cn(
                "text-3xl font-extrabold",
                isRecommended ? "text-white" : "text-gray-900",
              )}
            >
              무료
            </span>
          ) : (
            <>
              <span
                className={cn(
                  "text-3xl font-extrabold",
                  isRecommended ? "text-white" : "text-gray-900",
                )}
              >
                ${features.price}
              </span>
              <span
                className={cn(
                  "text-sm",
                  isRecommended ? "text-gray-300" : "text-gray-500",
                )}
              >
                /월
              </span>
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-2.5">
        {features.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 flex-shrink-0",
                isRecommended ? "text-yellow-400" : "text-green-500",
              )}
            />
            <span
              className={cn(
                "text-sm",
                isRecommended ? "text-gray-200" : "text-gray-600",
              )}
            >
              {feat}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant={isRecommended ? "secondary" : isCurrentPlan ? "outline" : "default"}
        size="md"
        onClick={() => onSelect(plan)}
        isLoading={isLoading}
        disabled={isCurrentPlan}
        className="w-full"
      >
        {isCurrentPlan
          ? "현재 플랜"
          : features.price === 0
          ? "무료로 시작"
          : "업그레이드"}
      </Button>
    </div>
  );
}
