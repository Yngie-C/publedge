"use client";

import Link from "next/link";
import { Bell, CheckCheck, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  new_chapter: <BookOpen className="h-4 w-4 text-brand-500" />,
  series_complete: <BookOpen className="h-4 w-4 text-blue-500" />,
  system: <Bell className="h-4 w-4 text-gray-400" />,
};

export function NotificationDropdown({
  notifications,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-gray-900">알림</span>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            모두 읽음
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="mb-2 h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-400">알림이 없습니다</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const content = (
              <div
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50",
                  !notification.is_read && "bg-orange-50/50",
                )}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {TYPE_ICONS[notification.type] ?? TYPE_ICONS.system}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      notification.is_read ? "font-normal text-gray-600" : "font-medium text-gray-900",
                    )}
                  >
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
                      {notification.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-300">
                    {new Date(notification.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                {!notification.is_read && (
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#FF5126]" />
                )}
              </div>
            );

            return notification.link ? (
              <Link
                key={notification.id}
                href={notification.link}
                onClick={onClose}
                className="block border-b border-gray-50 last:border-0"
              >
                {content}
              </Link>
            ) : (
              <div key={notification.id} className="border-b border-gray-50 last:border-0">
                {content}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2.5">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block text-center text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            전체 알림 보기
          </Link>
        </div>
      )}
    </div>
  );
}
