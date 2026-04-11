"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, Phone, Tv, Zap, BookOpen, Home, History, Gift, Settings as SettingsIcon,
  Eye, EyeOff, Copy, Loader2, ChevronRight, AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { LogoIcon } from "@/components/Logo";

// ============ NATIVE iOS COLORS ============
const COLORS = {
  // iOS system colors
  primary: "#007AFF",      // iOS Blue
  secondary: "#FF9500",    // iOS Orange
  success: "#34C759",      // iOS Green
  danger: "#FF3B30",       // iOS Red
  warning: "#FF9500",      // iOS Orange
  
  // iOS backgrounds
  bg: "#FFFFFF",
  bgSecondary: "#F2F2F7",
  bgTertiary: "#FFFFFF",
  
  // iOS text
  text: "#000000",
  textSecondary: "#3C3C43",
  textTertiary: "#8E8E93",
  
  // iOS borders
  separator: "#C6C6C6",
  
  // Dark mode support
  darkBg: "#000000",
  darkBgSecondary: "#1C1C1E",
  darkText: "#FFFFFF",
};

const SERVICES = [
  { id: "home", label: "Home", icon: Home },
  { id: "data", label: "Data", icon: Wifi },
  { id: "airtime", label: "Airtime", icon: Phone },
  { id: "cable", label: "Cable", icon: Tv },
  { id: "electricity", label: "Power", icon: Zap },
  { id: "exampin", label: "Exams", icon: BookOpen },
];

