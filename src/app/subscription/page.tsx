"use client";

import { useState } from "react";
import { CreditCard, X } from "lucide-react";
import { PLAN_FEATURES } from "@/types/social";
import type { SubscriptionPlan } from "@/types/social";
import { PlanCard } from "@/components/subscription/PlanCard";
import { UsageDisplay } from "@/components/subscription/UsageDisplay";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";

export default function SubscriptionPage() {
  const { subscription, isLoading, updatePlan, isUpdating } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const plans = Object.entries(PLAN_FEATURES) as [
    SubscriptionPlan,
    (typeof PLAN_FEATURES)[SubscriptionPlan],
  ][];

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan === subscription?.plan) return;
    if (plan === "free") {
      updatePlan(plan);
    } else {
      setSelectedPlan(plan);
    }
  };

  const handleConfirmUpgrade = () => {
    if (!selectedPlan) return;
    updatePlan(selectedPlan);
    setSelectedPlan(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Page header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-900 mb-4">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">구독 플랜</h1>
        <p className="mt-2 text-gray-500 max-w-xl mx-auto">
          나에게 맞는 플랜을 선택하고 Publedge의 모든 기능을 활용하세요.
        </p>
        {subscription && (
          <p className="mt-3 text-sm font-medium text-gray-700">
            현재 플랜:{" "}
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-0.5 text-white text-xs font-semibold">
              {PLAN_FEATURES[subscription.plan].name}
            </span>
          </p>
        )}
      </div>

      {/* Usage */}
      {subscription && (
        <div className="mb-10 max-w-md mx-auto">
          <UsageDisplay subscription={subscription} />
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map(([plan, features]) => (
          <PlanCard
            key={plan}
            plan={plan}
            features={features}
            isCurrentPlan={subscription?.plan === plan}
            isRecommended={plan === "premium"}
            onSelect={handleSelectPlan}
            isLoading={isUpdating && selectedPlan === plan}
          />
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-8 text-center text-sm text-gray-400">
          플랜 정보를 불러오는 중...
        </div>
      )}

      {/* Coming soon notice */}
      <p className="mt-10 text-center text-xs text-gray-400">
        * 결제 기능은 준비 중입니다. 현재는 플랜 변경이 즉시 적용됩니다.
      </p>

      {/* Upgrade confirmation modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">플랜 업그레이드</h2>
              <button
                onClick={() => setSelectedPlan(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              <strong>{PLAN_FEATURES[selectedPlan].name}</strong> 플랜으로
              업그레이드하시겠습니까?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              월 ${PLAN_FEATURES[selectedPlan].price}이 청구됩니다.
              <br />
              <span className="text-xs text-gray-400">
                * 결제 기능은 현재 준비 중으로, 플랜이 즉시 적용됩니다.
              </span>
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setSelectedPlan(null)}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleConfirmUpgrade}
                isLoading={isUpdating}
              >
                업그레이드
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
