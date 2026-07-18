"use client";

import { useState, useEffect } from "react";
import { Bell, User, Wifi, WifiOff, Loader2, Menu, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { NotificationPopup } from "./NotificationPopup";
import { useNotifications } from "../providers/NotificationProvider";
import { useApp } from "../providers/AppProvider";
import logoKemendikti from "../../imports/kemendikti.svg";
import logoDiktisaintek from "../../imports/diktisaintek.svg";
import logo2045 from "../../imports/2045.svg";
import logoLIDM from "../../imports/lidm.svg";
import logoUNY from "../../imports/uny.svg";
import logoSangkara from "../../imports/sangkara.svg";
import logoSangkaraSmallMedium from "../../imports/sangkara_small_medium.svg";

export function TopNavbar({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  onLogout
}: {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  onLogout?: () => void;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const { unreadCount } = useNotifications();
  const [isScrolled, setIsScrolled] = useState(false);
  const { confirmAction } = useApp();

  const handleLogoutClick = () => {
    if (!onLogout) return;
    confirmAction({
      title: "Konfirmasi Keluar",
      description: "Apakah Anda yakin ingin keluar dari dashboard SANGKARA?",
      confirmText: "Keluar",
      cancelText: "Batal",
      onConfirm: onLogout,
      destructive: true,
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cek koneksi API beneran
  useEffect(() => {
    const checkApi = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/analytics/summary`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        setApiStatus(res.ok ? "online" : "offline");
      } catch {
        setApiStatus("offline");
      }
    };

    checkApi();
    // Re-check setiap 30 detik
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ease-in-out ${
      isScrolled
        ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-md"
        : "bg-white border-b border-gray-200 shadow-none"
    }`}>
      <div className={`mx-auto px-3 sm:px-4 transition-all duration-300 ease-in-out ${
        isScrolled ? "py-1.5 sm:py-2" : "py-2.5 sm:py-3"
      }`}>
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Side - Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition text-[#1E3A5F] md:hidden"
            >
              {isSidebarCollapsed ? (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
            {/* Institution Logos Row */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0 opacity-90">
              <img
                src={typeof logoKemendikti === "string" ? logoKemendikti : logoKemendikti.src}
                alt="Kemendikti Logo"
                className="h-7 sm:h-8 md:h-10 w-auto object-contain"
              />
              <img
                src={typeof logoDiktisaintek === "string" ? logoDiktisaintek : logoDiktisaintek.src}
                alt="Diktisaintek Logo"
                className="hidden sm:block h-7 sm:h-8 md:h-10 w-auto object-contain"
              />
              <img
                src={typeof logo2045 === "string" ? logo2045 : logo2045.src}
                alt="Logo 2045"
                className="hidden sm:block h-7 sm:h-8 md:h-10 w-auto object-contain"
              />
              <img
                src={typeof logoLIDM === "string" ? logoLIDM : logoLIDM.src}
                alt="LIDM Logo"
                className="h-7 sm:h-8 md:h-10 w-auto object-contain"
                style={{ transform: 'scale(1.75)', transformOrigin: 'center', marginLeft: '24px', marginRight: '24px' }}
              />
              <img
                src={typeof logoUNY === "string" ? logoUNY : logoUNY.src}
                alt="UNY Logo"
                className="hidden md:block h-7 sm:h-8 md:h-10 w-auto object-contain"
              />
            </div>

            {/* Vertical Divider */}
            <div className="h-5 sm:h-6 md:h-8 w-px bg-gray-200 self-center mx-1.5 sm:mx-2 md:mx-3" />

            {/* Sangkara Logo & Title */}
            <div className="flex flex-col min-w-0 relative">
              {/* Desktop Logo */}
              <img
                src={typeof logoSangkara === "string" ? logoSangkara : logoSangkara.src}
                alt="Sangkara Logo"
                className="hidden md:block h-9 sm:h-11 md:h-13 w-auto object-contain self-start -ml-2 sm:-ml-3 md:-ml-4"
              />
              {/* Mobile/Tablet Logo */}
              <img
                src={typeof logoSangkaraSmallMedium === "string" ? logoSangkaraSmallMedium : logoSangkaraSmallMedium.src}
                alt="Sangkara Logo"
                className="block md:hidden h-8 sm:h-9 w-auto object-contain self-start -ml-1 sm:-ml-1.5"
              />
              <p className="text-[7.5px] sm:text-[8.5px] md:text-[9.5px] text-gray-500 font-semibold tracking-wide hidden md:block absolute left-1 sm:left-2 md:left-2.5 top-full -mt-2 sm:-mt-3 md:-mt-4 whitespace-nowrap">
                Sistem Analisis Pembelajaran Gamifikasi Remaja
              </p>
            </div>
          </div>

          {/* Right Side - Notifications, Profile, API Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Notification Icon */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative hover:bg-gray-100 p-2 rounded-lg transition text-gray-600"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#F5A623] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* API/Server Status - Real */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border ${apiStatus === "online"
                  ? "bg-green-50 border-green-200"
                  : apiStatus === "offline"
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                }`}
            >
              {apiStatus === "checking" ? (
                <Loader2 className="w-4.5 h-4.5 sm:w-4 sm:h-4 text-gray-400 animate-spin" />
              ) : apiStatus === "online" ? (
                <Wifi className="w-4.5 h-4.5 sm:w-4 sm:h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4.5 h-4.5 sm:w-4 sm:h-4 text-red-500" />
              )}
              <span
                className={`text-xs font-medium hidden sm:inline ${apiStatus === "online"
                    ? "text-green-700"
                    : apiStatus === "offline"
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
              >
                {apiStatus === "checking"
                  ? "Mengecek..."
                  : apiStatus === "online"
                    ? "Server Online"
                    : "Server Offline"}
              </span>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-2 sm:px-3 py-1.5 rounded-lg">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                <AvatarFallback className="bg-[#F5A623] text-white">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-medium text-gray-700">Pamong Pendidik</span>
                <span className="text-[10px] text-gray-500">Administrator</span>
              </div>
              {onLogout && (
                <button
                  onClick={handleLogoutClick}
                  className="ml-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition duration-200 flex items-center justify-center"
                  title="Keluar dari Dashboard"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </nav>
  );
}
