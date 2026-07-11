"use client";

import { Bell, CheckCircle, AlertCircle, Info, XCircle, Trash2 } from "lucide-react";
import { useNotifications } from "../providers/NotificationProvider";
import type { AppNotification } from "../providers/NotificationProvider";

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPopup({ isOpen, onClose }: NotificationPopupProps) {
  const { notifications, unreadCount, markAllRead, clearNotifications } =
    useNotifications();

  if (!isOpen) return null;

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleOpen = () => {
    markAllRead();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => {
          onClose();
          handleOpen();
        }}
      />

      {/* Popup Card */}
      <div className="fixed sm:absolute top-12 sm:top-14 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-lg shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="text-xs bg-[#F5A623] text-white px-2 py-1 rounded-full">
                  {unreadCount} Baru
                </span>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1 hover:bg-gray-200 rounded transition"
                  title="Hapus semua notifikasi"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Belum ada notifikasi</p>
              <p className="text-xs text-gray-400 mt-1">
                Notifikasi akan muncul saat ada aktivitas
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
            <button
              onClick={() => {
                markAllRead();
                onClose();
              }}
              className="w-full text-center text-sm text-[#1E3A5F] font-medium hover:text-[#F5A623] transition"
            >
              Tandai Semua Dibaca
            </button>
          </div>
        )}
      </div>
    </>
  );
}
