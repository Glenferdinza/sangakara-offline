"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "bank-soal", label: "Bank Soal", icon: BookOpen, href: "/bank-soal" },
  { id: "kelola-materi", label: "Kelola Materi", icon: FileText, href: "/kelola-materi" },
  { id: "laporan", label: "Laporan", icon: BarChart3, href: "/laporan" },
];

export function Sidebar({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed 
}: { 
  isSidebarCollapsed: boolean, 
  setIsSidebarCollapsed: (v: boolean) => void 
}) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const shouldShowContent = !isSidebarCollapsed || isHovered;

  const handleToggleClick = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    // Reset hover state when manually toggling
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    // Only allow hover to expand if collapsed
    if (isSidebarCollapsed) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-60 md:hidden" 
          onClick={handleToggleClick} 
        />
      )}

      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`bg-[#1E3A5F] text-white transition-all duration-300 z-70 flex-shrink-0 fixed inset-y-0 left-0 md:relative md:inset-y-auto md:z-auto md:left-auto ${
          shouldShowContent 
            ? "translate-x-0 w-64 md:w-56 lg:w-64 shadow-2xl md:shadow-none" 
            : "-translate-x-full md:translate-x-0 w-64 md:w-16"
        }`}
      >
        <div className="flex flex-col sticky top-0 h-screen border-r border-gray-300 overflow-y-auto">
          {/* Mobile Header with Close Button */}
          <div className="p-3 flex justify-end border-b border-white/10 md:hidden flex-shrink-0">
            <button
              onClick={handleToggleClick}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Toggle Button - Hidden on mobile because it's in TopNavbar */}
          <div className="p-3 justify-end border-b border-white/10 hidden md:flex">
            <button
              onClick={handleToggleClick}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            {shouldShowContent ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setIsSidebarCollapsed(true);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                  isActive
                    ? "bg-[#F5A623] text-white shadow-sm"
                    : "hover:bg-white/5 text-gray-200"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {shouldShowContent && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {shouldShowContent && (
          <div className="p-4 border-t border-white/10 mt-auto">
            <p className="text-xs text-gray-300 text-center">
              SANGKARA v1.0
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Kompetisi LIDM 2026
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
