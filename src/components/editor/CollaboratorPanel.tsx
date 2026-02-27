"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Clock,
  CheckCircle2,
  Shield,
  Eye,
  MessageCircle,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Collaborator, CollaboratorRole } from "@/types/social";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CollaboratorPanelProps {
  bookId: string;
  ownerId: string;
}

const ROLE_CONFIG: Record<
  CollaboratorRole,
  { label: string; icon: React.ReactNode; color: string }
> = {
  editor: {
    label: "편집자",
    icon: <Shield className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-700",
  },
  viewer: {
    label: "뷰어",
    icon: <Eye className="h-3 w-3" />,
    color: "bg-gray-100 text-gray-600",
  },
  commenter: {
    label: "댓글 작성자",
    icon: <MessageCircle className="h-3 w-3" />,
    color: "bg-purple-100 text-purple-700",
  },
};

async function fetchCollaborators(bookId: string): Promise<Collaborator[]> {
  const res = await fetch(`/api/books/${bookId}/collaborators`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch collaborators");
  const json = await res.json();
  return json.data ?? [];
}

async function inviteCollaborator(
  bookId: string,
  email: string,
  role: CollaboratorRole,
): Promise<Collaborator> {
  const res = await fetch(`/api/books/${bookId}/collaborators`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to invite collaborator");
  return json.data;
}

async function removeCollaborator(
  bookId: string,
  userId: string,
): Promise<void> {
  const res = await fetch(
    `/api/books/${bookId}/collaborators?userId=${encodeURIComponent(userId)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to remove collaborator");
}

export function CollaboratorPanel({ bookId, ownerId }: CollaboratorPanelProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const queryKey = ["collaborators", bookId];
  const isOwner = user?.id === ownerId;

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("editor");
  const [inviteError, setInviteError] = useState("");

  const { data: collaborators = [], isLoading } = useQuery<Collaborator[]>({
    queryKey,
    queryFn: () => fetchCollaborators(bookId),
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteCollaborator(bookId, email, role),
    onSuccess: (newCollab) => {
      queryClient.setQueryData<Collaborator[]>(queryKey, (old = []) => [
        ...old,
        newCollab,
      ]);
      setEmail("");
      setInviteError("");
    },
    onError: (err: Error) => {
      setInviteError(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeCollaborator(bookId, userId),
    onSuccess: (_, userId) => {
      queryClient.setQueryData<Collaborator[]>(queryKey, (old = []) =>
        old.filter((c) => c.user_id !== userId),
      );
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setInviteError("이메일을 입력하세요");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError("올바른 이메일 형식을 입력하세요");
      return;
    }
    setInviteError("");
    inviteMutation.mutate();
  };

  const pending = collaborators.filter((c) => !c.accepted);
  const accepted = collaborators.filter((c) => c.accepted);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">협업자</h3>
        <span className="ml-auto text-xs text-gray-400">
          {collaborators.length}명
        </span>
      </div>

      {/* Invite form (owner only) */}
      {isOwner && (
        <form onSubmit={handleInvite} className="space-y-3">
          <Input
            label="이메일로 초대"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="collaborator@example.com"
            error={inviteError}
          />
          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CollaboratorRole)}
              className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            >
              {(Object.keys(ROLE_CONFIG) as CollaboratorRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_CONFIG[r].label}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              size="sm"
              isLoading={inviteMutation.isPending}
              className="gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="h-3.5 w-3.5" />
              초대
            </Button>
          </div>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <p className="text-xs text-gray-400 text-center py-2">불러오는 중...</p>
      )}

      {/* Accepted collaborators */}
      {accepted.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            협업 중
          </p>
          {accepted.map((collab) => (
            <CollaboratorRow
              key={collab.id}
              collab={collab}
              isOwner={isOwner}
              onRemove={(userId) => removeMutation.mutate(userId)}
              isRemoving={
                removeMutation.isPending &&
                removeMutation.variables === collab.user_id
              }
            />
          ))}
        </div>
      )}

      {/* Pending invites */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            초대 대기 중
          </p>
          {pending.map((collab) => (
            <CollaboratorRow
              key={collab.id}
              collab={collab}
              isOwner={isOwner}
              onRemove={(userId) => removeMutation.mutate(userId)}
              isRemoving={
                removeMutation.isPending &&
                removeMutation.variables === collab.user_id
              }
              isPending
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && collaborators.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Users className="h-8 w-8 text-gray-200" />
          <p className="text-xs text-gray-400">아직 협업자가 없습니다</p>
          {isOwner && (
            <p className="text-xs text-gray-400">
              이메일로 협업자를 초대해보세요
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface CollaboratorRowProps {
  collab: Collaborator;
  isOwner: boolean;
  onRemove: (userId: string) => void;
  isRemoving: boolean;
  isPending?: boolean;
}

function CollaboratorRow({
  collab,
  isOwner,
  onRemove,
  isRemoving,
  isPending = false,
}: CollaboratorRowProps) {
  const displayName =
    collab.user_profile?.display_name ?? "알 수 없는 사용자";
  const initial = displayName[0]?.toUpperCase() ?? "U";
  const roleConf = ROLE_CONFIG[collab.role];

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
      {/* Avatar */}
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold overflow-hidden">
        {collab.user_profile?.avatar_url ? (
          <img
            src={collab.user_profile.avatar_url}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {displayName}
        </p>
      </div>

      {/* Status */}
      {isPending ? (
        <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
          <Clock className="h-3 w-3" />
          대기
        </span>
      ) : (
        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          활성
        </span>
      )}

      {/* Role badge */}
      <span
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          roleConf.color,
        )}
      >
        {roleConf.icon}
        {roleConf.label}
      </span>

      {/* Remove button (owner only) */}
      {isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(collab.user_id)}
          isLoading={isRemoving}
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
          aria-label="협업자 제거"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
