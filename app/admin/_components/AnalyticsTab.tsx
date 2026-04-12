"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  bgCard:     "#0F1320",
  bgElevated: "#161B2E",
  blue:       "#3B82F6",
  textPrimary:   "#F1F5FF",
  textSecondary: "#8B93B0",
  textMuted:     "#4B5370",
  border:     "rgba(255,255,255,0.07)",
  green:      "#10B981",
  red:        "#EF4444",
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif';

interface AnalyticsData {
  totalUsers: number;
  totalRevenue: number;
  successRate: number;
  recentTransactions: Array<{
    id: string;
    user: { email: string };
    plan: { name: string };
    phone: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/admin/analytics", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json();
        setData(json);
      } catch (error) {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px", fontFamily: font }}>
        <Loader2 size={32} style={{ color: T.blue, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!data) {
    return <div style={{ color: T.textSecondary, fontFamily: font }}>Failed to load analytics</div>;
  }

  const STAT_CARDS = [
    { label: "Total Users", value: data.totalUsers.toLocaleString(), color: T.blue },
    { label: "Total Revenue", value: `₦${(data.totalRevenue || 0).toLocaleString()}`, color: T.green },
    { label: "Transactions", value: (data.recentTransactions?.length || 0).toString(), color: "#8B5CF6" },
    { label: "Success Rate", value: `${(data.successRate || 0).toFixed(1)}%`, color: "#F59E0B" },
  ];

  return (
    <div style={{ fontFamily: font }}>
      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              padding: 20,
              borderRadius: 12,
              background: T.bgCard,
              border: `1px solid ${T.border}`,
            }}
          >
            <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 8, fontWeight: 500 }}>
              {card.label}
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 800,
              color: card.color,
              letterSpacing: "-0.5px",
            }}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent transactions */}
      <div style={{
        padding: 20,
        borderRadius: 12,
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        overflowX: "auto",
      }}>
        <h3 style={{
          margin: "0 0 20px",
          fontSize: 18,
          fontWeight: 700,
          color: T.textPrimary,
        }}>
          Recent Transactions
        </h3>

        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>Email</th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>Plan</th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>Phone</th>
              <th style={{ padding: "12px 8px", textAlign: "right", color: T.textMuted, fontWeight: 600 }}>Amount</th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>Status</th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recentTransactions.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "12px 8px", color: T.textSecondary }}>{tx.user.email}</td>
                <td style={{ padding: "12px 8px", color: T.textSecondary }}>{tx.plan.name}</td>
                <td style={{ padding: "12px 8px", color: T.textSecondary }}>{tx.phone}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", color: T.textPrimary, fontWeight: 600 }}>
                  ₦{(tx.amount || 0).toLocaleString()}
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: tx.status === "successful" ? `${T.green}20` : `${T.red}20`,
                    color: tx.status === "successful" ? T.green : T.red,
                  }}>
                    {tx.status}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", color: T.textMuted, fontSize: 12 }}>
                  {new Date(tx.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.recentTransactions.length === 0 && (
          <div style={{
            padding: "40px 20px",
            textAlign: "center",
            color: T.textSecondary,
          }}>
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
}
