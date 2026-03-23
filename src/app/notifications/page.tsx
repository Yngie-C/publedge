"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  new_chapter: <BookOpen className="h-5 w-5 text-brand-500" />,
  series_complete: <BookOpen className="h-5 w-5 text-blue-500" />,
  system: <Bell className="h-5 w-5 text-gray-400" />,
};

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const PER_PAGE = 20;

  const load = async (p: number, replace = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&per_page=${PER_PAGE}`);
      if (!res.ok) return;
      const json = await res.json();
      const items: Notification[] = json.data?.notifications ?? [];
      const total: number = json.data?.total ?? 0;
      setNotifications((prev) => (replace ? items : [...prev, ...items]));
      setHasMore(p * PER_PAGE < total);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) load(1, true);
    else setIsLoading(false);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Bell className="h-16 w-16 text-gray-200" />
          <p className="text-lg font-medium text-gray-700">로그인이 필요합니다</p>
          <Button asChild>
            <Link href="/auth/login">로그인</Link>
          </Button>
        </main>
      </div>
    );
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">알림</h1>
          </div>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5"
            >
              <CheckCheck className="h-4 w-4" />
              모두 읽음
            </Button>
          )}
        </div>

        {isLoading && notifications.length === 0 ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <Bell className="mb-4 h-16 w-16 text-gray-200" />
            <p className="text-lg font-semibold text-gray-700">알림이 없습니다</p>
            <p className="mt-1 text-sm text-gray-400">
              시리즈를 구독하면 새 챕터 알림을 받을 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {notifications.map((notification, idx) => {
              const inner = (
                <div
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50",
                    idx > 0 && "border-t border-gray-100",
                    !notification.is_read && "bg-orange-50/40",
                  )}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {TYPE_ICONS[notification.type] ?? TYPE_ICONS.system}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm",
                        notification.is_read
                          ? "font-normal text-gray-600"
                          : "font-semibold text-gray-900",
                      )}
                    >
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="mt-0.5 text-sm text-gray-500">{notification.body}</p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-300">
                      {new Date(notification.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#FF5126]" />
                  )}
                </div>
              );

              return notification.link ? (
                <Link key={notification.id} href={notification.link} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={notification.id}>{inner}</div>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              isLoading={isLoading}
              disabled={isLoading}
            >
              더 보기
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
