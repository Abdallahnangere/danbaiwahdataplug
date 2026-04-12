"use client";

import { useEffect, useState } from "react";

import { Loader2, Search } from "lucide-react";
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
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  balance: number;
  tier: string;
  createdAt: string;
}

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch users");
        const json = await res.json();
        // Ensure json is an array
        if (Array.isArray(json)) {
          setUsers(json);
        } else {
          throw new Error("Invalid users data");
        }
      } catch (error) {
        toast.error("Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) => {
      const emailLower = String(user.email || "").toLowerCase();
      const fullNameLower = String(user.fullName || "").toLowerCase();
      const queryLower = searchQuery.toLowerCase();
      return emailLower.includes(queryLower) || fullNameLower.includes(queryLower);
    }
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px", fontFamily: font }}>
        <Loader2 size={32} style={{ color: T.blue, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: font }}>
      {/* Search */}
      <div style={{ marginBottom: 20, position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
          <Search size={18} color={T.textMuted} />
        </div>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px 10px 40px",
            borderRadius: 8,
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            color: T.textPrimary,
            fontSize: 14,
            fontFamily: font,
          }}
        />
      </div>

      {/* Users table */}
      <div style={{
        padding: 20,
        borderRadius: 12,
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        overflowX: "auto",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          minWidth: "700px",
        }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>
                Email
              </th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>
                Name
              </th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>
                Phone
              </th>
              <th style={{ padding: "12px 8px", textAlign: "right", color: T.textMuted, fontWeight: 600 }}>
                Balance
              </th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>
                Tier
              </th>
              <th style={{ padding: "12px 8px", textAlign: "left", color: T.textMuted, fontWeight: 600 }}>
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id || Math.random()}
                style={{ borderBottom: `1px solid ${T.border}` }}
              >
                <td style={{ padding: "12px 8px", color: T.textSecondary }}>{user.email || "—"}</td>
                <td style={{ padding: "12px 8px", color: T.textSecondary }}>{user.fullName || "—"}</td>
                <td style={{ padding: "12px 8px", color: T.textSecondary }}>{user.phone || "—"}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", color: T.textPrimary, fontWeight: 600 }}>
                  ₦{(user.balance || 0).toLocaleString()}
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: (user.tier || "user") === "user" ? `${T.blue}20` : `${T.textSecondary}20`,
                      color: (user.tier || "user") === "user" ? T.blue : T.textSecondary,
                      textTransform: "capitalize",
                    }}
                  >
                    {user.tier || "user"}
                  </span>
                </td>
                <td style={{ padding: "12px 8px", color: T.textMuted, fontSize: 12 }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </td>
                </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{
            padding: "40px 20px",
            textAlign: "center",
            color: T.textSecondary,
          }}>
            {searchQuery ? "No users match your search" : "No users yet"}
          </div>
        )}
      </div>
    </div>
  );
}
