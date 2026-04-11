"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, Phone, Tv, Zap, BookOpen, Home, History, Settings as SettingsIcon,
  Eye, EyeOff, Copy, Loader2, ChevronRight, X, Lock, Check, AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// ============ PREMIUM COLORS ============
const COLORS = {
  // Brand colors
  primary: "#007AFF",
  
  // Modern backgrounds
  bgMain: "#F8FAFF",
  bgSecondary: "#FFFFFF",
  bgGradientStart: "#F0F4FF",
  bgGradientEnd: "#FAFAFA",
  
  // Text
  text: "#1A1A2E",
  textSecondary: "#525566",
  textTertiary: "#8B8BA8",
  
  // Borders & dividers
  separator: "#E8EBFF",
  
  // Service colors
  dataColor: "#007AFF",
  airtimeColor: "#FF3B30",
  cableColor: "#AF52DE",
  electricityColor: "#FF9500",
  examColor: "#34C759",
};

// Service color mapping
const SERVICE_COLORS = {
  data: { color: COLORS.dataColor, bg: "#EBF5FF" },
  airtime: { color: "#FF3B30", bg: "#FFEBEE" },
  cable: { color: "#AF52DE", bg: "#F3E5FF" },
  electricity: { color: "#FF9500", bg: "#FFF4E6" },
  exampin: { color: "#34C759", bg: "#EEFFF4" },
};

