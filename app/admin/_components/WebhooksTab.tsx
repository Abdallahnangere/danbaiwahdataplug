"use client";

import { useEffect, useState } from "react";

const T = {
  bgCard: "#0F1320",
  bgElevated: "#161B2E",
  textPrimary: "#F1F5FF",
  textSecondary: "#8B93B0",
  border: "rgba(255,255,255,0.07)",
  blue: "#3B82F6",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
};

type WebhookRow = {
  id: string;
  provider: string;
  event_ref: string | null;
  signature_valid: boolean | null;
  processing_status: string;
  processing_error: string | null;
  user_id: string | null;
  credited_amount: number | null;
  received_at: string;
  processed_at: string | null;
  payload: unknown;
};

function statusColor(status: string): string {
  const s = status.toUpperCase();
  if (s === "PROCESSED") return T.green;
  if (s === "ERROR" || s === "REJECTED") return T.red;
  if (s === "DUPLICATE" || s === "IGNORED") return T.yellow;
  return T.blue;
}

export default function WebhooksTab() {
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/webhooks?limit=200", { credentials: "include" });
      const data = await res.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 20, fontWeight: 700 }}>Webhook Events</h2>
        <button
          onClick={load}
          disabled={loading}
          style={{
            border: `1px solid ${T.border}`,
            background: T.bgElevated,
            color: T.textPrimary,
            borderRadius: 8,
            padding: "8px 12px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", background: T.bgCard }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr style={{ background: T.bgElevated }}>
                {["Time", "Status", "Event Ref", "Signature", "User", "Credited", "Error"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: 12, color: T.textSecondary, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: 12, color: T.textPrimary, fontSize: 12 }}>{new Date(r.received_at).toLocaleString()}</td>
                  <td style={{ padding: 12, color: statusColor(r.processing_status), fontSize: 12, fontWeight: 700 }}>{r.processing_status}</td>
                  <td style={{ padding: 12, color: T.textPrimary, fontSize: 12 }}>{r.event_ref || "-"}</td>
                  <td style={{ padding: 12, color: T.textPrimary, fontSize: 12 }}>
                    {r.signature_valid === null ? "-" : r.signature_valid ? "valid" : "invalid"}
                  </td>
                  <td style={{ padding: 12, color: T.textPrimary, fontSize: 12 }}>{r.user_id || "-"}</td>
                  <td style={{ padding: 12, color: T.textPrimary, fontSize: 12 }}>
                    {r.credited_amount === null ? "-" : `₦${Number(r.credited_amount).toLocaleString()}`}
                  </td>
                  <td style={{ padding: 12, color: T.red, fontSize: 12 }}>{r.processing_error || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
