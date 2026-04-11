"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, Phone, Tv, Zap, BookOpen, Home, History, Settings as SettingsIcon,
  Eye, EyeOff, Copy, Loader2, ChevronRight, X, Lock, Check, AlertCircle, ArrowLeftCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// ============ FINTECH COLOR PALETTE ============
const COLORS = {
  // Primary - Fintech Blue  
  primary: "#0066CC",
  primaryDark: "#004A99",
  
  // Neutrals - Professional grays
  bgMain: "#FAFBFC",
  bgSecondary: "#FFFFFF",
  text: "#0F1419",
  textSecondary: "#525F7F",
  textTertiary: "#738099",
  border: "#E0E6ED",
  
  // Status colors
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  
  // Service brand colors
  dataColor: "#0066CC",
  airtimeColor: "#DC2626",
  cableColor: "#7C3AED",
  electricityColor: "#EA580C",
  examColor: "#059669",
};

const SERVICE_COLORS = {
  data: { color: COLORS.dataColor, bg: "#EEF2FF" },
  airtime: { color: "#DC2626", bg: "#FEE2E2" },
  cable: { color: "#7C3AED", bg: "#F3E8FF" },
  electricity: { color: "#EA580C", bg: "#FFEDD5" },
  exampin: { color: "#059669", bg: "#ECFDF5" },
};

