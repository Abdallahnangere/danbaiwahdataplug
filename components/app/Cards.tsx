/**
 * Enhanced Card Components for App
 * Premium cards with gradients and modern styling
 */

import React from "react";
import { BrandColors } from "@/lib/brand";

export interface CardProps {
  gradient: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: string;
  onClick?: () => void;
  badge?: {
    label: string;
    color: string;
  };
  stats?: {
    label: string;
    value: string | number;
  }[];
  loading?: boolean;
}

export function PremiumCard({
  gradient,
  icon,
  title,
  subtitle,
  action,
  onClick,
  badge,
  stats,
  loading = false,
}: CardProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group relative overflow-hidden rounded-2xl p-6 text-left w-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
        loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl backdrop-blur-sm">
            {icon}
          </div>
          {badge && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <h3 className="font-bold text-white text-lg mb-1">{title}</h3>
        <p className="text-white/80 text-sm mb-4">{subtitle}</p>

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="flex gap-4 mb-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-white/70 text-xs font-semibold">
                  {stat.label}
                </span>
                <span className="text-white font-bold text-lg">{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action */}
        {action && (
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            {action}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        )}
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
    </button>
  );
}

export function ServiceCard({
  gradient,
  icon,
  title,
  description,
  onClick,
  loading = false,
}: {
  gradient: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`rounded-xl border border-gray-200 bg-white p-4 hover:border-cyan-300 hover:shadow-lg transition-all duration-300 text-left ${
        loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {/* Icon Background */}
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 text-xl`}
      >
        {icon}
      </div>

      {/* Text */}
      <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
      <p className="text-gray-600 text-xs leading-relaxed">{description}</p>
    </button>
  );
}

export function BalanceCard({
  balance,
  onFundWallet,
}: {
  balance: number;
  onFundWallet?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-orange-500 p-8 text-white shadow-2xl shadow-orange-500/30">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-white/80 font-semibold text-sm mb-2">
            Wallet Balance
          </p>
          <h2 className="text-4xl font-black tracking-tight">
            ₦{balance.toLocaleString()}
          </h2>
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center text-3xl backdrop-blur-sm border border-white/20">
          💳
        </div>
      </div>

      {/* Fund Wallet Button */}
      {onFundWallet && (
        <button
          onClick={onFundWallet}
          className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          + Fund Wallet
        </button>
      )}
    </div>
  );
}

export function QuickActionGrid({
  items,
}: {
  items: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
  }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={item.onClick}
          className={`p-4 rounded-xl border-2 border-gray-200 hover:border-current hover:shadow-lg transition-all duration-300 text-center`}
          style={{ "--hover-color": item.color } as React.CSSProperties}
        >
          <div className={`text-3xl mb-2 ${item.color}`}>{item.icon}</div>
          <p className="font-semibold text-xs text-gray-900">{item.label}</p>
        </button>
      ))}
    </div>
  );
}
