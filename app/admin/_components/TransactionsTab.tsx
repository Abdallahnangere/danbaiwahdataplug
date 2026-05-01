"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const T = {
  bgCard: "#0F1320",
  bgElevated: "#161B2E",
  border: "rgba(255,255,255,0.07)",
  textPrimary: "#F1F5FF",
  textSecondary: "#8B93B0",
  textMuted: "#4B5370",
  green: "#10B981",
  red: "#EF4444",
  amber: "#F59E0B",
  blue: "#3B82F6",
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif';

export default function TransactionsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const fetchRows = async (nextPage = 1, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: "20", ...(status && { status }), ...(category && { category }), ...(search && { search }) });
      const res = await fetch(`/api/admin/transactions?${params}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : [];
      setRows((prev) => (append ? [...prev, ...list] : list));
      setTotal(Number(data.total || 0));
      setHasMore(!!data.hasMore);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(1, false);
  }, [status, category, search]);

  const statusColor = (s: string) => s === "SUCCESS" ? T.green : s === "FAILED" ? T.red : T.amber;

  return (
    <div style={{ padding: "20px 0", fontFamily: font }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 9, borderRadius: 8, background: T.bgCard, border: `1px solid ${T.border}`, color: T.textPrimary }}>
          <option value="">All Categories</option>
          <option value="DATA">Data</option>
          <option value="AIRTIME">Airtime</option>
          <option value="DEPOSIT">Deposit</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 9, borderRadius: 8, background: T.bgCard, border: `1px solid ${T.border}`, color: T.textPrimary }}>
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ref/phone/name" style={{ padding: 9, borderRadius: 8, background: T.bgCard, border: `1px solid ${T.border}`, color: T.textPrimary }} />
      </div>

      {loading && rows.length === 0 ? <div style={{ textAlign: "center", padding: 24 }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: T.blue }} /></div> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((tx) => (
          <div key={tx.id} style={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto", gap: 8 }}>
            <div>
              <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 700 }}>{tx.user_name || "Unknown User"} • {tx.user_phone || "N/A"}</div>
              <div style={{ color: T.textSecondary, fontSize: 12 }}>{tx.plan_name || tx.category} • {tx.network_name || "N/A"} • {tx.target || "N/A"}</div>
              <div style={{ color: T.textMuted, fontSize: 11 }}>{new Date(tx.created_at).toLocaleString("en-NG")}</div>
            </div>
            <div style={{ color: T.textPrimary, fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.reference || "—"}</div>
            <div style={{ color: T.green, fontWeight: 700, textAlign: "right" }}>₦{Number(tx.amount || 0).toLocaleString()}</div>
            <span style={{ alignSelf: "start", background: `${statusColor(String(tx.status || "PENDING"))}22`, color: statusColor(String(tx.status || "PENDING")), borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{String(tx.status || "PENDING").toUpperCase()}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, color: T.textSecondary, fontSize: 12 }}>
        <span>Showing {rows.length} of {total}</span>
        <button onClick={() => fetchRows(page + 1, true)} disabled={!hasMore || loading} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgCard, color: T.textPrimary, cursor: !hasMore ? "not-allowed" : "pointer", opacity: !hasMore ? 0.5 : 1 }}>
          {loading ? "Loading..." : hasMore ? "Load More" : "End"}
        </button>
      </div>
    </div>
  );
}
