"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, Zap, Phone, Wifi, Tv, BookOpen, Settings, MoreVertical, Eye, EyeOff, 
  Copy, Check, X, ChevronRight, Loader2, Send, Menu, Home, History, Gift, Wallet 
} from "lucide-react";
import { toast } from "sonner";
import { LogoIcon } from "@/components/Logo";

// Premium Color Palette  
const COLORS = {
  // Primary Gradients
  primary: "#6366f1",      // Indigo
  secondary: "#ec4899",    // Pink
  success: "#10b981",      // Green
  warning: "#f59e0b",      // Amber
  danger: "#ef4444",       // Red
  
  // Backgrounds
  bg: "#0f172a",           // Dark slate
  bgCard: "#1e293b",       // Slightly lighter
  bgSecondary: "#334155",  // Sidebar bg
  
  // Text
  text: "#f1f5f9",
  textMid: "#cbd5e1",
  textDim: "#94a3b8",
  
  // Borders
  border: "#475569",
  borderLight: "#64748b",
  
  // System
  success_bg: "rgba(16, 185, 129, 0.1)",
  warning_bg: "rgba(245, 158, 11, 0.1)",
  danger_bg: "rgba(239, 68, 68, 0.1)",
};

const SERVICES = [
  { id: "data", label: "Data", icon: Wifi, color: "#6366f1", gradient: "from-indigo-500 to-blue-500" },
  { id: "airtime", label: "Airtime", icon: Phone, color: "#ec4899", gradient: "from-pink-500 to-rose-500" },
  { id: "cable", label: "Cable TV", icon: Tv, color: "#8b5cf6", gradient: "from-purple-500 to-pink-500" },
  { id: "electricity", label: "Electricity", icon: Zap, color: "#f59e0b", gradient: "from-amber-500 to-orange-500" },
  { id: "exampin", label: "Exam PINs", icon: BookOpen, color: "#10b981", gradient: "from-green-500 to-emerald-500" },
];

const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCC00", logo: "/networks/mtn.png" },
  { id: "airtel", name: "Airtel", color: "#FF3333", logo: "/networks/airtel.png" },
  { id: "glo", name: "Glo", color: "#22C55E", logo: "/networks/glo.png" },
  { id: "9mobile", name: "9mobile", color: "#00A859", logo: "/networks/9mobile.png" },
];

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

