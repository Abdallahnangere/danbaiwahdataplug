"use client";

import { useEffect, useState } from "react";

const T = {
  bgCard: "#0F1320",
  bgElevated: "#161B2E",
  textPrimary: "#F1F5FF",
  textSecondary: "#8B93B0",
  border: "rgba(255,255,255,0.07)",
  green: "#10B981",
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif';

interface BalanceUser {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

export default function BalancesTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [topUsers, setTopUsers] = useState<BalanceUser[]>([]);
  const [asOf, setAsOf] = useState("");

  const fetchData = async (manual = false) => {
    if (!manual && typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/balances", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setTotalUsers(Number(data.totalUsers || 0));
      setTotalBalance(Number(data.totalBalance || 0));
      setTopUsers(Array.isArray(data.topUsers) ? data.topUsers : []);
      setAsOf(String(data.asOf || ""));
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    fetchData();
    timer = setInterval(fetchData, 30000);
    return () => { if (timer) clearInterval(timer); };
  }, []);

  return (
    <div style={{ fontFamily: font }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginBottom: 18 }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: T.textSecondary, fontSize: 12 }}>Total Users</div>
          <div style={{ color: T.textPrimary, fontSize: 30, fontWeight: 800 }}>{totalUsers.toLocaleString()}</div>
        </div>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: T.textSecondary, fontSize: 12 }}>Realtime Wallet Balance</div>
          <div style={{ color: T.green, fontSize: 30, fontWeight: 800 }}>?{totalBalance.toLocaleString()}</div>
          <div style={{ color: T.textSecondary, fontSize: 11, marginTop: 4 }}>
            {asOf ? `As of ${new Date(asOf).toLocaleTimeString("en-NG")}` : ""}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.bgElevated,
            color: T.textPrimary,
            cursor: refreshing ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ color: T.textPrimary, fontWeight: 700, marginBottom: 10 }}>Top Balances</div>
        {loading ? <div style={{ color: T.textSecondary }}>Loading...</div> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {topUsers.map((u) => (
            <div key={u.id} style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: T.textPrimary, fontSize: 13 }}>{u.name}</div>
                <div style={{ color: T.textSecondary, fontSize: 12 }}>{u.phone}</div>
              </div>
              <div style={{ color: T.green, fontWeight: 700 }}>?{u.balance.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
