"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, Zap, Phone, Wifi, Tv, BookOpen, Settings, Eye, EyeOff, 
  Copy, Check, Menu, X, Loader2, ChevronDown, AlertCircle, Eye as EyeIcon
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { LogoIcon } from "@/components/Logo";

// ============ COLORS & CONFIG ============
const COLORS = {
  primary: "#6366f1",
  secondary: "#ec4899", 
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  bg: "#0f172a",
  bgCard: "#1e293b",
  bgSecondary: "#334155",
  text: "#f1f5f9",
  textMid: "#cbd5e1",
  textDim: "#94a3b8",
  border: "#475569",
  borderLight: "#64748b",
};

const SERVICES = [
  { id: "data", label: "Data", icon: Wifi, color: "#6366f1" },
  { id: "airtime", label: "Airtime", icon: Phone, color: "#ec4899" },
  { id: "cable", label: "Cable TV", icon: Tv, color: "#8b5cf6" },
  { id: "electricity", label: "Electricity", icon: Zap, color: "#f59e0b" },
  { id: "exampin", label: "Exam PINs", icon: BookOpen, color: "#10b981" },
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
  "Kaduna Electric", "Jos Electric", "Benin Electric", "Yola Electric"
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
  agent_price: number;
  network: string;
}

// ============ MAIN COMPONENT ============
export default function AppDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("data");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Data service
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");

  // Airtime form
  const [airtimeForm, setAirtimeForm] = useState({ recipientPhone: "", amount: 100, network: "mtn" });
  const [airtimeLoading, setAirtimeLoading] = useState(false);

  // Cable form
  const [cableForm, setCableForm] = useState({ provider: "dstv", plan: "padi" });
  const [cableLoading, setCableLoading] = useState(false);

  // Electricity form
  const [electricityForm, setElectricityForm] = useState({ meterNumber: "", disco: "Ikeja Electric", meterType: "prepaid" });
  const [electricityLoading, setElectricityLoading] = useState(false);

  // Exam form
  const [examForm, setExamForm] = useState({ exam: "WAEC", quantity: 1 });
  const [examLoading, setExamLoading] = useState(false);

  // ============ EFFECTS ============
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        toast.success(`Welcome back, ${data.fullName}! 👋`);
      } catch (error) {
        console.error("Auth error:", error);
        toast.error("Authentication failed");
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
      toast.success("Logged out successfully");
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
    setAirtimeLoading(true);
    try {
      const res = await fetch("/api/airtime/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerPhone: user?.phone,
          recipientPhone: airtimeForm.recipientPhone,
          amount: airtimeForm.amount,
          network: airtimeForm.network,
          pin: "000000", // Placeholder
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Airtime purchased successfully!");
        setAirtimeForm({ recipientPhone: "", amount: 100, network: "mtn" });
      } else {
        toast.error(data.error || "Purchase failed");
      }
    } catch (error) {
      toast.error("Request failed");
    } finally {
      setAirtimeLoading(false);
    }
  };

  const handleCableSubscribe = async () => {
    setCableLoading(true);
    try {
      const selectedPlan = CABLE_PROVIDERS[cableForm.provider as keyof typeof CABLE_PROVIDERS].plans.find(p => p.id === cableForm.plan);
      const res = await fetch("/api/cable/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: cableForm.provider.toUpperCase(),
          smartcardNumber: "_",
          planId: cableForm.plan,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Cable subscription successful!");
      } else {
        toast.error(data.error || "Subscription failed");
      }
    } catch (error) {
      toast.error("Request failed");
    } finally {
      setCableLoading(false);
    }
  };

  const handleElectricityPay = async () => {
    if (!electricityForm.meterNumber) {
      toast.error("Please enter meter number");
      return;
    }
    setElectricityLoading(true);
    try {
      // First validate
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
        toast.success("Meter validated! Proceeding to payment...");
        setElectricityForm({ meterNumber: "", disco: "Ikeja Electric", meterType: "prepaid" });
      } else {
        const error = await validateRes.json();
        toast.error(error.error || "Validation failed");
      }
    } catch (error) {
      toast.error("Request failed");
    } finally {
      setElectricityLoading(false);
    }
  };

  const handleExamPinPurchase = async () => {
    setExamLoading(true);
    try {
      const res = await fetch("/api/exampin/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examName: examForm.exam,
          quantity: examForm.quantity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Exam PINs purchased successfully!");
        setExamForm({ exam: "WAEC", quantity: 1 });
      } else {
        toast.error(data.error || "Purchase failed");
      }
    } catch (error) {
      toast.error("Request failed");
    } finally {
      setExamLoading(false);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Loading state
  if (loading || !user) {
    return (
      <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={48} />
        </motion.div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: "100vh", display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* SIDEBAR */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: isMobile && !sidebarOpen ? -280 : 0 }}
        transition={{ type: "spring", damping: 25 }}
        style={{
          position: isMobile ? "fixed" : "relative",
          left: 0,
          top: 0,
          width: 280,
          height: isMobile ? "100vh" : "auto",
          zIndex: isMobile ? 50 : 0,
          background: COLORS.bgSecondary,
          borderRight: `1px solid ${COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "24px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LogoIcon size="sm" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>Danbaiwa</p>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.textDim }}>Data Plug</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", margin: "0 0 12px", paddingLeft: 12 }}>Services</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {SERVICES.map(service => {
              const Icon = service.icon;
              const isActive = activeTab === service.id;
              return (
                <motion.button
                  key={service.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(service.id);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  style={{
                    background: isActive ? `${service.color}20` : "transparent",
                    border: `2px solid ${isActive ? service.color : "transparent"}`,
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    color: isActive ? service.color : COLORS.textMid,
                    fontWeight: isActive ? 600 : 500,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={20} />
                  <span>{service.label}</span>
                </motion.button>
              );
            })}
          </div>

          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", margin: "0 0 12px", paddingLeft: 12 }}>Account</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: Wifi, label: "Transactions", action: () => handleNavigation("/app/dashboard/transactions") },
              { icon: Phone, label: "Rewards", action: () => handleNavigation("/app/dashboard/rewards") },
              { icon: Settings, label: "Settings", action: () => handleNavigation("/app/dashboard/settings") },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={idx}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    color: COLORS.textMid,
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding: "16px", borderTop: `1px solid ${COLORS.border}` }}>
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: `2px solid ${COLORS.danger}`,
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              color: COLORS.danger,
              fontWeight: 600,
              width: "100%",
              transition: "all 0.2s",
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.div>

      {/* MOBILE OVERLAY */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 40,
          }}
        />
      )}

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "100%", overflowX: "hidden" }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgCard}, ${COLORS.bgSecondary})`,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: isMobile ? "16px" : "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 30,
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.text,
              }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontWeight: 700 }}>Dashboard</p>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.textDim }}>Manage your services</p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!isMobile && user && (
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{user.fullName}</p>
                <p style={{ margin: 0, fontSize: 12, color: COLORS.textDim }}>{user.tier}</p>
              </div>
            )}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {/* Balance Card */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                margin: isMobile ? "16px" : "24px",
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                borderRadius: 20,
                padding: isMobile ? "20px 16px" : "32px 24px",
                boxShadow: `0 20px 50px rgba(99, 102, 241, 0.3)`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: -20, right: -20, width: 200, height: 200, background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(50px)" }} />
              
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.9, fontWeight: 500 }}>Available Balance</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: isMobile ? 32 : 44, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>
                    {balanceVisible ? `₦${user.balance.toLocaleString()}` : "••••••"}
                  </h2>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    {balanceVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                  </motion.button>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, fontSize: 13, opacity: 0.9, flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>Phone</p>
                    <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 12 }}>{user.phone}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={copyPhone}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <Copy size={14} style={{ display: "inline", marginRight: 4 }} />
                    Copy
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SERVICE CONTENT */}
          <div style={{ padding: isMobile ? "16px" : "0 24px 40px" }}>
            <AnimatePresence mode="wait">
              {/* DATA SERVICE */}
              {activeTab === "data" && (
                <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h3 style={{ margin: isMobile ? "16px 0" : "24px 0 16px", fontSize: 18, fontWeight: 700 }}>Select Network</h3>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                    {NETWORKS.map(net => (
                      <motion.button
                        key={net.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedNetwork(net.id);
                          toast.success(`${net.name} selected!`);
                        }}
                        style={{
                          background: selectedNetwork === net.id ? `${COLORS.primary}20` : COLORS.bgCard,
                          border: `2.5px solid ${selectedNetwork === net.id ? COLORS.primary : COLORS.border}`,
                          borderRadius: 16,
                          padding: "16px 12px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          transition: "all 0.2s",
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

                  <h3 style={{ margin: "24px 0 16px", fontSize: 18, fontWeight: 700 }}>Available Plans</h3>
                  {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <Loader2 size={32} style={{ margin: "0 auto", animation: "spin 1s linear infinite" }} />
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                      {plans.filter(p => p.network.toLowerCase() === selectedNetwork).map(plan => (
                        <motion.button
                          key={plan.id}
                          whileHover={isMobile ? {} : { y: -4 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            toast.loading("Processing...");
                            router.push(`/app/checkout?plan=${plan.id}&network=${selectedNetwork}`);
                          }}
                          style={{
                            background: COLORS.bgCard,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 16,
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{plan.name}</p>
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.textDim }}>Plan</p>
                          </div>
                          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: COLORS.primary, fontFamily: "'DM Mono', monospace" }}>
                              ₦{(plan.user_price || plan.price).toLocaleString()}
                            </p>
                          </div>
                          <div style={{
                            background: `${COLORS.primary}20`,
                            border: `2px solid ${COLORS.primary}`,
                            borderRadius: 10,
                            padding: "8px 12px",
                            textAlign: "center",
                            fontWeight: 600,
                            fontSize: 12,
                            color: COLORS.primary,
                          }}>
                            Buy Now
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* AIRTIME SERVICE */}
              {activeTab === "airtime" && (
                <motion.div key="airtime" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ maxWidth: "500px" }}>
                    <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700 }}>Buy Airtime</h3>
                    <div style={{ background: COLORS.bgCard, borderRadius: 16, border: `2px solid ${COLORS.border}`, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                      
                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Network</label>
                        <select
                          value={airtimeForm.network}
                          onChange={(e) => setAirtimeForm({ ...airtimeForm, network: e.target.value })}
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "12px",
                            color: COLORS.text,
                            fontSize: 14,
                          }}
                        >
                          {NETWORKS.map(net => (
                            <option key={net.id} value={net.id}>{net.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Recipient Phone</label>
                        <input
                          type="tel"
                          placeholder="09012345678"
                          value={airtimeForm.recipientPhone}
                          onChange={(e) => setAirtimeForm({ ...airtimeForm, recipientPhone: e.target.value })}
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "12px",
                            color: COLORS.text,
                            fontSize: 14,
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Amount (₦)</label>
                        <input
                          type="number"
                          placeholder="100"
                          value={airtimeForm.amount}
                          onChange={(e) => setAirtimeForm({ ...airtimeForm, amount: parseInt(e.target.value) || 0 })}
                          min="100"
                          max="50000"
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
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
                        disabled={airtimeLoading}
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                          border: "none",
                          borderRadius: 12,
                          padding: "14px",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: airtimeLoading ? "not-allowed" : "pointer",
                          opacity: airtimeLoading ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        {airtimeLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
                        Buy Airtime
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CABLE SERVICE */}
              {activeTab === "cable" && (
                <motion.div key="cable" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ maxWidth: "500px" }}>
                    <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700 }}>Subscribe to Cable</h3>
                    <div style={{ background: COLORS.bgCard, borderRadius: 16, border: `2px solid ${COLORS.border}`, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                      
                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Provider</label>
                        <select
                          value={cableForm.provider}
                          onChange={(e) => setCableForm({ ...cableForm, provider: e.target.value, plan: Object.values(CABLE_PROVIDERS)[0].plans[0].id })}
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "12px",
                            color: COLORS.text,
                            fontSize: 14,
                          }}
                        >
                          {Object.entries(CABLE_PROVIDERS).map(([key, provider]) => (
                            <option key={key} value={key}>{provider.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Plan</label>
                        <select
                          value={cableForm.plan}
                          onChange={(e) => setCableForm({ ...cableForm, plan: e.target.value })}
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "12px",
                            color: COLORS.text,
                            fontSize: 14,
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
                        disabled={cableLoading}
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                          border: "none",
                          borderRadius: 12,
                          padding: "14px",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: cableLoading ? "not-allowed" : "pointer",
                          opacity: cableLoading ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        {cableLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
                        Subscribe
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ELECTRICITY SERVICE */}
              {activeTab === "electricity" && (
                <motion.div key="electricity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ maxWidth: "500px" }}>
                    <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700 }}>Pay Electricity Bill</h3>
                    <div style={{ background: COLORS.bgCard, borderRadius: 16, border: `2px solid ${COLORS.border}`, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                      
                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>DISCO</label>
                        <select
                          value={electricityForm.disco}
                          onChange={(e) => setElectricityForm({ ...electricityForm, disco: e.target.value })}
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "12px",
                            color: COLORS.text,
                            fontSize: 14,
                          }}
                        >
                          {DISCOS.map(disco => (
                            <option key={disco} value={disco}>{disco}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Meter Type</label>
                        <select
                          value={electricityForm.meterType}
                          onChange={(e) => setElectricityForm({ ...electricityForm, meterType: e.target.value })}
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "12px",
                            color: COLORS.text,
                            fontSize: 14,
                          }}
                        >
                          <option value="prepaid">Prepaid</option>
                          <option value="postpaid">Postpaid</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Meter Number</label>
                        <input
                          type="text"
                          placeholder="Enter meter number"
                          value={electricityForm.meterNumber}
                          onChange={(e) => setElectricityForm({ ...electricityForm, meterNumber: e.target.value })}
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
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
                        disabled={electricityLoading}
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                          border: "none",
                          borderRadius: 12,
                          padding: "14px",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: electricityLoading ? "not-allowed" : "pointer",
                          opacity: electricityLoading ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        {electricityLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
                        Validate & Pay
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* EXAM PINS SERVICE */}
              {activeTab === "exampin" && (
                <motion.div key="exampin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ maxWidth: "500px" }}>
                    <h3 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700 }}>Buy Exam PINs</h3>
                    <div style={{ background: COLORS.bgCard, borderRadius: 16, border: `2px solid ${COLORS.border}`, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                      
                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Exam Body</label>
                        <select
                          value={examForm.exam}
                          onChange={(e) => setExamForm({ ...examForm, exam: e.target.value })}
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "12px",
                            color: COLORS.text,
                            fontSize: 14,
                          }}
                        >
                          {EXAMS.map(exam => (
                            <option key={exam.name} value={exam.name}>{exam.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Quantity</label>
                        <input
                          type="number"
                          placeholder="1"
                          value={examForm.quantity}
                          onChange={(e) => setExamForm({ ...examForm, quantity: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="5"
                          style={{
                            width: "100%",
                            background: COLORS.bg,
                            border: `2px solid ${COLORS.border}`,
                            borderRadius: 10,
                            padding: "12px",
                            color: COLORS.text,
                            fontSize: 14,
                            boxSizing: "border-box",
                          }}
                        />
                        <p style={{ margin: "8px 0 0", fontSize: 12, color: COLORS.textDim }}>Max 5 PINs per order</p>
                      </div>

                      <div style={{ background: `${COLORS.primary}10`, border: `2px solid ${COLORS.primary}30`, borderRadius: 10, padding: "12px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <AlertCircle size={20} style={{ color: COLORS.primary, flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 13, color: COLORS.textMid }}>
                          Each PIN costs ₦{EXAMS.find(e => e.name === examForm.exam)?.price.toLocaleString()}
                        </p>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExamPinPurchase}
                        disabled={examLoading}
                        style={{
                          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                          border: "none",
                          borderRadius: 12,
                          padding: "14px",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: examLoading ? "not-allowed" : "pointer",
                          opacity: examLoading ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        {examLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
                        Buy Exam PINs
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
