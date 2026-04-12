"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, Phone, Tv, Zap, BookOpen, Home, History, Settings as SettingsIcon,
  Eye, EyeOff, Copy, Loader2, ChevronRight, X, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  // Backgrounds
  bg:        "#07090F",
  bgCard:    "#0F1320",
  bgElevated:"#161B2E",
  bgGlass:   "rgba(255,255,255,0.05)",

  // Brand
  blue:      "#3B82F6",
  blueMid:   "#6366F1",
  blueLight: "#60A5FA",
  violet:    "#8B5CF6",
  cyan:      "#06B6D4",

  // Text
  textPrimary:   "#F1F5FF",
  textSecondary: "#8B93B0",
  textMuted:     "#4B5370",

  // Borders
  border:      "rgba(255,255,255,0.07)",
  borderStrong:"rgba(255,255,255,0.12)",

  // Status
  green:  "#10B981",
  red:    "#EF4444",
  amber:  "#F59E0B",

  // Service accent palette
  services: {
    data:        { icon: "#3B82F6", glow: "rgba(59,130,246,0.3)",  bg: "rgba(59,130,246,0.1)"  },
    airtime:     { icon: "#EF4444", glow: "rgba(239,68,68,0.3)",   bg: "rgba(239,68,68,0.08)"  },
    cable:       { icon: "#8B5CF6", glow: "rgba(139,92,246,0.3)",  bg: "rgba(139,92,246,0.08)" },
    electricity: { icon: "#F59E0B", glow: "rgba(245,158,11,0.3)",  bg: "rgba(245,158,11,0.08)" },
    exampin:     { icon: "#10B981", glow: "rgba(16,185,129,0.3)",  bg: "rgba(16,185,129,0.08)" },
  },
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif';