const ACCOUNT_SERVICES = [
  { id: "transactions", label: "Transactions", icon: History },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const NETWORKS = [
  { id: "mtn", name: "MTN", image: "/networks/mtn.jpeg", color: "#FFCC00" },
  { id: "airtel", name: "Airtel", image: "/networks/airtel.jpeg", color: "#FF3333" },
  { id: "glo", name: "Glo", image: "/networks/glo.jpeg", color: "#22C55E" },
  { id: "9mobile", name: "9Mobile", image: "/networks/9mobile.jpeg", color: "#00A859" },
];

const CABLE_PROVIDERS = {
  dstv: {
    name: "DStv",
    plans: [
      { id: "padi", name: "Padi", price: 2500 },
      { id: "yanga", name: "Yanga", price: 3500 },
      { id: "confam", name: "Confam", price: 6200 },
      { id: "premium", name: "Premium", price: 24500 },
    ],
  },
  gotv: {
    name: "GOtv",
    plans: [
      { id: "smallie", name: "Smallie", price: 1100 },
      { id: "jinja", name: "Jinja", price: 2250 },
      { id: "jolli", name: "Jolli", price: 3300 },
      { id: "max", name: "Max", price: 4850 },
    ],
  },
  startimes: {
    name: "Startimes",
    plans: [
      { id: "nova", name: "Nova", price: 1950 },
      { id: "nova_plus", name: "Nova Plus", price: 3500 },
      { id: "smart", name: "Smart", price: 5000 },
    ],
  },
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
}

// ============ MAIN COMPONENT ============
export default function NativeIOSDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");
  
  // Airtime form
  const [airtimeForm, setAirtimeForm] = useState({ recipientPhone: "", amount: 100, network: "mtn" });
  
  // Cable form
  const [cableForm, setCableForm] = useState({ provider: "dstv", plan: "padi" });
  
  // Electricity form
  const [electricityForm, setElectricityForm] = useState({ meterNumber: "", disco: "Ikeja Electric", meterType: "prepaid" });
  
  // Exam form
  const [examForm, setExamForm] = useState({ exam: "WAEC", quantity: 1 });

  // ============ EFFECTS ============
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/app/auth");
          return;
        }
        const data = await res.json();
        setUser(data);
        toast.success(`Welcome, ${data.fullName}!`);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/app/auth");
      }
    };

    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/data/plans");
        if (!res.ok) throw new Error("Failed to fetch plans");
        const data = await res.json();
        setPlans(Array.isArray(data.plans) ? data.plans : []);
      } catch (error) {
        console.error("Plans error:", error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchPlans();
  }, [router]);

  // ============ HANDLERS ============
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/app/auth");
    } catch {
      toast.error("Logout failed");
    }
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(user?.phone || "");
    toast.success("Phone copied!");
  };

  const handleAirtimePurchase = async () => {
    if (!airtimeForm.recipientPhone || !airtimeForm.amount) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      const res = await fetch("/api/airtime/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerPhone: user?.phone,
          recipientPhone: airtimeForm.recipientPhone,
          amount: airtimeForm.amount,
          network: airtimeForm.network,
          pin: "000000",
        }),
      });
      if (res.ok) {
        toast.success("Airtime purchased!");
        setAirtimeForm({ recipientPhone: "", amount: 100, network: "mtn" });
      } else {
        const data = await res.json();
        toast.error(data.error || "Purchase failed");
      }
    } catch (error) {
      toast.error("Request failed");
    }
  };

  const handleCableSubscribe = async () => {
    try {
      const res = await fetch("/api/cable/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: cableForm.provider.toUpperCase(),
          smartcardNumber: "_",
          planId: cableForm.plan,
        }),
      });
      if (res.ok) {
        toast.success("Cable subscription successful!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Subscription failed");
      }
    } catch (error) {
      toast.error("Request failed");
    }
  };

  const handleElectricityPay = async () => {
    if (!electricityForm.meterNumber) {
      toast.error("Please enter meter number");
      return;
    }
    try {
      const validateRes = await fetch("/api/electricity/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meterNumber: electricityForm.meterNumber,
          disco: electricityForm.disco,
          meterType: electricityForm.meterType,
        }),
      });
      
      if (validateRes.ok) {
        toast.success("Meter validated!");
        setElectricityForm({ meterNumber: "", disco: "Ikeja Electric", meterType: "prepaid" });
      } else {
        const error = await validateRes.json();
        toast.error(error.error || "Validation failed");
      }
    } catch (error) {
      toast.error("Request failed");
    }
  };

  const handleExamPinPurchase = async () => {
    try {
      const res = await fetch("/api/exampin/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examName: examForm.exam,
          quantity: examForm.quantity,
        }),
      });
      if (res.ok) {
        toast.success("Exam PINs purchased!");
        setExamForm({ exam: "WAEC", quantity: 1 });
      } else {
        const data = await res.json();
        toast.error(data.error || "Purchase failed");
      }
    } catch (error) {
      toast.error("Request failed");
    }
  };

  if (loading || !user) {
    return (
      <div style={{
        background: COLORS.bg,
        color: COLORS.text,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={48} color={COLORS.primary} />
        </motion.div>
      </div>
    );
  }

  const TabIcon = ({ id, Icon }: { id: string; Icon: any }) => (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => setActiveTab(id)}
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
      }}
    >
      <Icon
        size={24}
        color={activeTab === id ? COLORS.primary : COLORS.textTertiary}
        strokeWidth={activeTab === id ? 2.5 : 2}
      />
      <span style={{
        fontSize: 10,
        fontWeight: activeTab === id ? 600 : 500,
        color: activeTab === id ? COLORS.primary : COLORS.textTertiary,
      }}>
        {SERVICES.find(s => s.id === id)?.label || ""}
      </span>
    </motion.button>
  );

  // ============ RENDER ============
  return (
    <div style={{
      background: COLORS.bgSecondary,
      color: COLORS.text,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      overflow: "hidden",
    }}>
      {/* STATUS BAR SPACING */}
      <div style={{ height: "env(safe-area-inset-top, 20px)", background: COLORS.bg }} />

      {/* TOP NAVIGATION */}
      <div style={{
        background: COLORS.bg,
        borderBottom: `1px solid ${COLORS.separator}`,
        padding: "12px 16px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: -0.5,
          }}>
            {activeTab === "home" ? "Danbaiwa" : SERVICES.find(s => s.id === activeTab)?.label}
          </h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleLogout}
          style={{
            background: COLORS.bgSecondary,
            border: "none",
            borderRadius: 50,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: COLORS.danger,
            fontWeight: 600,
            fontSize: 18,
          }}
          title="Logout"
        >
          ←
        </motion.button>
      </div>

      {/* CONTENT AREA */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}>
        <AnimatePresence mode="wait">
          {/* HOME TAB */}
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              {/* BALANCE CARD */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary}, #5B7EFF)`,
                  borderRadius: 24,
                  padding: "24px",
                  color: "white",
                  marginBottom: 20,
                  boxShadow: "0 10px 30px rgba(0, 122, 255, 0.2)",
                }}
              >
                <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 500, opacity: 0.9 }}>
                  Available Balance
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: 44,
                    fontWeight: 700,
                    fontFamily: 'Menlo, monospace',
                  }}>
                    {balanceVisible ? `₦${user.balance.toLocaleString()}` : "••••••"}
                  </h2>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    style={{
                      background: "rgba(255, 255, 255, 0.3)",
                      border: "none",
                      borderRadius: 20,
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    {balanceVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                  </motion.button>
                </div>
                <div style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.3)",
                  paddingTop: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}>
                  <div>
                    <p style={{ margin: "0 0 4px", opacity: 0.8 }}>Phone</p>
                    <p style={{ margin: 0, fontWeight: 600 }}>{user.phone}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={copyPhone}
                    style={{
                      background: "rgba(255, 255, 255, 0.2)",
                      border: "none",
                      borderRadius: 10,
                      padding: "8px 12px",
                      color: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Copy
                  </motion.button>
                </div>
              </motion.div>

              {/* QUICK ACTIONS */}
              <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>Services</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
                {SERVICES.slice(1).map(service => {
                  const Icon = service.icon;
                  return (
                    <motion.button
                      key={service.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(service.id)}
                      style={{
                        background: COLORS.bgTertiary,
                        border: `1px solid ${COLORS.separator}`,
                        borderRadius: 16,
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: COLORS.bgSecondary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Icon size={28} color={COLORS.primary} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>{service.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* ACCOUNT SECTION */}
              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>My Account</h3>
              {ACCOUNT_SERVICES.map(item => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (item.id === "transactions") router.push("/app/dashboard/transactions");
                      else if (item.id === "rewards") router.push("/app/dashboard/rewards");
                      else if (item.id === "settings") router.push("/app/dashboard/settings");
                    }}
                    style={{
                      background: COLORS.bgTertiary,
                      border: "none",
                      borderBottom: `1px solid ${COLORS.separator}`,
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    <Icon size={24} color={COLORS.primary} />
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>{item.label}</p>
                    </div>
                    <ChevronRight size={20} color={COLORS.textTertiary} />
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {/* DATA TAB */}
          {activeTab === "data" && (
            <motion.div
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700 }}>Select Network</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
                {NETWORKS.map(net => (
                  <motion.button
                    key={net.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedNetwork(net.id);
                      toast.success(`${net.name} selected`);
                    }}
                    style={{
                      background: selectedNetwork === net.id ? `${COLORS.primary}15` : COLORS.bgTertiary,
                      border: `2px solid ${selectedNetwork === net.id ? COLORS.primary : COLORS.separator}`,
                      borderRadius: 16,
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                    }}
                  >
                    <Image
                      src={net.image}
                      alt={net.name}
                      width={40}
                      height={40}
                      style={{ borderRadius: 8, objectFit: "contain" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{net.name}</span>
                  </motion.button>
                ))}
              </div>

              <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700 }}>Available Plans</h3>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <Loader2 size={32} style={{ margin: "0 auto", animation: "spin 1s linear infinite" }} />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {plans.filter(p => p.network.toLowerCase() === selectedNetwork).map(plan => (
                    <motion.button
                      key={plan.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        toast.loading("Processing...");
                        router.push(`/app/checkout?plan=${plan.id}&network=${selectedNetwork}`);
                      }}
                      style={{
                        background: COLORS.bgTertiary,
                        border: `1px solid ${COLORS.separator}`,
                        borderRadius: 16,
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{plan.name}</p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.textTertiary }}>Plan</p>
                      </div>
                      <p style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 16,
                        color: COLORS.primary,
                        fontFamily: 'Menlo, monospace',
                      }}>
                        ₦{(plan.user_price || plan.price).toLocaleString()}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* AIRTIME TAB */}
          {activeTab === "airtime" && (
            <motion.div
              key="airtime"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <div style={{ background: COLORS.bgTertiary, borderRadius: 20, padding: "20px", marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Buy Airtime</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Network</label>
                  <select
                    value={airtimeForm.network}
                    onChange={(e) => setAirtimeForm({ ...airtimeForm, network: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  >
                    {NETWORKS.map(net => (
                      <option key={net.id} value={net.id}>{net.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Phone</label>
                  <input
                    type="tel"
                    placeholder="09012345678"
                    value={airtimeForm.recipientPhone}
                    onChange={(e) => setAirtimeForm({ ...airtimeForm, recipientPhone: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Amount (₦)</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={airtimeForm.amount}
                    onChange={(e) => setAirtimeForm({ ...airtimeForm, amount: parseInt(e.target.value) || 0 })}
                    min="100"
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAirtimePurchase}
                  style={{
                    background: COLORS.primary,
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Buy Airtime
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* CABLE TAB */}
          {activeTab === "cable" && (
            <motion.div
              key="cable"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <div style={{ background: COLORS.bgTertiary, borderRadius: 20, padding: "20px", marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Subscribe to Cable</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Provider</label>
                  <select
                    value={cableForm.provider}
                    onChange={(e) => setCableForm({ ...cableForm, provider: e.target.value, plan: Object.values(CABLE_PROVIDERS)[0].plans[0].id })}
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  >
                    {Object.entries(CABLE_PROVIDERS).map(([key, provider]) => (
                      <option key={key} value={key}>{provider.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Plan</label>
                  <select
                    value={cableForm.plan}
                    onChange={(e) => setCableForm({ ...cableForm, plan: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  >
                    {CABLE_PROVIDERS[cableForm.provider as keyof typeof CABLE_PROVIDERS].plans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name} - ₦{plan.price.toLocaleString()}</option>
                    ))}
                  </select>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCableSubscribe}
                  style={{
                    background: COLORS.primary,
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Subscribe
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ELECTRICITY TAB */}
          {activeTab === "electricity" && (
            <motion.div
              key="electricity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <div style={{ background: COLORS.bgTertiary, borderRadius: 20, padding: "20px", marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Pay Electricity Bill</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>DISCO</label>
                  <select
                    value={electricityForm.disco}
                    onChange={(e) => setElectricityForm({ ...electricityForm, disco: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  >
                    {DISCOS.map(disco => (
                      <option key={disco} value={disco}>{disco}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Meter Type</label>
                  <select
                    value={electricityForm.meterType}
                    onChange={(e) => setElectricityForm({ ...electricityForm, meterType: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="prepaid">Prepaid</option>
                    <option value="postpaid">Postpaid</option>
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Meter Number</label>
                  <input
                    type="text"
                    placeholder="Enter meter number"
                    value={electricityForm.meterNumber}
                    onChange={(e) => setElectricityForm({ ...electricityForm, meterNumber: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleElectricityPay}
                  style={{
                    background: COLORS.primary,
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Validate & Pay
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* EXAM TAB */}
          {activeTab === "exampin" && (
            <motion.div
              key="exampin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <div style={{ background: COLORS.bgTertiary, borderRadius: 20, padding: "20px", marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Buy Exam PINs</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Exam Body</label>
                  <select
                    value={examForm.exam}
                    onChange={(e) => setExamForm({ ...examForm, exam: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  >
                    {EXAMS.map(exam => (
                      <option key={exam.name} value={exam.name}>{exam.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Quantity</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={examForm.quantity}
                    onChange={(e) => setExamForm({ ...examForm, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="5"
                    style={{
                      width: "100%",
                      background: COLORS.bgSecondary,
                      border: `1px solid ${COLORS.separator}`,
                      borderRadius: 10,
                      padding: "12px",
                      color: COLORS.text,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExamPinPurchase}
                  style={{
                    background: COLORS.primary,
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Buy Exam PINs
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM SPACING FOR TAB BAR */}
        <div style={{ height: 80 }} />
      </div>

      {/* BOTTOM TAB BAR - iOS STYLE */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: COLORS.bg,
        borderTop: `1px solid ${COLORS.separator}`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        zIndex: 40,
      }}>
        {SERVICES.map(service => {
          const Icon = service.icon;
          return (
            <TabIcon key={service.id} id={service.id} Icon={Icon} />
          );
        })}
      </div>
    </div>
  );
}
