"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Wifi, Phone, Tv, Zap, BookOpen, Home, History, Settings as SettingsIcon,
  Eye, EyeOff, Copy, Loader2, ChevronRight, X, ArrowLeft, Check,
} from "lucide-react";
import { toast } from "sonner";
import PinInput from "@/components/PinInput";
import SuccessCheck from "@/components/SuccessCheck";

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

  // Buy-Data Flow State
  const [buyDataStage, setBuyDataStage] = useState(1);
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<any | null>(null);
  const [phone, setPhone] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState(["", "", "", "", "", ""]);
  const [buyDataLoading, setBuyDataLoading] = useState(false);
  const [buyDataError, setBuyDataError] = useState("");
  const [successData, setSuccessData] = useState<any | null>(null);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
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
        const res = await fetch("/api/transactions", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        }
      } catch {}
    })();
  }, [showTransactionsModal]);

  // Load networks when data tab is accessed
  useEffect(() => {
    if (activeTab !== "data") return;

    if (networks.length === 0) {
      (async () => {
        try {
          const res = await fetch("/api/data/networks");
          if (res.ok) {
            const data = await res.json();
            setNetworks(data);
          }
        } catch (error) {
          toast.error("Failed to load networks");
        }
      })();
    }
  }, [activeTab, networks.length]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
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

  // Buy Data component for the data tab
  const BuyDataCard = () => {
    // Load plans when stage 2 is entered
    useEffect(() => {
      if (buyDataStage !== 2 || plans.length > 0) return;

      (async () => {
        setBuyDataLoading(true);
        try {
          const res = await fetch(`/api/data/plans?networkId=${selectedNetwork.id}`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          setPlans(data);
        } catch {
          toast.error("Couldn't load plans. Check your connection.");
          setBuyDataStage(1);
        } finally {
          setBuyDataLoading(false);
        }
      })();
    }, [buyDataStage]);

    // Progress indicator component
    const ProgressIndicator = () => (
      <div style={{
        display: "flex", gap: 6, justifyContent: "center", marginBottom: 24,
      }}>
        {[1, 2, 3, 4].map((stage) => (
          <motion.div
            key={stage}
            animate={{
              background: stage < buyDataStage ? T.blue : stage === buyDataStage ? T.blue : T.border,
              scale: stage === buyDataStage ? 1.2 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              cursor: "pointer", opacity: stage <= buyDataStage ? 1 : 0.3,
            }}
            onClick={() => {
              if (stage < buyDataStage) setBuyDataStage(stage);
            }}
            aria-label={`Step ${stage} of 4`}
          />
        ))}
      </div>
    );

    // Skeleton loader for plan cards
    const PlanSkeleton = () => (
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          padding: 16,
          borderRadius: 16,
          background: T.bgElevated,
          border: `1px solid ${T.border}`,
          height: 100,
        }}
      />
    );

    // Stage 1: Network + Phone Input
    if (buyDataStage === 1) {
      const phoneIsValid = phone.length === 11 && /^\d{11}$/.test(phone);
      const canContinue = selectedNetwork !== null && phoneIsValid;

      return (
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            padding: "20px 20px 120px",
            fontFamily: font,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ProgressIndicator />

          <h2 style={{
            margin: "0 0 20px", fontSize: 22, fontWeight: 800,
            color: T.textPrimary, letterSpacing: "-0.5px",
          }}>
            Select Network
          </h2>

          {/* Network selector - 2x2 grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28,
          }}>
            {networks.map((net) => {
              const isSelected = selectedNetwork?.id === net.id;
              return (
                <motion.button
                  key={net.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedNetwork(net)}
                  style={{
                    position: "relative",
                    padding: 16,
                    borderRadius: 16,
                    background: isSelected ? `${T.blue}15` : T.bgCard,
                    border: `2px solid ${isSelected ? T.blue : T.border}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    fontFamily: font,
                  }}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <img src={net.logo} alt={net.name} style={{ width: 28, height: 28 }} />
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: T.textPrimary,
                    textAlign: "center",
                  }}>
                    {net.name}
                  </span>

                  {/* Checkmark badge */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: T.blue,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          <h2 style={{
            margin: "0 0 16px", fontSize: 16, fontWeight: 700,
            color: T.textPrimary,
          }}>
            Recipient Phone Number
          </h2>

          {/* Phone input with counter */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              style={{
                width: "100%",
                padding: "12px 40px 12px 14px",
                borderRadius: 12,
                background: T.bgCard,
                border: `1.5px solid ${phoneIsValid ? T.green : T.border}`,
                color: T.textPrimary,
                fontSize: 16,
                fontFamily: font,
                boxSizing: "border-box",
                transition: "all 150ms ease",
              }}
            />

            {/* Checkmark icon when valid */}
            {phoneIsValid && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <Check size={20} color={T.green} strokeWidth={3} />
              </motion.div>
            )}

            {/* Character counter */}
            <div style={{
              fontSize: 12,
              color: phoneIsValid ? T.green : T.textMuted,
              textAlign: "right",
              marginTop: 6,
              fontWeight: 500,
              transition: "color 150ms ease",
            }}>
              {phone.length}/11
            </div>
          </div>

          {/* Continue button */}
          <motion.button
            whileHover={canContinue ? { scale: 1.01 } : {}}
            whileTap={canContinue ? { scale: 0.98 } : {}}
            onClick={() => canContinue && setBuyDataStage(2)}
            disabled={!canContinue}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              background: canContinue ? T.blue : T.bgElevated,
              border: `1.5px solid ${canContinue ? T.blue : T.border}`,
              color: canContinue ? "#fff" : T.textMuted,
              fontSize: 16,
              fontWeight: 600,
              cursor: canContinue ? "pointer" : "not-allowed",
              opacity: canContinue ? 1 : 0.5,
              fontFamily: font,
              transition: "all 150ms ease",
            }}
            aria-disabled={!canContinue}
          >
            Continue
          </motion.button>
        </motion.div>
      );
    }

    // Stage 2: Plan Selection
    if (buyDataStage === 2) {
      return (
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            padding: "20px 20px 120px",
            fontFamily: font,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ProgressIndicator />

          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setBuyDataStage(1)}
            style={{
              background: T.bgElevated,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: T.blue,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 24,
              fontFamily: font,
            }}
          >
            <ArrowLeft size={16} /> Back
          </motion.button>

          <h2 style={{
            margin: "0 0 20px",
            fontSize: 22,
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: "-0.5px",
          }}>
            Select Plan
          </h2>

          {buyDataLoading ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}>
              {[...Array(4)].map((_, i) => (
                <PlanSkeleton key={i} />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: T.textSecondary,
            }}>
              {/* SVG icon placeholder */}
              <motion.svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                style={{ margin: "0 auto 16px", opacity: 0.5 }}
              >
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" />
                <path d="M 30 35 L 50 45 L 30 55" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </motion.svg>
              <p style={{ fontSize: 15, margin: "0 0 8px", fontWeight: 500 }}>
                No plans available
              </p>
              <p style={{ fontSize: 13, margin: 0, color: T.textMuted }}>
                for {selectedNetwork?.name} right now.
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}>
              {plans.map((plan) => (
                <motion.button
                  key={plan.id}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setBuyDataStage(3);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: T.bgCard,
                    border: `1.5px solid ${T.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    fontFamily: font,
                    textAlign: "left",
                  }}
                  role="radio"
                >
                  <div style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: T.textPrimary,
                    letterSpacing: "-0.3px",
                  }}>
                    {plan.sizeLabel}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: T.textMuted,
                    fontWeight: 500,
                  }}>
                    {plan.validity}
                  </div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: T.blue,
                    marginTop: 4,
                  }}>
                    ₦{(plan.price || 0).toLocaleString()}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      );
    }

    // Stage 3: PIN Confirmation & Summary
    if (buyDataStage === 3) {
      const pinFull = pinInput.every((d) => d !== "");

      const handlePinSubmit = async () => {
        if (!pinFull) return;

        setBuyDataLoading(true);
        setBuyDataError("");

        try {
          // Validate PIN
          const validateRes = await fetch("/api/data/validate-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ pin: pinInput.join("") }),
          });

          if (!validateRes.ok) {
            const error = await validateRes.json();
            setBuyDataError(error.error || "Incorrect PIN. Please try again.");
            setPinInput(["", "", "", "", "", ""]);
            setBuyDataLoading(false);
            return;
          }

          // PIN valid, now purchase
          const purchaseRes = await fetch("/api/data/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              planId: selectedPlan.id,
              phone,
              pin: pinInput.join(""),
            }),
          });

          if (!purchaseRes.ok) {
            const error = await purchaseRes.json();
            if (error.error?.includes("Insufficient balance")) {
              setBuyDataError("Insufficient balance. Please fund your wallet.");
            } else if (error.error?.includes("refunded")) {
              toast.error("Delivery failed. Your balance has been refunded.");
              setBuyDataError("Delivery failed. Your balance has been refunded.");
            } else {
              toast.error("Something went wrong. Please try again.");
              setBuyDataError(error.error || "Purchase failed");
            }
            setPinInput(["", "", "", "", "", ""]);
            setBuyDataLoading(false);
            return;
          }

          const data = await purchaseRes.json();
          toast.success(`₦${(data.amount || 0).toLocaleString()} — ${selectedPlan.sizeLabel} sent to ${phone} ✓`);
          setSuccessData(data);
          setPinInput(["", "", "", "", "", ""]);
          setBuyDataStage(4);
        } catch (error: any) {
          toast.error("Something went wrong. Please try again.");
          setBuyDataError(error.message || "An error occurred");
          setPinInput(["", "", "", "", "", ""]);
        } finally {
          setBuyDataLoading(false);
        }
      };

      return (
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            padding: "20px 20px 120px",
            fontFamily: font,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ProgressIndicator />

          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setBuyDataStage(2);
              setPinInput(["", "", "", "", "", ""]);
              setBuyDataError("");
            }}
            style={{
              background: T.bgElevated,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: T.blue,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 24,
              fontFamily: font,
            }}
          >
            <ArrowLeft size={16} /> Back
          </motion.button>

          <h2 style={{
            margin: "0 0 20px",
            fontSize: 22,
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: "-0.5px",
          }}>
            Confirm Purchase
          </h2>

          {/* Summary receipt */}
          <div style={{
            background: T.bgElevated,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Phone</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{phone}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Network</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{selectedNetwork?.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Plan</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{selectedPlan?.sizeLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Validity</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{selectedPlan?.validity}</span>
            </div>

            {/* Divider */}
            <div style={{
              height: 1,
              background: T.border,
              margin: "16px 0",
            }} />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.textSecondary, fontWeight: 600, fontSize: 14 }}>Amount</span>
              <span style={{ color: T.green, fontWeight: 700, fontSize: 18 }}>
                ₦{(selectedPlan?.price || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* PIN Input */}
          <label style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: T.textSecondary,
            marginBottom: 12,
          }}>
            Enter your 6-digit PIN
          </label>

          <div style={{ marginBottom: 16 }}>
            <PinInput
              value={pinInput}
              onChange={setPinInput}
              error={buyDataError.length > 0}
              disabled={buyDataLoading}
              bgColor={T.bgCard}
              bgElevated={T.bgElevated}
              borderColor={T.border}
              borderStrong={T.borderStrong}
              textPrimary={T.textPrimary}
              textSecondary={T.textSecondary}
              errorColor={T.red}
              blueColor={T.blue}
            />
          </div>

          {/* Error display */}
          {buyDataError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: `${T.red}20`,
                border: `1px solid ${T.red}50`,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                color: T.red,
                fontSize: 13,
                fontWeight: 500,
              }}
              role="alert"
            >
              {buyDataError}
            </motion.div>
          )}

          {/* Confirm & Pay button */}
          <motion.button
            whileTap={pinFull && !buyDataLoading ? { scale: 0.98 } : {}}
            onClick={handlePinSubmit}
            disabled={!pinFull || buyDataLoading}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              background: pinFull && !buyDataLoading ? T.blue : T.bgElevated,
              border: "none",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: pinFull && !buyDataLoading ? "pointer" : "not-allowed",
              opacity: pinFull && !buyDataLoading ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: font,
              transition: "all 150ms ease",
            }}
            aria-disabled={!pinFull || buyDataLoading}
          >
            {buyDataLoading && (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            )}
            {buyDataLoading ? "Processing..." : "Confirm & Pay"}
          </motion.button>
        </motion.div>
      );
    }

    // Stage 4: Success
    if (buyDataStage === 4) {
      return (
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            padding: "20px 20px 120px",
            fontFamily: font,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ProgressIndicator />

          <div style={{ textAlign: "center" }}>
            <SuccessCheck greenColor={T.green} size={80} />

            <h2 style={{
              margin: "0 0 12px",
              fontSize: 26,
              fontWeight: 800,
              color: T.textPrimary,
              letterSpacing: "-0.6px",
            }}>
              Data Delivered!
            </h2>
            <p style={{
              margin: "0 0 28px",
              fontSize: 14,
              color: T.textSecondary,
              lineHeight: 1.6,
            }}>
              Your {selectedPlan?.sizeLabel} has been sent to {phone}
            </p>

            {/* Receipt summary */}
            <div style={{
              background: T.bgElevated,
              borderRadius: 16,
              padding: 20,
              marginBottom: 28,
              border: `1px solid ${T.border}`,
              textAlign: "left",
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>
                  Reference
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: T.textPrimary,
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                }}>
                  {successData?.reference}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>
                  Amount Paid
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>
                  ₦{(successData?.amount || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>
                  Date
                </div>
                <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>
                  {new Date().toLocaleDateString("en-NG", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Done button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setBuyDataStage(1);
                setSelectedNetwork(null);
                setPhone("");
                setSelectedPlan(null);
                setPinInput(["", "", "", "", "", ""]);
                setBuyDataError("");
                setSuccessData(null);
                setPlans([]);
                setActiveTab("home");
              }}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                background: T.blue,
                border: "none",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 12,
                fontFamily: font,
              }}
            >
              Done
            </motion.button>

            {/* Buy Again button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setBuyDataStage(1);
                setSelectedPlan(null);
                setPinInput(["", "", "", "", "", ""]);
                setBuyDataError("");
                setSuccessData(null);
                setPlans([]);
              }}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                background: "transparent",
                border: `1.5px solid ${T.blue}`,
                color: T.blue,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              Buy Again
            </motion.button>
          </div>
        </motion.div>
      );
    }

    return null;
  };

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
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span style={{
                      fontSize: 44, fontWeight: 700, color: "rgba(255,255,255,0.8)",
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
                      {balanceVisible ? user.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
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

          {/* ══ SERVICE TABS ══ */}
          {activeTab === "data" && (
            <BuyDataCard />
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
              inputMode="numeric"
              maxLength={6}
              autoFocus
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
              inputMode="numeric"
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
              inputMode="numeric"
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
                  credentials: "include",
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