// ─── TYPES ───────────────────────────────────────────────────────
interface User {
  id: string;
  fullName: string;
  phone: string;
  balance: number;
  tier: "user" | "agent";
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const ACCOUNT_SERVICES = [
  { id: "transactions", label: "Transactions",  icon: History },
  { id: "settings",    label: "Settings",       icon: SettingsIcon },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function DanbaiwaApp() {
  const router = useRouter();
  const [user, setUser]                         = useState<User | null>(null);
  const [activeTab, setActiveTab]               = useState("home");
  const [balanceVisible, setBalanceVisible]     = useState(true);
  const [loading, setLoading]                   = useState(true);
  const [transactions, setTransactions]         = useState<any[]>([]);
  const [showSettingsModal, setShowSettingsModal]         = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showPinChangeModal, setShowPinChangeModal]       = useState(false);
  const [pinChangeLoading, setPinChangeLoading]           = useState(false);
  const [pinForm, setPinForm]                             = useState({ oldPin: "", newPin: "", confirmPin: "" });
  const [pinError, setPinError]                           = useState("");

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return router.push("/app/auth");
        const data = await res.json();
        setUser(data);
        toast.success(`Welcome back, ${data.fullName.split(" ")[0]}!`);
      } catch {
        router.push("/app/auth");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!showTransactionsModal) return;
    (async () => {
      try {
        const res = await fetch("/api/transactions");
        if (res.ok) {
          const data = await res.json();
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        }
      } catch {}
    })();
  }, [showTransactionsModal]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/app/auth");
    } catch {
      toast.error("Logout failed");
    }
  };

  // ── Loading screen ────────────────────────────────────────────
  if (loading || !user) {
    return (
      <div style={{
        background: T.bg, minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
        fontFamily: font,
      }}>
        {/* Pulsing brand circle */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 80, height: 80, borderRadius: 24,
            background: `linear-gradient(135deg, ${T.blue}, ${T.violet})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 40px ${T.services.data.glow}`,
          }}
        >
          <Loader2 size={36} color="white" />
        </motion.div>
        <p style={{ color: T.textSecondary, fontSize: 14, margin: 0, fontFamily: font }}>
          Securing your session…
        </p>
      </div>
    );
  }

  const SERVICES = [
    { id: "data",        label: "Data",        icon: Wifi,     sc: T.services.data        },
    { id: "airtime",     label: "Airtime",      icon: Phone,    sc: T.services.airtime     },
    { id: "cable",       label: "Cable TV",     icon: Tv,       sc: T.services.cable       },
    { id: "electricity", label: "Power",        icon: Zap,      sc: T.services.electricity },
    { id: "exampin",     label: "Exams",        icon: BookOpen, sc: T.services.exampin     },
  ];

  const NAV = [
    { id: "home",         icon: Home,           label: "Home"         },
    { id: "transactions", icon: History,         label: "Transactions" },
    { id: "settings",     icon: SettingsIcon,    label: "Settings"     },
  ];

  // ── Shared sub-components (inline) ───────────────────────────

  // Modal wrapper
  const Modal = ({
    show, onClose, children,
  }: { show: boolean; onClose: () => void; children: React.ReactNode }) => (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "flex-end",
          }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgCard,
              border: `1px solid ${T.borderStrong}`,
              borderRadius: "28px 28px 0 0",
              padding: "32px 20px calc(env(safe-area-inset-bottom, 16px) + 24px)",
              width: "100%",
              maxHeight: "88vh",
              overflowY: "auto",
              fontFamily: font,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Modal header row
  const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.5px" }}>
        {title}
      </h2>
      <motion.button
        whileTap={{ scale: 0.85 }} onClick={onClose}
        style={{
          background: T.bgElevated, border: `1px solid ${T.border}`,
          borderRadius: 12, width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: T.textSecondary,
        }}
      >
        <X size={18} />
      </motion.button>
    </div>
  );

  // Coming-soon view for service tabs
  const ComingSoon = ({
    icon: Icon, label, color,
  }: { icon: any; label: string; color: string }) => (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ padding: "20px 20px 120px", fontFamily: font }}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setActiveTab("home")}
        style={{
          background: T.bgElevated, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8,
          color: T.blue, fontSize: 14, fontWeight: 600,
          cursor: "pointer", marginBottom: 40, fontFamily: font,
        }}
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 96, height: 96, borderRadius: 28, margin: "0 auto 32px",
            background: `radial-gradient(circle, ${color}22, ${color}08)`,
            border: `1.5px solid ${color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 40px ${color}22`,
          }}
        >
          <Icon size={44} color={color} strokeWidth={1.5} />
        </motion.div>
        <h2 style={{
          margin: "0 0 12px", fontSize: 26, fontWeight: 800,
          color: T.textPrimary, letterSpacing: "-0.6px",
        }}>
          {label} Coming Soon
        </h2>
        <p style={{
          margin: 0, fontSize: 15, color: T.textSecondary, lineHeight: 1.6, maxWidth: 280, marginInline: "auto",
        }}>
          We're crafting something exceptional. Check back shortly!
        </p>
        <div style={{
          marginTop: 40, display: "inline-flex", alignItems: "center", gap: 8,
          background: T.bgElevated, border: `1px solid ${T.border}`,
          borderRadius: 100, padding: "10px 20px",
        }}>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: "50%", background: color }}
          />
          <span style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600 }}>In development</span>
        </div>
      </div>
    </motion.div>
  );

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{
      background: T.bg,
      color: T.textPrimary,
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      fontFamily: font,
      overflowX: "hidden",
      position: "relative",
    }}>

      {/* ── Ambient top glow ── */}
      <div style={{
        position: "fixed", top: -120, left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300,
        background: `radial-gradient(ellipse, ${T.blue}18 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── Safe-area top spacer ── */}
      <div style={{ height: "env(safe-area-inset-top, 16px)", flexShrink: 0 }} />

      {/* ══════════════════ HEADER ══════════════════ */}
      <div style={{
        padding: "16px 20px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "relative", zIndex: 10, flexShrink: 0,
      }}>
        {/* Left: greeting */}
        <div>
          <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontWeight: 500, letterSpacing: "0.2px" }}>
            Welcome back 👋
          </p>
          <h1 style={{
            margin: "2px 0 0", fontSize: 22, fontWeight: 800,
            color: T.textPrimary, letterSpacing: "-0.6px", lineHeight: 1.2,
          }}>
            {user.fullName.split(" ")[0]}
          </h1>
        </div>

        {/* Right: avatar + tier badge */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setShowSettingsModal(true)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 4, background: "transparent", border: "none", cursor: "pointer",
          }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 16,
            background: `linear-gradient(135deg, ${T.blue}, ${T.violet})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 16px ${T.services.data.glow}`,
            fontSize: 15, fontWeight: 800, color: "white", letterSpacing: "-0.5px",
          }}>
            {getInitials(user.fullName)}
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.6px",
            color: user.tier === "agent" ? T.amber : T.blue,
            background: user.tier === "agent" ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.12)",
            borderRadius: 6, padding: "2px 6px",
          }}>
            {user.tier}
          </span>
        </motion.button>
      </div>

      {/* ══════════════════ SCROLLABLE CONTENT ══════════════════ */}
      <div style={{
        flex: 1, overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        position: "relative", zIndex: 5,
      }}>
        <AnimatePresence mode="wait">

          {/* ══ HOME TAB ══ */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ padding: "0 20px 120px" }}
            >

              {/* ── Balance Card ─────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, ease: "easeOut" }}
                style={{
                  borderRadius: 28,
                  padding: "20px 24px",
                  marginBottom: 28,
                  overflow: "hidden",
                  position: "relative",
                  background: `linear-gradient(145deg, #1A237E 0%, #1565C0 40%, #0288D1 75%, #00BCD4 100%)`,
                  boxShadow: `0 24px 64px rgba(0,136,209,0.35), 0 0 0 1px rgba(255,255,255,0.08)`,
                }}
              >
                {/* Decorative orbs */}
                <div style={{
                  position: "absolute", top: -60, right: -60,
                  width: 220, height: 220, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute", bottom: -80, left: -40,
                  width: 200, height: 200, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0,188,212,0.15) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                {/* Shine line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  pointerEvents: "none",
                }} />

                {/* Label */}
                <p style={{
                  margin: "0 0 12px", fontSize: 11, fontWeight: 700,
                  color: "rgba(255,255,255,0.65)", textTransform: "uppercase",
                  letterSpacing: "1.5px", position: "relative",
                }}>
                  Available Balance
                </p>

                {/* Amount row */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 18, position: "relative",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{
                      fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.8)",
                      alignSelf: "flex-start", marginTop: 4,
                    }}>₦</span>
                    <motion.span
                      key={balanceVisible ? "vis" : "hid"}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontSize: 44, fontWeight: 900, color: "white",
                        letterSpacing: "-2px",
                        fontVariantNumeric: "tabular-nums",
                        textShadow: "0 2px 12px rgba(0,0,0,0.2)",
                      }}
                    >
                      {balanceVisible ? user.balance.toLocaleString() : "••••••"}
                    </motion.span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.78 }}
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      border: "1.5px solid rgba(255,255,255,0.35)",
                      borderRadius: 16, width: 50, height: 50,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", cursor: "pointer",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    }}
                  >
                    {balanceVisible
                      ? <Eye size={22} strokeWidth={2} />
                      : <EyeOff size={22} strokeWidth={2} />}
                  </motion.button>
                </div>

                {/* Phone row */}
                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                  paddingTop: 14,
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", position: "relative",
                }}>
                  <div>
                    <p style={{
                      margin: "0 0 5px", fontSize: 10, fontWeight: 700,
                      color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "1px",
                    }}>
                      Registered Phone
                    </p>
                    <p style={{
                      margin: 0, fontSize: 16, fontWeight: 700, color: "white",
                      letterSpacing: "0.5px", fontVariantNumeric: "tabular-nums",
                    }}>
                      {user.phone}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => {
                      navigator.clipboard.writeText(user.phone);
                      toast.success("Phone copied!");
                    }}
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      border: "1.5px solid rgba(255,255,255,0.35)",
                      borderRadius: 12, padding: "9px 16px",
                      color: "white", fontWeight: 700, cursor: "pointer",
                      fontSize: 12, display: "flex", alignItems: "center",
                      gap: 6, backdropFilter: "blur(10px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    }}
                  >
                    <Copy size={13} strokeWidth={2.5} />
                    Copy
                  </motion.button>
                </div>
              </motion.div>

              {/* ── Section label ────────────────────────────── */}
              <p style={{
                margin: "0 0 14px", fontSize: 13, fontWeight: 700,
                color: T.textMuted, textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                Quick Services
              </p>

              {/* ── Services Grid ─────────────────────────────── */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12, marginBottom: 32,
              }}>
                {SERVICES.map((svc, i) => {
                  const Icon = svc.icon;
                  return (
                    <motion.button
                      key={svc.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.05 }}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ y: -3 }}
                      onClick={() => setActiveTab(svc.id)}
                      style={{
                        background: T.bgCard,
                        border: `1px solid ${T.border}`,
                        borderRadius: 20,
                        padding: "20px 10px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 10,
                        cursor: "pointer",
                        boxShadow: `0 4px 20px rgba(0,0,0,0.25)`,
                        transition: "box-shadow 0.2s",
                      }}
                    >
                      {/* Icon bubble */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: svc.sc.bg,
                        border: `1px solid ${svc.sc.icon}22`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 6px 20px ${svc.sc.glow}`,
                      }}>
                        <Icon size={26} color={svc.sc.icon} strokeWidth={2} />
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: T.textSecondary,
                        textAlign: "center", letterSpacing: "0.1px",
                      }}>
                        {svc.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* ── Account section ───────────────────────────── */}
              <p style={{
                margin: "0 0 12px", fontSize: 13, fontWeight: 700,
                color: T.textMuted, textTransform: "uppercase", letterSpacing: "1px",
              }}>
                Account
              </p>
              <div style={{
                background: T.bgCard, borderRadius: 20,
                border: `1px solid ${T.border}`,
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}>
                {ACCOUNT_SERVICES.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (item.id === "transactions") setShowTransactionsModal(true);
                        else setShowSettingsModal(true);
                      }}
                      style={{
                        background: "transparent", border: "none",
                        borderBottom: idx < ACCOUNT_SERVICES.length - 1
                          ? `1px solid ${T.border}` : "none",
                        padding: "18px 16px",
                        display: "flex", alignItems: "center", gap: 14,
                        cursor: "pointer", width: "100%",
                      }}
                    >
                      <div style={{
                        width: 42, height: 42, borderRadius: 13,
                        background: T.bgElevated,
                        border: `1px solid ${T.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={18} color={T.blue} strokeWidth={2} />
                      </div>
                      <span style={{
                        flex: 1, textAlign: "left",
                        fontSize: 15, fontWeight: 600, color: T.textPrimary,
                      }}>
                        {item.label}
                      </span>
                      <ChevronRight size={18} color={T.textMuted} strokeWidth={2} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══ SERVICE TABS (coming soon) ══ */}
          {activeTab === "data" && (
            <ComingSoon key="data" icon={Wifi} label="Data" color={T.services.data.icon} />
          )}
          {activeTab === "airtime" && (
            <ComingSoon key="airtime" icon={Phone} label="Airtime" color={T.services.airtime.icon} />
          )}
          {activeTab === "cable" && (
            <ComingSoon key="cable" icon={Tv} label="Cable TV" color={T.services.cable.icon} />
          )}
          {activeTab === "electricity" && (
            <ComingSoon key="elec" icon={Zap} label="Electricity" color={T.services.electricity.icon} />
          )}
          {activeTab === "exampin" && (
            <ComingSoon key="exam" icon={BookOpen} label="Exam PINs" color={T.services.exampin.icon} />
          )}

        </AnimatePresence>
      </div>

      {/* ══════════════════ BOTTOM NAV ══════════════════ */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: `rgba(7,9,15,0.88)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${T.border}`,
        display: "flex", justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
        paddingTop: 10,
      }}>
        {NAV.map((tab) => {
          const Icon  = tab.icon;
          const isActive = tab.id === "home"
            ? activeTab === "home"
            : false; // nav items open modals so never truly "active"

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.82 }}
              onClick={() => {
                if (tab.id === "home")         setActiveTab("home");
                if (tab.id === "transactions") setShowTransactionsModal(true);
                if (tab.id === "settings")     setShowSettingsModal(true);
              }}
              style={{
                background: "transparent", border: "none",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", padding: "6px 20px",
                gap: 5, flex: 1, position: "relative",
              }}
            >
              {/* Active pill indicator */}
              {isActive && (
                <motion.div
                  layoutId="navPill"
                  style={{
                    position: "absolute", top: -10, left: "50%",
                    transform: "translateX(-50%)",
                    width: 36, height: 3, borderRadius: 99,
                    background: `linear-gradient(90deg, ${T.blue}, ${T.violet})`,
                    boxShadow: `0 0 12px ${T.blue}`,
                  }}
                />
              )}
              <Icon
                size={22}
                color={isActive ? T.blue : T.textMuted}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : 500,
                color: isActive ? T.blue : T.textMuted,
                letterSpacing: "0.2px",
              }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ══════════════════ TRANSACTIONS MODAL ══════════════════ */}
      <Modal show={showTransactionsModal} onClose={() => setShowTransactionsModal(false)}>
        <ModalHeader title="Transactions" onClose={() => setShowTransactionsModal(false)} />

        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22, margin: "0 auto 20px",
              background: T.bgElevated, border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <History size={32} color={T.textMuted} strokeWidth={1.5} />
            </div>
            <p style={{ margin: 0, color: T.textMuted, fontSize: 15, fontWeight: 500 }}>
              No transactions yet
            </p>
            <p style={{ margin: "6px 0 0", color: T.textMuted, fontSize: 13, opacity: 0.6 }}>
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {transactions.map((tx: any, idx: number) => {
              const isSuccess = tx.status === "success";
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{
                    background: T.bgElevated,
                    borderRadius: 16,
                    padding: "16px",
                    border: `1px solid ${T.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 13,
                      background: isSuccess ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <History size={18} color={isSuccess ? T.green : T.red} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                        {tx.description || tx.type}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>
                        {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{
                      margin: "0 0 3px", fontSize: 15, fontWeight: 700,
                      color: isSuccess ? T.green : T.textSecondary,
                    }}>
                      ₦{tx.amount.toLocaleString()}
                    </p>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                      color: isSuccess ? T.green : T.red,
                      background: isSuccess ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      borderRadius: 6, padding: "2px 8px",
                    }}>
                      {tx.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* ══════════════════ SETTINGS MODAL ══════════════════ */}
      <Modal show={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
        <ModalHeader title="Settings" onClose={() => setShowSettingsModal(false)} />

        {/* Profile card */}
        <div style={{
          background: `linear-gradient(135deg, ${T.bgElevated}, ${T.bgCard})`,
          borderRadius: 20, padding: "20px",
          border: `1px solid ${T.border}`,
          marginBottom: 16,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: `linear-gradient(135deg, ${T.blue}, ${T.violet})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "white",
            boxShadow: `0 6px 20px ${T.services.data.glow}`,
            flexShrink: 0,
          }}>
            {getInitials(user.fullName)}
          </div>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: T.textPrimary }}>
              {user.fullName}
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: T.textMuted }}>
              {user.phone}
            </p>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px",
              color: user.tier === "agent" ? T.amber : T.blue,
              background: user.tier === "agent" ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.12)",
              borderRadius: 8, padding: "3px 10px",
            }}>
              {user.tier} account
            </span>
          </div>
        </div>

        {/* Info rows */}
        {[
          { label: "Full Name",    value: user.fullName },
          { label: "Phone Number", value: user.phone    },
          { label: "Account Type", value: user.tier     },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              background: T.bgElevated, borderRadius: 14,
              padding: "14px 16px", marginBottom: 10,
              border: `1px solid ${T.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>
              {row.label}
            </span>
            <span style={{
              fontSize: 14, color: T.textPrimary, fontWeight: 700,
              textTransform: row.label === "Account Type" ? "capitalize" : "none",
            }}>
              {row.value}
            </span>
          </div>
        ))}

        <div style={{ height: 24 }} />

        {/* Change PIN */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { setPinForm({ oldPin: "", newPin: "", confirmPin: "" }); setPinError(""); setShowPinChangeModal(true); }}
          style={{
            width: "100%", border: "none", borderRadius: 18,
            padding: "15px",
            background: `linear-gradient(135deg, ${T.blue}, ${T.blueMid})`,
            color: "white", fontWeight: 700, fontSize: 16,
            cursor: "pointer", letterSpacing: "-0.2px",
            fontFamily: font,
            marginBottom: 12,
            boxShadow: "0 8px 24px rgba(59,130,246,0.3)",
          }}
        >
          Change PIN
        </motion.button>

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleLogout}
          style={{
            width: "100%", border: "none", borderRadius: 18,
            padding: "15px",
            background: "linear-gradient(135deg, #EF4444, #DC2626)",
            color: "white", fontWeight: 700, fontSize: 16,
            cursor: "pointer", letterSpacing: "-0.2px",
            fontFamily: font,
            boxShadow: "0 8px 24px rgba(239,68,68,0.3)",
          }}
        >
          Sign Out
        </motion.button>
      </Modal>

      {/* ══════════════════ CHANGE PIN MODAL ══════════════════ */}
      <Modal show={showPinChangeModal} onClose={() => setShowPinChangeModal(false)}>
        <ModalHeader title="Change PIN" onClose={() => setShowPinChangeModal(false)} />

        <div style={{ padding: "0 0 20px" }}>
          {/* Current PIN */}
          <label style={{ display: "block", marginBottom: 16, fontFamily: font }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: T.textPrimary }}>Current PIN</p>
            <input
              type="password"
              maxLength={6}
              value={pinForm.oldPin}
              onChange={(e) => setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, "") })}
              placeholder="••••••"
              style={{
                width: "100%", padding: "14px 14px", borderRadius: 14,
                border: `1px solid ${T.border}`, background: T.bgElevated,
                color: T.textPrimary, fontSize: 16, fontFamily: font,
                letterSpacing: "2px", textAlign: "center",
                fontWeight: 600,
              }}
            />
          </label>

          {/* New PIN */}
          <label style={{ display: "block", marginBottom: 16, fontFamily: font }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: T.textPrimary }}>New PIN</p>
            <input
              type="password"
              maxLength={6}
              value={pinForm.newPin}
              onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, "") })}
              placeholder="••••••"
              style={{
                width: "100%", padding: "14px 14px", borderRadius: 14,
                border: `1px solid ${T.border}`, background: T.bgElevated,
                color: T.textPrimary, fontSize: 16, fontFamily: font,
                letterSpacing: "2px", textAlign: "center",
                fontWeight: 600,
              }}
            />
          </label>

          {/* Confirm PIN */}
          <label style={{ display: "block", marginBottom: 16, fontFamily: font }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: T.textPrimary }}>Confirm PIN</p>
            <input
              type="password"
              maxLength={6}
              value={pinForm.confirmPin}
              onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, "") })}
              placeholder="••••••"
              style={{
                width: "100%", padding: "14px 14px", borderRadius: 14,
                border: `1px solid ${T.border}`, background: T.bgElevated,
                color: T.textPrimary, fontSize: 16, fontFamily: font,
                letterSpacing: "2px", textAlign: "center",
                fontWeight: 600,
              }}
            />
          </label>

          {/* Error message */}
          {pinError && (
            <div style={{
              padding: "12px 14px", borderRadius: 12,
              background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`,
              marginBottom: 16,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: T.red, fontWeight: 600 }}>{pinError}</p>
            </div>
          )}

          {/* Update PIN button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={async () => {
              if (!pinForm.oldPin || !pinForm.newPin || !pinForm.confirmPin) {
                setPinError("All fields are required");
                return;
              }
              if (pinForm.newPin.length !== 6 || pinForm.oldPin.length !== 6) {
                setPinError("PIN must be 6 digits");
                return;
              }
              if (pinForm.newPin !== pinForm.confirmPin) {
                setPinError("New PINs don't match");
                return;
              }
              if (pinForm.oldPin === pinForm.newPin) {
                setPinError("New PIN must be different from current PIN");
                return;
              }
              setPinChangeLoading(true);
              try {
                const res = await fetch("/api/auth/change-pin", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ currentPin: pinForm.oldPin, newPin: pinForm.newPin }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  setPinError(data.message || "Failed to change PIN");
                  return;
                }
                toast.success("PIN changed successfully");
                setShowPinChangeModal(false);
                setPinForm({ oldPin: "", newPin: "", confirmPin: "" });
                setPinError("");
              } catch (err) {
                setPinError("An error occurred. Please try again.");
              } finally {
                setPinChangeLoading(false);
              }
            }}
            disabled={pinChangeLoading}
            style={{
              width: "100%", border: "none", borderRadius: 18,
              padding: "15px",
              background: pinChangeLoading ? T.textMuted : `linear-gradient(135deg, ${T.green}, #059669)`,
              color: "white", fontWeight: 700, fontSize: 16,
              cursor: pinChangeLoading ? "not-allowed" : "pointer", letterSpacing: "-0.2px",
              fontFamily: font,
              boxShadow: pinChangeLoading ? "none" : "0 8px 24px rgba(16,185,129,0.3)",
              opacity: pinChangeLoading ? 0.6 : 1,
            }}
          >
            {pinChangeLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Loader2 size={18} />
                Updating...
              </div>
            ) : (
              "Update PIN"
            )}
          </motion.button>
        </div>
      </Modal>

    </div>
  );
}
