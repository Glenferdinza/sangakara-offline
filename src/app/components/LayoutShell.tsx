"use client";

import { useState, useEffect, useCallback } from "react";
import { TopNavbar } from "./TopNavbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { AppProvider } from "../providers/AppProvider";
import { NotificationProvider } from "../providers/NotificationProvider";
import { Toaster } from "sonner";
import { LoginScreen } from "./LoginScreen";
import { Loader2 } from "lucide-react";
import logoKemendikti from "../../imports/kemendikti.svg";
import logoDiktisaintek from "../../imports/diktisaintek.svg";
import logo2045 from "../../imports/2045.svg";
import logoLIDM from "../../imports/lidm.svg";
import logoUNY from "../../imports/uny.svg";
import logoSangkara from "../../imports/sangkara.svg";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Sesi kedaluwarsa jika tidak aktif selama 1 jam (3600 detik)
  const SESSION_TIMEOUT_MS = 3600 * 1000;

  const handleLogout = useCallback(() => {
    localStorage.removeItem("sangkara_auth_status");
    localStorage.removeItem("sangkara_last_active");
    setIsAuthenticated(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    localStorage.setItem("sangkara_auth_status", "true");
    localStorage.setItem("sangkara_last_active", Date.now().toString());
    setIsAuthenticated(true);
  }, []);

  // Check otentikasi di awal mount
  useEffect(() => {
    const authStatus = localStorage.getItem("sangkara_auth_status");
    const lastActive = localStorage.getItem("sangkara_last_active");

    if (authStatus === "true" && lastActive) {
      const timeElapsed = Date.now() - parseInt(lastActive, 10);
      if (timeElapsed > SESSION_TIMEOUT_MS) {
        handleLogout();
      } else {
        setIsAuthenticated(true);
        localStorage.setItem("sangkara_last_active", Date.now().toString());
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [handleLogout]);

  // Event listener untuk reset last active time setiap kali ada interaksi
  useEffect(() => {
    if (isAuthenticated !== true) return;

    const updateActivity = () => {
      localStorage.setItem("sangkara_last_active", Date.now().toString());
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    // Cek berkala setiap 30 detik untuk mendeteksi timeout
    const checkInterval = setInterval(() => {
      const lastActive = localStorage.getItem("sangkara_last_active");
      if (lastActive) {
        const timeElapsed = Date.now() - parseInt(lastActive, 10);
        if (timeElapsed > SESSION_TIMEOUT_MS) {
          handleLogout();
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      clearInterval(checkInterval);
    };
  }, [isAuthenticated, handleLogout]);

  // Mencegah flash screen saat inisialisasi state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#1E3A5F] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  // Tampilkan layar login jika belum terautentikasi
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <NotificationProvider>
      <AppProvider>
        <div className="min-h-screen bg-white flex">
          {/* Sidebar */}
          <Sidebar 
            isSidebarCollapsed={isSidebarCollapsed} 
            setIsSidebarCollapsed={setIsSidebarCollapsed} 
          />

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Navigation Bar - Sticky */}
            <TopNavbar 
              isSidebarCollapsed={isSidebarCollapsed} 
              setIsSidebarCollapsed={setIsSidebarCollapsed} 
              onLogout={handleLogout}
            />

            {/* Page Content */}
            <main className="flex-1 px-2 sm:px-3 md:px-4 py-3 sm:py-4">
              {children}
            </main>

            {/* Penyelenggara & Pendukung Marquee */}
            <div className="w-full bg-white border-t border-gray-200 py-4 sm:py-6 overflow-hidden relative sm:hidden">
              <div className="max-w-[1400px] mx-auto px-4 mb-3">
                <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider text-center">
                  Diselenggarakan & Didukung Oleh:
                </p>
              </div>
              <div className="relative w-full flex items-center">
                {/* Left/Right Fading Gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                {/* Marquee Content */}
                <div className="flex animate-marquee whitespace-nowrap gap-16 sm:gap-24 items-center no-scrollbar">
                  {/* First set of logos */}
                  <img src={typeof logoKemendikti === "string" ? logoKemendikti : logoKemendikti.src} alt="Kemendikti" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                  <img src={typeof logoDiktisaintek === "string" ? logoDiktisaintek : logoDiktisaintek.src} alt="Diktisaintek" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                  <img src={typeof logo2045 === "string" ? logo2045 : logo2045.src} alt="Indonesia Emas 2045" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                  <img src={typeof logoLIDM === "string" ? logoLIDM : logoLIDM.src} alt="LIDM" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                  <img src={typeof logoUNY === "string" ? logoUNY : logoUNY.src} alt="UNY" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />

                  {/* Second set of logos for seamless loop */}
                  <img src={typeof logoKemendikti === "string" ? logoKemendikti : logoKemendikti.src} alt="Kemendikti" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                  <img src={typeof logoDiktisaintek === "string" ? logoDiktisaintek : logoDiktisaintek.src} alt="Diktisaintek" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                  <img src={typeof logo2045 === "string" ? logo2045 : logo2045.src} alt="Indonesia Emas 2045" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                  <img src={typeof logoLIDM === "string" ? logoLIDM : logoLIDM.src} alt="LIDM" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                  <img src={typeof logoUNY === "string" ? logoUNY : logoUNY.src} alt="UNY" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontSize: "14px",
            },
          }}
        />
      </AppProvider>
    </NotificationProvider>
  );
}