const ACCOUNT_SERVICES = [
  { id: "transactions", label: "Transactions", icon: History },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const NETWORKS = [
  { id: "mtn", name: "MTN", image: "/networks/mtn.jpeg", color: "#FFD100" },
  { id: "airtel", name: "Airtel", image: "/networks/airtel.jpeg", color: "#FF0000" },
  { id: "glo", name: "Glo", image: "/networks/glo.jpeg", color: "#00A554" },
  { id: "9mobile", name: "9Mobile", image: "/networks/9mobile.jpeg", color: "#00A3E0" },
];

const CABLE_PROVIDERS = {
  dstv: { name: "DStv", plans: [
    { id: "padi", name: "Padi", price: 2500 },
    { id: "yanga", name: "Yanga", price: 3500 },
    { id: "confam", name: "Confam", price: 6200 },
    { id: "premium", name: "Premium", price: 24500 },
  ]},
  gotv: { name: "GOtv", plans: [
    { id: "smallie", name: "Smallie", price: 1100 },
    { id: "jinja", name: "Jinja", price: 2250 },
    { id: "jolli", name: "Jolli", price: 3300 },
    { id: "max", name: "Max", price: 4850 },
  ]},
  startimes: { name: "Startimes", plans: [
    { id: "nova", name: "Nova", price: 1950 },
    { id: "nova_plus", name: "Nova Plus", price: 3500 },
    { id: "smart", name: "Smart", price: 5000 },
  ]},
};

const DISCOS = [
  "Ikeja Electric", "Eko Electric", "Abuja Electric", "Kano Electric",
  "Enugu Electric", "Port Harcourt Electric", "Ibadan Electric",
];

const EXAMS = [
  { name: "WAEC", price: 2500 },
  { name: "NECO", price: 3500 },
  { name: "NABTEB", price: 2500 },
];

// ============ TYPES ============
interface User {
  id: string;
  fullName: string;
  phone: string;
  balance: number;
  tier: "user" | "agent";
}

interface DataPlan {
  id: string;
  name: string;
  price: number;
  user_price: number;
  network: string;
  apiSource?: string;
}

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

// ============ MAIN COMPONENT ============
export default function DanbaiwaApp() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  

  const [cableForm, setCableForm] = useState({ provider: "dstv", plan: "padi" });
  const [electricityForm, setElectricityForm] = useState({ meterNumber: "", disco: "Ikeja Electric", meterType: "prepaid" });
  const [examForm, setExamForm] = useState({ exam: "WAEC", quantity: 1 });

  // ============ EFFECTS ============
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return router.push("/app/auth");
        const data = await res.json();
        setUser(data);
        toast.success(`Welcome, ${data.fullName}!`);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/app/auth");
      }
    };

    checkAuth();
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/transactions");
        if (res.ok) {
          const data = await res.json();
          setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        }
      } catch (error) {
        console.error("Transactions error:", error);
      }
    };
    if (showTransactionsModal) fetchTransactions();
  }, [showTransactionsModal]);



  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/app/auth");
    } catch {
      toast.error("Logout failed");
    }
  };



  if (loading || !user) {
    return (
      <div style={{
        background: COLORS.bgMain,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={48} color={COLORS.primary} />
        </motion.div>
      </div>
    );
  }

  const SERVICES = [
    { id: "data", label: "Data", icon: Wifi, color: SERVICE_COLORS.data },
    { id: "airtime", label: "Airtime", icon: Phone, color: SERVICE_COLORS.airtime },
    { id: "cable", label: "Cable", icon: Tv, color: SERVICE_COLORS.cable },
    { id: "electricity", label: "Power", icon: Zap, color: SERVICE_COLORS.electricity },
    { id: "exampin", label: "Exams", icon: BookOpen, color: SERVICE_COLORS.exampin },
  ];



  // ============ RENDER ============
  return (
    <div style={{
      background: COLORS.bgMain,
      color: COLORS.text,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      overflow: "hidden",
    }}>
      {/* STATUS BAR */}
      <div style={{ height: "env(safe-area-inset-top, 20px)", background: "transparent" }} />

      {/* HEADER */}
      <div style={{
        background: COLORS.bgSecondary,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "12px 16px 18px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.5px" }}>
              Hi, {user.fullName.split(" ")[0]} 👋
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: COLORS.textTertiary, fontWeight: 500 }}>
              Welcome back
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLogout}
            style={{
              background: COLORS.bgMain,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 50,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: COLORS.primary,
              fontWeight: 700,
              fontSize: 14,
            }}
            title="Logout"
          >
            {getInitials(user.fullName)}
          </motion.button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ padding: "20px 16px 100px" }}
            >
              {/* FINTECH WALLET CARD - PROFESSIONAL SKY BLUE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{
                  background: `linear-gradient(135deg, #0099FF 0%, #00D4FF 50%, #00CCFF 100%)`,
                  border: "none",
                  borderRadius: 24,
                  padding: "28px",
                  marginBottom: 28,
                  boxShadow: "0 20px 60px rgba(0, 153, 255, 0.25), 0 0 1px rgba(0, 0, 0, 0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Subtle background pattern */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "200px",
                  height: "200px",
                  background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}/>

                <p style={{ 
                  margin: "0 0 16px", 
                  fontSize: 11, 
                  color: "rgba(255,255,255,0.8)", 
                  fontWeight: 700, 
                  textTransform: "uppercase", 
                  letterSpacing: "1px",
                  position: "relative",
                  zIndex: 1,
                }}>
                  Available Balance
                </p>
                
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  marginBottom: 28,
                  position: "relative",
                  zIndex: 1,
                }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    style={{ display: "flex", alignItems: "baseline", gap: 2 }}
                  >
                    <h2 style={{
                      margin: 0,
                      fontSize: 64,
                      fontWeight: 900,
                      color: "white",
                      fontFamily: 'Menlo, monospace',
                      letterSpacing: "-3px",
                      display: "flex",
                      alignItems: "baseline",
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    }}>
                      <span style={{ marginRight: 6, fontSize: 32, fontWeight: 800 }}>₦</span>
                      <span>{balanceVisible ? user.balance.toLocaleString() : "•••••"}</span>
                    </h2>
                  </motion.div>

                  <motion.button
                    whileTap={{ scale: 0.75 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    style={{
                      background: "rgba(255,255,255,0.25)",
                      border: "1.5px solid rgba(255,255,255,0.5)",
                      borderRadius: 14,
                      width: 48,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      cursor: "pointer",
                      backdropFilter: "blur(10px)",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {balanceVisible ? <Eye size={22} strokeWidth={2.5} /> : <EyeOff size={22} strokeWidth={2.5} />}
                  </motion.button>
                </div>

                {/* Card Footer Info */}
                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.3)",
                  paddingTop: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 1,
                }}>
                  <div>
                    <p style={{ 
                      margin: "0 0 6px", 
                      fontSize: 11, 
                      color: "rgba(255,255,255,0.75)", 
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      Registered Phone
                    </p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: 15, 
                      fontWeight: 700, 
                      color: "white",
                      fontFamily: "Menlo, monospace",
                      letterSpacing: "-0.5px",
                    }}>
                      {user.phone}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      navigator.clipboard.writeText(user.phone);
                      toast.success("Phone copied!");
                    }}
                    style={{
                      background: "rgba(255,255,255,0.25)",
                      border: "1.5px solid rgba(255,255,255,0.5)",
                      borderRadius: 12,
                      padding: "8px 14px",
                      color: "white",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      backdropFilter: "blur(10px)",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Copy size={14} strokeWidth={2.5} />
                    Copy
                  </motion.button>
                </div>
              </motion.div>

              {/* SERVICES GRID */}
              {/* SERVICES GRID */}
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.3px" }}>
                Quick Services
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
                {SERVICES.map(service => {
                  const Icon = service.icon;
                  return (
                    <motion.button
                      key={service.id}
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ y: -4 }}
                      onClick={() => setActiveTab(service.id)}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 }}
                      style={{
                        background: `linear-gradient(135deg, ${service.color.bg} 0%, rgba(255,255,255,0.5) 100%)`,
                        border: `2px solid ${service.color.color}`,
                        borderRadius: 18,
                        padding: "22px 16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        boxShadow: `0 4px 16px ${service.color.color}22`,
                      }}
                    >
                      <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        background: service.color.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 4px 12px ${service.color.color}40`,
                      }}>
                        <Icon size={28} color="white" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, textAlign: "center", color: COLORS.text }}>
                        {service.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* ACCOUNT SECTION */}
              <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.3px" }}>
                Account
              </p>
              <div style={{ background: COLORS.bgSecondary, borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)", marginBottom: 28 }}>
                {ACCOUNT_SERVICES.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (item.id === "transactions") setShowTransactionsModal(true);
                        else if (item.id === "settings") setShowSettingsModal(true);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        borderBottom: idx < ACCOUNT_SERVICES.length - 1 ? `1px solid ${COLORS.border}` : "none",
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: COLORS.bgMain,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Icon size={20} color={COLORS.primary} />
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <p style={{ margin: 0, fontWeight: 600, color: COLORS.text, fontSize: 14 }}>
                          {item.label}
                        </p>
                      </div>
                      <ChevronRight size={20} color={COLORS.textTertiary} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* DATA SERVICE - COMING SOON */}
          {activeTab === "data" && (
            <motion.div
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ padding: "20px 16px 100px" }}
            >
              <button
                onClick={() => setActiveTab("home")}
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: COLORS.primary,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 24,
                  fontSize: 14,
                }}
              >
                <ArrowLeftCircle size={20} />
                Back
              </button>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "60px 20px" }}
              >
                <Wifi size={64} color={COLORS.primary} style={{ marginBottom: 24, opacity: 0.4 }} />
                <h2 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 700, color: COLORS.text }}>Data Coming Soon</h2>
                <p style={{ margin: 0, fontSize: 16, color: COLORS.textSecondary, lineHeight: 1.5 }}>
                  We're rebuilding the data purchase experience. Check back soon!
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* AIRTIME - COMING SOON */}
          {activeTab === "airtime" && (
            <motion.div
              key="airtime"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: "20px 16px 100px" }}
            >
              <button
                onClick={() => setActiveTab("home")}
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: COLORS.primary,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: 24,
                  fontSize: 14,
                }}
              >
                <ArrowLeftCircle size={20} />
                Back
              </button>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "60px 20px" }}
              >
                <Phone size={64} color="#DC2626" style={{ marginBottom: 24, opacity: 0.4 }} />
                <h2 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 700, color: COLORS.text }}>Airtime Coming Soon</h2>
                <p style={{ margin: 0, fontSize: 16, color: COLORS.textSecondary, lineHeight: 1.5 }}>
                  We're rebuilding the airtime purchase experience. Check back soon!
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* CABLE, ELECTRICITY, EXAMS - Similar structure */}
          {["cable", "electricity", "exampin"].includes(activeTab) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: "20px 16px 100px", textAlign: "center" }}
            >
              <p style={{ fontSize: 16, color: COLORS.textSecondary }}>
                {activeTab === "cable" && "Cable subscriptions coming soon"}
                {activeTab === "electricity" && "Electricity payments coming soon"}
                {activeTab === "exampin" && "Exam PINs coming soon"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SPACING */}
        <div style={{ height: 20 }} />
      </div>

      {/* BOTTOM NAVIGATION */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: COLORS.bgSecondary,
        borderTop: `1px solid ${COLORS.border}`,
        display: "flex",
        justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        zIndex: 40,
      }}>
        {[
          { id: "home", icon: Home, label: "Home" },
          { id: "transactions", icon: History, label: "Transactions" },
          { id: "settings", icon: SettingsIcon, label: "Settings" },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => {
                if (tab.id === "home") setActiveTab("home");
                else if (tab.id === "transactions") setShowTransactionsModal(true);
                else if (tab.id === "settings") setShowSettingsModal(true);
              }}
              style={{
                background: "transparent",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "8px 16px",
                gap: 4,
                flex: 1,
                position: "relative",
              }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeIndicator"
                  style={{
                    position: "absolute",
                    bottom: -1,
                    width: 32,
                    height: 3,
                    background: COLORS.primary,
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              )}
              <Icon size={22} color={activeTab === tab.id ? COLORS.primary : COLORS.textTertiary} strokeWidth={2} />
              <span style={{ fontSize: 10, fontWeight: activeTab === tab.id ? 700 : 600, color: activeTab === tab.id ? COLORS.primary : COLORS.textTertiary }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* TRANSACTIONS MODAL */}
      <AnimatePresence>
        {showTransactionsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.4)",
            display: "flex", alignItems: "flex-end", zIndex: 100,
          }} onClick={() => setShowTransactionsModal(false)}>
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: COLORS.bgSecondary,
                borderRadius: "24px 24px 0 0",
                padding: "32px 20px 40px",
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>Transaction History</h2>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowTransactionsModal(false)} style={{
                  background: COLORS.bgMain, border: "none", borderRadius: 10, width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.text,
                }}>
                  <X size={20} />
                </motion.button>
              </div>
              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <History size={48} color={COLORS.textTertiary} style={{ marginBottom: 16, opacity: 0.3 }} />
                  <p style={{ margin: 0, color: COLORS.textTertiary, fontSize: 14 }}>No transactions yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {transactions.map((tx: any, idx: number) => (
                    <div key={idx} style={{ background: COLORS.bgMain, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                            {tx.description || tx.type}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: COLORS.textTertiary }}>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: tx.status === "success" ? COLORS.success : COLORS.textSecondary }}>
                            ₦{tx.amount.toLocaleString()}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: tx.status === "success" ? COLORS.success : COLORS.danger, textTransform: "capitalize" }}>
                            {tx.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.4)",
            display: "flex", alignItems: "flex-end", zIndex: 100,
          }} onClick={() => setShowSettingsModal(false)}>
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: COLORS.bgSecondary,
                borderRadius: "24px 24px 0 0",
                padding: "32px 20px 40px",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>Settings</h2>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => setShowSettingsModal(false)} style={{
                  background: COLORS.bgMain, border: "none", borderRadius: 10, width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.text,
                }}>
                  <X size={20} />
                </motion.button>
              </div>
              <div style={{ background: COLORS.bgMain, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: COLORS.textTertiary, fontWeight: 700, textTransform: "uppercase" }}>Name</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.text }}>{user.fullName}</p>
              </div>
              <div style={{ background: COLORS.bgMain, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${COLORS.border}` }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: COLORS.textTertiary, fontWeight: 700, textTransform: "uppercase" }}>Phone</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.text }}>{user.phone}</p>
              </div>
              <div style={{ background: COLORS.bgMain, borderRadius: 12, padding: 16, marginBottom: 24, border: `1px solid ${COLORS.border}` }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: COLORS.textTertiary, fontWeight: 700, textTransform: "uppercase" }}>Account Tier</p>
                <div style={{ background: COLORS.primary + "20", border: `1.5px solid ${COLORS.primary}40`, borderRadius: 8, padding: 12, display: "flex", alignItems: "center" }}>
                  <span style={{ textTransform: "uppercase", fontWeight: 700, color: COLORS.primary, fontSize: 13 }}>
                    {user.tier}
                  </span>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout} style={{
                background: COLORS.danger, border: "none", borderRadius: 12, padding: "16px", color: "white",
                fontWeight: 700, fontSize: 16, cursor: "pointer", width: "100%", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
              }}>
                Logout
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
