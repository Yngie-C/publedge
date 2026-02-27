"use client";

import { UserPlus, UserMinus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowerCount?: number;
}

async function fetchFollowState(targetUserId: string): Promise<{
  isFollowing: boolean;
  followerCount: number;
}> {
  const res = await fetch(
    `/api/follows?targetUserId=${encodeURIComponent(targetUserId)}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to fetch follow state");
  const json = await res.json();
  return json.data;
}

async function toggleFollow(
  targetUserId: string,
  isFollowing: boolean,
): Promise<void> {
  const res = await fetch("/api/follows", {
    method: isFollowing ? "DELETE" : "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ following_id: targetUserId }),
  });
  if (!res.ok) throw new Error("Failed to toggle follow");
}

export function FollowButton({
  targetUserId,
  initialFollowerCount = 0,
}: FollowButtonProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ["follows", targetUserId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchFollowState(targetUserId),
    enabled: !!user,
    initialData: { isFollowing: false, followerCount: initialFollowerCount },
    staleTime: 1000 * 30,
  });

  const mutation = useMutation({
    mutationFn: () => toggleFollow(targetUserId, data.isFollowing),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: typeof data) => ({
        isFollowing: !old.isFollowing,
        followerCount: old.isFollowing
          ? old.followerCount - 1
          : old.followerCount + 1,
      }));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKey, context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  if (!user || user.id === targetUserId) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={data.isFollowing ? "outline" : "default"}
        size="sm"
        onClick={() => mutation.mutate()}
        isLoading={isLoading || mutation.isPending}
        className="gap-1.5"
      >
        {data.isFollowing ? (
          <>
            <UserMinus className="h-3.5 w-3.5" />
            팔로잉
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5" />
            팔로우
          </>
        )}
      </Button>
      <span className="text-sm text-gray-500">
        팔로워 {data.followerCount.toLocaleString()}
      </span>
    </div>
  );
}