export default function AppDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("data");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState("mtn");
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user and plans
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
        if (!res.ok) {
          throw new Error("Failed to fetch plans");
        }
        const data = await res.json();
        setPlans(Array.isArray(data.plans) ? data.plans : []);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setPlans([]);
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchPlans();
  }, [router]);

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
    setCopied(true);
    toast.success("Phone copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePurchase = (plan: DataPlan) => {
    toast.loading("Processing purchase...");
    router.push(`/app/checkout?plan=${plan.id}&network=${selectedNetwork}`);
  };

  const filteredPlans = plans.filter(p => p.network.toLowerCase() === selectedNetwork.toLowerCase());

  if (loading || !user) {
    return (
      <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ margin: "0 auto 16px", display: "flex", justifyContent: "center" }}>
            <Loader2 size={48} />
          </motion.div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 280,
          height: "100vh",
          background: COLORS.bgSecondary,
          borderRight: `1px solid ${COLORS.border}`,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(10px)",
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
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", margin: "0 0 12px", paddingLeft: 12 }}>Services</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SERVICES.map(service => {
                const Icon = service.icon;
                const isActive = activeTab === service.id;
                return (
                  <motion.button
                    key={service.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(service.id)}
                    style={{
                      background: isActive ? `linear-gradient(135deg, ${service.color}, ${service.color}dd)` : "transparent",
                      border: `2px solid ${isActive ? service.color : "transparent"}`,
                      borderRadius: 12,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: "pointer",
                      color: isActive ? "#fff" : COLORS.textMid,
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
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", margin: "0 0 12px", paddingLeft: 12 }}>Account</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: History, label: "Transactions", href: "#" },
                { icon: Gift, label: "Rewards", href: "#" },
                { icon: Settings, label: "Settings", href: "#" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
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

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? 280 : 0, transition: "margin 0.3s", position: "relative" }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgCard}, ${COLORS.bgSecondary})`,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
              <Menu size={20} />
            </motion.button>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Dashboard</p>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.textDim }}>Manage your account</p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user && (
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{user.fullName}</p>
                <p style={{ margin: 0, fontSize: 12, color: COLORS.textDim }}>{user.tier}</p>
              </div>
            )}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
            }}>
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              margin: "24px 24px",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
              borderRadius: 20,
              padding: "32px 24px",
              boxShadow: `0 20px 50px rgba(99, 102, 241, 0.3)`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -20, right: -20, width: 200, height: 200, background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(50px)" }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.9, fontWeight: 500 }}>Available Balance</p>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                <h2 style={{ margin: 0, fontSize: 44, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>
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
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 13, opacity: 0.9 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>Account</p>
                  <p style={{ margin: "4px 0 0", opacity: 0.8 }}>{user.phone}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Grid */}
        <div style={{ padding: "0 24px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {[
              { icon: Send, label: "Send Money", color: COLORS.primary },
              { icon: Wallet, label: "Fund Wallet", color: COLORS.success },
              { icon: Gift, label: "Rewards", color: COLORS.warning },
              { icon: Settings, label: "Settings", color: COLORS.secondary },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={idx}
                  whileHover={{ y: -4, boxShadow: `0 12px 24px ${action.color}40` }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toast.success(`${action.label} feature coming soon!`)}
                  style={{
                    background: COLORS.bgCard,
                    border: `2px solid ${COLORS.border}`,
                    borderRadius: 16,
                    padding: "20px 16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${action.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: action.color,
                  }}>
                    <Icon size={24} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Service Content */}
        <div style={{ padding: "0 24px 40px" }}>
          {activeTab === "data" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="data"
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Select Network</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 24 }}>
                {NETWORKS.map(net => (
                  <motion.button
                    key={net.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedNetwork(net.id);
                      toast.success(`${net.name} selected!`);
                    }}
                    style={{
                      background: selectedNetwork === net.id ? net.color + "20" : COLORS.bgCard,
                      border: `2.5px solid ${selectedNetwork === net.id ? net.color : COLORS.border}`,
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
                    <div style={{ width: 40, height: 40, background: `${net.color}20`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: net.color, fontWeight: 700, fontSize: 14 }}>
                      {net.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: selectedNetwork === net.id ? net.color : COLORS.text }}>{net.name}</span>
                  </motion.button>
                ))}
              </div>

              <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>Available Plans</h3>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto", color: COLORS.primary }} />
                </div>
              ) : filteredPlans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: COLORS.bgCard, borderRadius: 16, border: `2px dashed ${COLORS.border}` }}>
                  <p style={{ margin: "0 0 8px", fontSize: 24 }}>📭</p>
                  <p style={{ margin: 0, color: COLORS.textDim }}>{selectedNetwork.toUpperCase()} plans not available</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {filteredPlans.map(plan => (
                    <motion.button
                      key={plan.id}
                      whileHover={{ y: -4, boxShadow: `0 12px 24px ${COLORS.primary}20` }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        toast.loading("Adding to cart...");
                        handlePurchase(plan);
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
                        <p style={{ margin: "4px 0 0",fontSize: 12, color: COLORS.textDim }}>Plan</p>
                      </div>
                      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: COLORS.primary, fontFamily: "'DM Mono', monospace" }}>
                          ₦{plan.user_price?.toLocaleString() || plan.price.toLocaleString()}
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ opacity: 1 }}
                        style={{
                          background: `${COLORS.primary}20`,
                          border: `2px solid ${COLORS.primary}`,
                          borderRadius: 10,
                          padding: "8px 12px",
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: 12,
                          color: COLORS.primary,
                          opacity: 0.8,
                        }}
                      >
                        Buy Now
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {["airtime", "cable", "electricity", "exampin"].includes(activeTab) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key={activeTab}
              style={{
                background: COLORS.bgCard,
                borderRadius: 16,
                border: `2px dashed ${COLORS.border}`,
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 12px", fontSize: 32 }}>🚀</p>
              <h3 style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 18 }}>{activeTab.toUpperCase()} Coming Soon!</h3>
              <p style={{ margin: 0, color: COLORS.textDim }}>We're building amazing features for this service</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 30,
            display: isMobile ? "block" : "none",
          }}
        />
      )}
    </div>
  );
}
