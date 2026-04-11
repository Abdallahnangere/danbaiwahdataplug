/**
 * App Header Component
 * Displays logo, user info, and navigation
 */

import React from "react";
import { Bell, Settings, LogOut } from "lucide-react";
import { BrandColors } from "@/lib/brand";

interface AppHeaderProps {
  userName?: string;
  balance?: number;
  onLogout?: () => void;
  onSettings?: () => void;
}

export function AppHeader({
  userName = "User",
  balance = 0,
  onLogout,
  onSettings,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-white via-white to-cyan-50/30 backdrop-blur-md border-b border-cyan-200/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 hidden sm:block">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-orange-500 rounded-lg opacity-20 blur-lg" />
              <div className="relative w-10 h-10 bg-gradient-to-r from-cyan-400 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-orange-500/50">
                DB
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">
                Hi, {userName.split(" ")[0]}! 👋
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Balance Section */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <div className="text-center">
              <div className="text-xs text-gray-600 font-semibold">Balance</div>
              <div className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent">
                ₦{balance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Balance Badge Mobile */}
            <div className="md:hidden bg-gradient-to-r from-cyan-400/10 to-orange-500/10 border border-cyan-200/30 rounded-lg px-3 py-2">
              <div className="text-xs font-semibold text-gray-500">Balance</div>
              <div className="text-sm font-bold text-gray-900">
                ₦{balance.toLocaleString()}
              </div>
            </div>

            {/* Notification Bell */}
            <button
              className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700" />
            </button>

            {/* Settings Button */}
            {onSettings && (
              <button
                onClick={onSettings}
                className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-700" />
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
