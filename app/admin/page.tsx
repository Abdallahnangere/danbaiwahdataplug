"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Loader2, LogOut, BarChart3, Database, Users } from "lucide-react";
import { toast } from "sonner";
import AnalyticsTab from "./_components/AnalyticsTab";
import DataPlansTab from "./_components/DataPlansTab";
import UsersTab from "./_components/UsersTab";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  bg:         "#07090F",
  bgCard:     "#0F1320",
  bgElevated: "#161B2E",
  blue:       "#3B82F6",
  violet:     "#8B5CF6",
  textPrimary:   "#F1F5FF",
  textSecondary: "#8B93B0",
  textMuted:     "#4B5370",
  border:     "rgba(255,255,255,0.07)",
  green:      "#10B981",
  red:        "#EF4444",
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif';

interface AdminUser {
  id: string;
  role: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"analytics" | "plans" | "users">("analytics");

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          router.push("/app/auth");
          return;
        }
        const data = await res.json();
        
        // Check if admin
        if (data.role !== "ADMIN") {
          router.push("/");
          return;
        }
        
        setUser(data);
      } catch (error) {
        router.push("/app/auth");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/app/auth");
    } catch {
      toast.error("Logout failed");
    }
  };

  if (loading || !user) {
    return (
      <div style={{
        background: T.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        fontFamily: font,
      }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: `linear-gradient(135deg, ${T.blue}, ${T.violet})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 40px rgba(59,130,246,0.3)`,
          }}
        >
          <Loader2 size={36} color="white" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <p style={{ color: T.textSecondary, fontSize: 14, margin: 0, fontFamily: font }}>
          Loading admin dashboard…
        </p>
      </div>
    );
  }

  const TABS = [
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { id: "plans" as const, label: "Data Plans", icon: Database },
    { id: "users" as const, label: "Users", icon: Users },
  ];

  return (
    <div style={{
      background: T.bg,
      color: T.textPrimary,
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      fontFamily: font,
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: "-0.6px",
          }}>
            Admin Panel
          </h1>
          <p style={{
            margin: "4px 0 0",
            fontSize: 13,
            color: T.textSecondary,
          }}>
            Manage your platform
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 8,
            background: T.bgElevated,
            border: `1px solid ${T.border}`,
            color: T.textSecondary,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: font,
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Tab navigation */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        gap: 8,
        overflowX: "auto",
        flexShrink: 0,
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              background: activeTab === id ? T.bgElevated : "transparent",
              border: `1px solid ${activeTab === id ? T.blue : T.border}`,
              color: activeTab === id ? T.blue : T.textSecondary,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: font,
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
      }}>
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "plans" && <DataPlansTab />}
        {activeTab === "users" && <UsersTab />}
      </div>
    </div>
  );
}
