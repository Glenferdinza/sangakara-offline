"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface AppNotification {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
  time: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "time">) => void;
  clearNotifications: () => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return ctx;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 10) return "Baru saja";
  if (diffSec < 60) return `${diffSec} detik yang lalu`;
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  return date.toLocaleDateString("id-ID");
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "time">) => {
      const newNotif: AppNotification = {
        ...n,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        time: formatTimeAgo(new Date()),
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
    },
    []
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        clearNotifications,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
