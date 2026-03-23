"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

interface SubscribeButtonProps {
  seriesId: string;
  initialSubscribed?: boolean;
}

export function SubscribeButton({ seriesId, initialSubscribed = false }: SubscribeButtonProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setIsLoading(true);
    try {
      if (isSubscribed) {
        const res = await fetch(`/api/series/${seriesId}/subscribe`, {
          method: "DELETE",
        });
        if (res.ok) setIsSubscribed(false);
      } else {
        const res = await fetch(`/api/series/${seriesId}/subscribe`, {
          method: "POST",
        });
        if (res.ok) setIsSubscribed(true);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      isLoading={isLoading}
      disabled={isLoading}
      variant={isSubscribed ? "secondary" : "default"}
      className="flex items-center gap-2"
    >
      {isSubscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          구독중
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          구독하기
        </>
      )}
    </Button>
  );
}