const ACCOUNT_SERVICES = [
  { id: "transactions", label: "Transactions", icon: History },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const NETWORKS = [
  { id: "mtn", name: "MTN", image: "/networks/mtn.jpeg" },
  { id: "airtel", name: "Airtel", image: "/networks/airtel.jpeg" },
  { id: "glo", name: "Glo", image: "/networks/glo.jpeg" },
  { id: "9mobile", name: "9Mobile", image: "/networks/9mobile.jpeg" },
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

// Helper to get user initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ============ MAIN COMPONENT ============
export default function NativeIOSDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");
  
  // Form states
  const [airtimeForm, setAirtimeForm] = useState({ recipientPhone: "", amount: 100, network: "mtn" });
  const [cableForm, setCableForm] = useState({ provider: "dstv", plan: "padi" });
  const [electricityForm, setElectricityForm] = useState({ meterNumber: "", disco: "Ikeja Electric", meterType: "prepaid" });
  const [examForm, setExamForm] = useState({ exam: "WAEC", quantity: 1 });

  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showDataPurchaseModal, setShowDataPurchaseModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Data purchase flow states
  const [dataPurchaseForm, setDataPurchaseForm] = useState({
    phone: "",
    selectedPlan: null as any,
    pin: "",
  });
  const [isPurchasing, setIsPurchasing] = useState(false);

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

  // Fetch transactions
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
        setTransactions([]);
      }
    };
    if (showTransactionsModal) {
      fetchTransactions();
    }
  }, [showTransactionsModal]);

  // ============ HANDLERS ============
  const handleDataPurchase = async () => {
    try {
      // Validate inputs
      if (!dataPurchaseForm.phone) {
        toast.error("Please enter a valid phone number");
        return;
      }
      if (!dataPurchaseForm.selectedPlan) {
        toast.error("Please select a data plan");
        return;
      }
      if (!dataPurchaseForm.pin) {
        toast.error("Please enter your PIN");
        return;
      }

      setIsPurchasing(true);

      // Show loading toast
      const loadingToastId = toast.loading("Validating PIN and checking balance...");

      // Step 1: Validate PIN (mock for now - in production, this would be hashed server-side)
      if (dataPurchaseForm.pin !== "000000") {
        toast.dismiss(loadingToastId);
        toast.error("❌ Incorrect PIN", {
          description: "Please check your PIN and try again",
          duration: 4000,
        });
        setIsPurchasing(false);
        return;
      }

      // Step 2: Check balance
      if (!user || user.balance < dataPurchaseForm.selectedPlan.price) {
        toast.dismiss(loadingToastId);
        toast.error("❌ Insufficient Balance", {
          description: `You need ₦${(dataPurchaseForm.selectedPlan.price - user!.balance).toLocaleString()} more`,
          duration: 4000,
        });
        setIsPurchasing(false);
        return;
      }

      // Step 3: Call data delivery API
      toast.dismiss(loadingToastId);
      toast.loading("Processing data purchase...");

      const apiSource = dataPurchaseForm.selectedPlan.apiSource || "API_A";
      const apiEndpoint = apiSource === "API_A" ? "/api/data/purchase-api-a" : "/api/data/purchase-api-b";

      const purchaseRes = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: dataPurchaseForm.phone,
          planId: dataPurchaseForm.selectedPlan.id,
          plan: dataPurchaseForm.selectedPlan.name,
          network: selectedNetwork.toUpperCase(),
          amount: dataPurchaseForm.selectedPlan.price,
          userId: user?.id,
        }),
      });

      if (!purchaseRes.ok) {
        const error = await purchaseRes.json();
        toast.error("❌ Purchase Failed", {
          description: error.error || "Failed to deliver data. Please try again.",
          duration: 4000,
        });
        setIsPurchasing(false);
        return;
      }

      // Success!
      const result = await purchaseRes.json();
      
      toast.success("✅ Data Purchase Successful!", {
        description: `${dataPurchaseForm.selectedPlan.name} delivered to ${dataPurchaseForm.phone}`,
        duration: 4000,
      });

      // Refresh user balance
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const updatedUser = await userRes.json();
        setUser(updatedUser);
      }

      // Close modal and reset form
      setShowDataPurchaseModal(false);
      setShowPinModal(false);
      setDataPurchaseForm({
        phone: "",
        selectedPlan: null,
        pin: "",
      });
    } catch (error: any) {
      toast.error("❌ Request Error", {
        description: error.message || "Something went wrong. Please try again.",
        duration: 4000,
      });
      console.error("Data purchase error:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSelectDataPlan = (plan: DataPlan) => {
    setDataPurchaseForm({ ...dataPurchaseForm, selectedPlan: plan });
    setShowDataPurchaseModal(true);
    toast.success(`${plan.name} selected`, {
      description: `Price: ₦${plan.price.toLocaleString()}`,
      duration: 2000,
    });
  };

  const handleDataPurchasePhoneSubmit = () => {
    if (!dataPurchaseForm.phone) {
      toast.error("Please enter your phone number");
      return;
    }
    if (dataPurchaseForm.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setShowPinModal(true);
  };

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
        background: `linear-gradient(135deg, ${COLORS.bgGradientStart}, ${COLORS.bgGradientEnd})`,
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
      background: `linear-gradient(to bottom, ${COLORS.bgGradientStart}, ${COLORS.bgGradientEnd})`,
      color: COLORS.text,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      overflow: "hidden",
    }}>
      {/* STATUS BAR SPACING */}
      <div style={{ height: "env(safe-area-inset-top, 20px)", background: "transparent" }} />

      {/* PREMIUM HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.bgGradientStart}, ${COLORS.bgSecondary})`,
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${COLORS.separator}`,
        padding: "12px 16px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: COLORS.text,
          }}>
            Hi, {user.fullName.split(" ")[0]} 👋
          </h1>
          <p style={{
            margin: "2px 0 0",
            fontSize: 13,
            color: COLORS.textTertiary,
            fontWeight: 500,
          }}>
            Welcome back
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleLogout}
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.primary}10)`,
            border: `1.5px solid ${COLORS.primary}40`,
            borderRadius: 50,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: COLORS.primary,
            fontWeight: 700,
            fontSize: 20,
            backdropFilter: "blur(10px)",
          }}
          title="Logout"
        >
          {getInitials(user.fullName)}
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
              {/* PREMIUM BALANCE CARD */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: "linear-gradient(135deg, #003A9F 0%, #7C3AED 50%, #0EA5E9 100%)",
                  borderRadius: 24,
                  padding: "28px 24px",
                  color: "white",
                  marginBottom: 24,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0, 122, 255, 0.25), 0 0 1px rgba(0, 122, 255, 0.5)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                {/* Mesh overlay pattern */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                      linear-gradient(45deg, transparent 30%, rgba(255,255,255,.05) 50%, transparent 70%),
                      linear-gradient(-45deg, transparent 30%, rgba(255,255,255,.05) 50%, transparent 70%)
                    `,
                    backgroundSize: "40px 40px",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 500, opacity: 0.9 }}>
                    Available Balance
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      style={{
                        margin: 0,
                        fontSize: 44,
                        fontWeight: 800,
                        fontFamily: 'Menlo, monospace',
                        letterSpacing: 2,
                      }}
                    >
                      {balanceVisible ? `₦${user.balance.toLocaleString()}` : "••••••"}
                    </motion.h2>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setBalanceVisible(!balanceVisible)}
                      style={{
                        background: "rgba(255, 255, 255, 0.25)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: 20,
                        width: 44,
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        cursor: "pointer",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      {balanceVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                    </motion.button>
                  </div>
                  <div style={{
                    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                    paddingTop: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                  }}>
                    <div>
                      <p style={{ margin: "0 0 4px", opacity: 0.8, fontSize: 12 }}>Phone</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{user.phone}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={copyPhone}
                      style={{
                        background: "rgba(255, 255, 255, 0.25)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        borderRadius: 10,
                        padding: "8px 12px",
                        color: "white",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 12,
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Copy size={14} style={{ display: "inline", marginRight: 4 }} />
                      Copy
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* SERVICES GRID */}
              <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700, letterSpacing: -0.3, color: COLORS.text }}>
                Quick Services
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
                {SERVICES.map(service => {
                  const Icon = service.icon;
                  return (
                    <motion.button
                      key={service.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(service.id)}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 }}
                      style={{
                        background: COLORS.bgSecondary,
                        border: `1.5px solid ${COLORS.separator}`,
                        borderRadius: 18,
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: service.color.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Icon size={28} color={service.color.color} strokeWidth={2.2} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: COLORS.text }}>{service.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* ACCOUNT SECTION */}
              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, letterSpacing: -0.3, color: COLORS.text }}>
                Account
              </h3>
              <div style={{ background: COLORS.bgSecondary, borderRadius: 18, border: `1px solid ${COLORS.separator}`, overflow: "hidden", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)", marginBottom: 24 }}>
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
                        borderBottom: idx < ACCOUNT_SERVICES.length - 1 ? `1px solid ${COLORS.separator}` : "none",
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
                        <Icon size={22} color={COLORS.primary} />
                      </div>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <p style={{ margin: 0, fontWeight: 500, color: COLORS.text }}>{item.label}</p>
                      </div>
                      <ChevronRight size={20} color={COLORS.textTertiary} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* DATA SERVICE */}
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
                      background: selectedNetwork === net.id ? `${COLORS.primary}15` : COLORS.bgSecondary,
                      border: `2px solid ${selectedNetwork === net.id ? COLORS.primary : COLORS.separator}`,
                      borderRadius: 16,
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      boxShadow: selectedNetwork === net.id ? "0 8px 24px rgba(0, 122, 255, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.05)",
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
                      onClick={() => handleSelectDataPlan(plan)}
                      style={{
                        background: COLORS.bgSecondary,
                        border: `1px solid ${COLORS.separator}`,
                        borderRadius: 16,
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: COLORS.text }}>{plan.name}</p>
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

          {/* AIRTIME SERVICE */}
          {activeTab === "airtime" && (
            <motion.div
              key="airtime"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <div style={{ background: COLORS.bgSecondary, borderRadius: 20, padding: "20px", marginBottom: 24, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Buy Airtime</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Network</label>
                  <select
                    value={airtimeForm.network}
                    onChange={(e) => setAirtimeForm({ ...airtimeForm, network: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Phone</label>
                  <input
                    type="tel"
                    placeholder="09012345678"
                    value={airtimeForm.recipientPhone}
                    onChange={(e) => setAirtimeForm({ ...airtimeForm, recipientPhone: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Amount (₦)</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={airtimeForm.amount}
                    onChange={(e) => setAirtimeForm({ ...airtimeForm, amount: parseInt(e.target.value) || 0 })}
                    min="100"
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                    background: `linear-gradient(135deg, ${COLORS.primary}, #0066FF)`,
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 8px 24px rgba(0, 122, 255, 0.2)",
                  }}
                >
                  Buy Airtime
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* CABLE SERVICE */}
          {activeTab === "cable" && (
            <motion.div
              key="cable"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <div style={{ background: COLORS.bgSecondary, borderRadius: 20, padding: "20px", marginBottom: 24, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Subscribe to Cable</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Provider</label>
                  <select
                    value={cableForm.provider}
                    onChange={(e) => setCableForm({ ...cableForm, provider: e.target.value, plan: Object.values(CABLE_PROVIDERS)[0].plans[0].id })}
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Plan</label>
                  <select
                    value={cableForm.plan}
                    onChange={(e) => setCableForm({ ...cableForm, plan: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                    background: `linear-gradient(135deg, ${COLORS.primary}, #0066FF)`,
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 8px 24px rgba(0, 122, 255, 0.2)",
                  }}
                >
                  Subscribe
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ELECTRICITY SERVICE */}
          {activeTab === "electricity" && (
            <motion.div
              key="electricity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <div style={{ background: COLORS.bgSecondary, borderRadius: 20, padding: "20px", marginBottom: 24, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Pay Electricity Bill</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>DISCO</label>
                  <select
                    value={electricityForm.disco}
                    onChange={(e) => setElectricityForm({ ...electricityForm, disco: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Meter Type</label>
                  <select
                    value={electricityForm.meterType}
                    onChange={(e) => setElectricityForm({ ...electricityForm, meterType: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Meter Number</label>
                  <input
                    type="text"
                    placeholder="Enter meter number"
                    value={electricityForm.meterNumber}
                    onChange={(e) => setElectricityForm({ ...electricityForm, meterNumber: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                    background: `linear-gradient(135deg, ${COLORS.primary}, #0066FF)`,
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 8px 24px rgba(0, 122, 255, 0.2)",
                  }}
                >
                  Validate & Pay
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* EXAM SERVICE */}
          {activeTab === "exampin" && (
            <motion.div
              key="exampin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "16px" }}
            >
              <div style={{ background: COLORS.bgSecondary, borderRadius: 20, padding: "20px", marginBottom: 24, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>Buy Exam PINs</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Exam Body</label>
                  <select
                    value={examForm.exam}
                    onChange={(e) => setExamForm({ ...examForm, exam: e.target.value })}
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: COLORS.text }}>Quantity</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={examForm.quantity}
                    onChange={(e) => setExamForm({ ...examForm, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="5"
                    style={{
                      width: "100%",
                      background: COLORS.bgMain,
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
                    background: `linear-gradient(135deg, ${COLORS.primary}, #0066FF)`,
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 8px 24px rgba(0, 122, 255, 0.2)",
                  }}
                >
                  Buy Exam PINs
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM SPACING */}
        <div style={{ height: 80 }} />
      </div>

      {/* PREMIUM BOTTOM TAB BAR - 3 TABS ONLY */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: COLORS.bgSecondary,
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${COLORS.separator}`,
        display: "flex",
        justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        zIndex: 40,
      }}>
        {[
          { id: "home", icon: Home, label: "Home" },
          { id: "transactions", icon: History, label: "History" },
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
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 3,
                    background: COLORS.primary,
                    borderRadius: 2,
                  }}
                />
              )}
              <Icon
                size={24}
                color={activeTab === tab.id ? COLORS.primary : COLORS.textTertiary}
                strokeWidth={activeTab === tab.id ? 2.5 : 2}
              />
              <span style={{
                fontSize: 10,
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? COLORS.primary : COLORS.textTertiary,
              }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* DATA PURCHASE PHONE MODAL */}
      <AnimatePresence>
        {showDataPurchaseModal && !showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "flex-end",
              zIndex: 100,
            }}
            onClick={() => setShowDataPurchaseModal(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: COLORS.bgSecondary,
                borderRadius: "24px 24px 0 0",
                padding: "32px 20px 40px",
                width: "100%",
                maxWidth: "100%",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>
                  Enter Phone Number
                </h2>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowDataPurchaseModal(false)}
                  style={{
                    background: COLORS.bgMain,
                    border: "none",
                    borderRadius: 10,
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: COLORS.text,
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                  Recipient Phone Number
                </p>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={dataPurchaseForm.phone}
                  onChange={(e) => setDataPurchaseForm({ ...dataPurchaseForm, phone: e.target.value })}
                  style={{
                    width: "100%",
                    background: COLORS.bgMain,
                    border: `1.5px solid ${COLORS.separator}`,
                    borderRadius: 12,
                    padding: "14px",
                    color: COLORS.text,
                    fontSize: 16,
                    boxSizing: "border-box",
                    fontWeight: 500,
                  }}
                  autoFocus
                />
                <p style={{ margin: "8px 0 0", fontSize: 12, color: COLORS.textTertiary }}>
                  Plan: {dataPurchaseForm.selectedPlan?.name}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.primary, fontWeight: 600 }}>
                  Amount: ₦{dataPurchaseForm.selectedPlan?.price.toLocaleString()}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleDataPurchasePhoneSubmit}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary}, #0066FF)`,
                  border: "none",
                  borderRadius: 12,
                  padding: "16px",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  width: "100%",
                  boxShadow: "0 8px 24px rgba(0, 122, 255, 0.2)",
                }}
              >
                Continue to PIN Verification
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN VERIFICATION MODAL */}
      <AnimatePresence>
        {showPinModal && showDataPurchaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "flex-end",
              zIndex: 101,
            }}
            onClick={() => setShowPinModal(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: COLORS.bgSecondary,
                borderRadius: "24px 24px 0 0",
                padding: "32px 20px 40px",
                width: "100%",
                maxWidth: "100%",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>
                  <Lock size={20} style={{ display: "inline", marginRight: 8, marginBottom: -2 }} />
                  Verify PIN
                </h2>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    setShowPinModal(false);
                    setDataPurchaseForm({ ...dataPurchaseForm, pin: "" });
                  }}
                  style={{
                    background: COLORS.bgMain,
                    border: "none",
                    borderRadius: 10,
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: COLORS.text,
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div style={{
                background: `${COLORS.primary}10`,
                border: `1px solid ${COLORS.primary}30`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <AlertCircle size={20} color={COLORS.primary} />
                <p style={{ margin: 0, fontSize: 13, color: COLORS.text, fontWeight: 500 }}>
                  Enter your 6-digit PIN to confirm purchase
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                  Your PIN
                </p>
                <input
                  type="password"
                  placeholder="••••••"
                  value={dataPurchaseForm.pin}
                  onChange={(e) => setDataPurchaseForm({ ...dataPurchaseForm, pin: e.target.value })}
                  maxLength={6}
                  style={{
                    width: "100%",
                    background: COLORS.bgMain,
                    border: `1.5px solid ${COLORS.separator}`,
                    borderRadius: 12,
                    padding: "14px",
                    color: COLORS.text,
                    fontSize: 20,
                    letterSpacing: 6,
                    boxSizing: "border-box",
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                  autoFocus
                />
              </div>

              <div style={{
                background: COLORS.bgMain,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: COLORS.textTertiary, fontWeight: 600 }}>
                  Purchase Summary
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: COLORS.text, fontSize: 14 }}>Phone:</span>
                  <span style={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>{dataPurchaseForm.phone}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: COLORS.text, fontSize: 14 }}>Plan:</span>
                  <span style={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>{dataPurchaseForm.selectedPlan?.name}</span>
                </div>
                <div style={{ borderTop: `1px solid ${COLORS.separator}`, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 14 }}>Amount:</span>
                  <span style={{ color: COLORS.primary, fontWeight: 800, fontSize: 16 }}>₦{dataPurchaseForm.selectedPlan?.price.toLocaleString()}</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleDataPurchase}
                disabled={isPurchasing}
                style={{
                  background: isPurchasing ? COLORS.textTertiary : `linear-gradient(135deg, ${COLORS.primary}, #0066FF)`,
                  border: "none",
                  borderRadius: 12,
                  padding: "16px",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: isPurchasing ? "not-allowed" : "pointer",
                  width: "100%",
                  boxShadow: isPurchasing ? "none" : "0 8px 24px rgba(0, 122, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isPurchasing ? 0.7 : 1,
                }}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Confirm Purchase
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRANSACTIONS MODAL */}
      <AnimatePresence>
        {showTransactionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "flex-end",
              zIndex: 100,
            }}
            onClick={() => setShowTransactionsModal(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: COLORS.bgSecondary,
                borderRadius: "24px 24px 0 0",
                padding: "32px 20px 40px",
                width: "100%",
                maxWidth: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>
                  Transaction History
                </h2>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowTransactionsModal(false)}
                  style={{
                    background: COLORS.bgMain,
                    border: "none",
                    borderRadius: 10,
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: COLORS.text,
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <History size={48} color={COLORS.textTertiary} style={{ marginBottom: 16, opacity: 0.5 }} />
                  <p style={{ margin: 0, color: COLORS.textTertiary, fontSize: 14 }}>
                    No transactions yet
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {transactions.map((tx: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        background: COLORS.bgMain,
                        borderRadius: 12,
                        padding: 16,
                        border: `1px solid ${COLORS.separator}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>
                            {tx.description || tx.type}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: COLORS.textTertiary }}>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 700,
                            color: tx.status === "success" ? "#34C759" : COLORS.textSecondary,
                          }}>
                            ₦{tx.amount.toLocaleString()}
                          </p>
                          <p style={{
                            margin: "4px 0 0",
                            fontSize: 12,
                            fontWeight: 600,
                            color: tx.status === "success" ? "#34C759" : "#FF3B30",
                            textTransform: "capitalize",
                          }}>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "flex-end",
              zIndex: 100,
            }}
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: COLORS.bgSecondary,
                borderRadius: "24px 24px 0 0",
                padding: "32px 20px 40px",
                width: "100%",
                maxWidth: "100%",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text }}>
                  Settings
                </h2>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowSettingsModal(false)}
                  style={{
                    background: COLORS.bgMain,
                    border: "none",
                    borderRadius: 10,
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: COLORS.text,
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: COLORS.bgMain, borderRadius: 12, padding: 16, borderBottom: `1px solid ${COLORS.separator}` }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: COLORS.textTertiary, fontWeight: 600 }}>
                    Account Information
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: 14, color: COLORS.textTertiary }}>
                    Name
                  </p>
                  <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: COLORS.text }}>
                    {user?.fullName}
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: 14, color: COLORS.textTertiary }}>
                    Phone
                  </p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.text }}>
                    {user?.phone}
                  </p>
                </div>

                <div style={{ background: COLORS.bgMain, borderRadius: 12, padding: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: COLORS.textTertiary, fontWeight: 600 }}>
                    Account Tier
                  </p>
                  <div style={{
                    background: COLORS.primary + "20",
                    border: `1.5px solid ${COLORS.primary}40`,
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <span style={{ textTransform: "uppercase", fontWeight: 700, color: COLORS.primary, fontSize: 13 }}>
                      {user?.tier}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  style={{
                    background: "#FF3B30",
                    border: "none",
                    borderRadius: 12,
                    padding: "16px",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 8px 24px rgba(255, 59, 48, 0.2)",
                    marginTop: 12,
                  }}
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
