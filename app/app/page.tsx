"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  Wifi, Phone, Tv, Zap, BookOpen, Home, History, Settings as SettingsIcon,
  Eye, EyeOff, Copy, Loader2, ChevronRight, X, ArrowLeft, Check, Mail, Landmark, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import PinInput from "@/components/PinInput";
import SuccessCheck from "@/components/SuccessCheck";
import EnhancedSettingsPanel from "@/components/EnhancedSettingsPanel";
import TransactionReceipt from "@/components/TransactionReceipt";

const T = {
  // Backgrounds
  bg:        "#F4FAF6",
  bgCard:    "#FFFFFF",
  bgElevated:"#ECF8F0",
  bgGlass:   "rgba(255,255,255,0.78)",

  // Brand
  blue:      "#0D9A6B",
  blueMid:   "#18B57E",
  blueLight: "#39C996",
  violet:    "#1E7B62",
  cyan:      "#0EA677",

  // Text
  textPrimary:   "#0F2A1F",
  textSecondary: "#3D6A59",
  textMuted:     "#6F9486",

  // Borders
  border:      "rgba(13,154,107,0.16)",
  borderStrong:"rgba(13,154,107,0.28)",

  // Status
  green:  "#10B981",
  red:    "#EF4444",
  amber:  "#E09B14",

  // Service accent palette
  services: {
    data:        { icon: "#0D9A6B", glow: "rgba(13,154,107,0.18)", bg: "rgba(13,154,107,0.09)" },
    airtime:     { icon: "#0E8A6B", glow: "rgba(14,138,107,0.18)", bg: "rgba(14,138,107,0.09)" },
    cable:       { icon: "#2A9F7B", glow: "rgba(42,159,123,0.18)", bg: "rgba(42,159,123,0.09)" },
    electricity: { icon: "#3AA56B", glow: "rgba(58,165,107,0.18)", bg: "rgba(58,165,107,0.09)" },
    exampin:     { icon: "#0FAD7C", glow: "rgba(15,173,124,0.18)", bg: "rgba(15,173,124,0.09)" },
    contact:     { icon: "#22B087", glow: "rgba(34,176,135,0.18)", bg: "rgba(34,176,135,0.09)" },
  },
};

const font = '"Sora", "Manrope", "Avenir Next", "Segoe UI", sans-serif';

interface User {
  id: string;
  fullName: string;
  phone: string;
  balance: number;
  tier: "user" | "agent";
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
}

interface ReservedAccount {
  id: string;
  billstackReference?: string | null;
  accountNumber: string;
  accountName?: string | null;
  bankName?: string | null;
  bankId: string;
  isPrimary: boolean;
  createdAt?: string | null;
}

interface BroadcastMessage {
  id: string;
  message: string;
  createdAt: string;
}

interface AirtimeNetwork {
  id: number;
  name: string;
  prefix: RegExp;
  color: string;
  hexColor: string;
}

const DATA_NETWORK_PREFIXES: Array<{ id: number; prefix: RegExp }> = [
  { id: 1, prefix: /^(0803|0806|0703|0706|0810|0813|0814|0816|0903|0906|0913|0916)/ }, // MTN
  { id: 4, prefix: /^(0801|0802|0808|0812|0701|0708|0902|0904|0907|0912)/ }, // Airtel
  { id: 2, prefix: /^(0805|0807|0811|0815|0705|0905|0915)/ }, // Glo
  { id: 3, prefix: /^(0809|0817|0818|0908|0909)/ }, // 9mobile
];

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const ACCOUNT_SERVICES = [
  { id: "accounts",     label: "Accounts",      icon: Landmark },
  { id: "transactions", label: "Transactions",  icon: History },
  { id: "settings",    label: "Settings",       icon: SettingsIcon },
];

const AVAILABLE_RESERVED_BANKS = [
  { id: "PALMPAY", label: "PalmPay" },
  { id: "SAFEHAVEN", label: "Safe Haven" },
  { id: "PROVIDUS", label: "Providus" },
  { id: "BANKLY", label: "Bankly" },
  { id: "9PSB", label: "9PSB" },
] as const;

export default function DanbaiwaApp() {
  const router = useRouter();
  const [user, setUser]                         = useState<User | null>(null);
  const [activeTab, setActiveTab]               = useState("home");
  const [balanceVisible, setBalanceVisible]     = useState(true);
  const [loading, setLoading]                   = useState(true);
  const [transactions, setTransactions]         = useState<any[]>([]);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsHasMore, setTransactionsHasMore] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const transactionsLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [accounts, setAccounts]                 = useState<ReservedAccount[]>([]);
  const [accountsLoading, setAccountsLoading]   = useState(false);
  const [broadcasts, setBroadcasts]             = useState<BroadcastMessage[]>([]);
  const [broadcastsLoading, setBroadcastsLoading] = useState(false);
  const [dismissingBroadcastId, setDismissingBroadcastId] = useState<string | null>(null);
  const [selectedReservedBank, setSelectedReservedBank] = useState<string>("");
  const [creatingReservedAccount, setCreatingReservedAccount] = useState(false);
  const [showSettingsModal, setShowSettingsModal]         = useState(false);
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
  const [planCategory, setPlanCategory] = useState<"SME" | "GIFTING" | "CORPORATE">("SME");
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<any[]>([]);
  const [saveBeneficiary, setSaveBeneficiary] = useState(true);
  const [pinInput, setPinInput] = useState(["", "", "", "", "", ""]);
  const [buyDataLoading, setBuyDataLoading] = useState(false);
  const [buyDataError, setBuyDataError] = useState("");
  const [successData, setSuccessData] = useState<any | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Buy-Airtime Flow State
  const [buyAirtimeStage, setBuyAirtimeStage] = useState(1);
  const [airtimeNetwork, setAirtimeNetwork] = useState<AirtimeNetwork | null>(null);
  const [airtimePhone, setAirtimePhone] = useState("");
  const [airtimeAmount, setAirtimeAmount] = useState("");
  const [airtimePinInput, setAirtimePinInput] = useState(["", "", "", "", "", ""]);
  const [buyAirtimeLoading, setBuyAirtimeLoading] = useState(false);
  const [buyAirtimeError, setBuyAirtimeError] = useState("");
  const [airtimeSuccessData, setAirtimeSuccessData] = useState<any | null>(null);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const airtimePhoneInputRef = useRef<HTMLInputElement>(null);

  // Buy-Cable Flow State
  const [buyCableStage, setBuyCableStage] = useState(1);
  const [cableProvider, setCableProvider] = useState<any | null>(null);
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [cablePlans, setCablePlans] = useState<any[]>([]);
  const [selectedCablePlan, setSelectedCablePlan] = useState<any | null>(null);
  const [cablePinInput, setCablePinInput] = useState(["", "", "", "", "", ""]);
  const [buyCableLoading, setBuyCableLoading] = useState(false);
  const [buyCableError, setBuyCableError] = useState("");
  const [cableSuccessData, setCableSuccessData] = useState<any | null>(null);

  // Buy-Power Flow State
  const [buyPowerStage, setBuyPowerStage] = useState(1);
  const [meterType, setMeterType] = useState<"PREPAID" | "POSTPAID" | null>(null);
  const [meterNumber, setMeterNumber] = useState("");
  const [powerProvider, setPowerProvider] = useState<any | null>(null);
  const [powerPlans, setPowerPlans] = useState<any[]>([]);
  const [selectedPowerPlan, setSelectedPowerPlan] = useState<any | null>(null);
  const [powerPinInput, setPowerPinInput] = useState(["", "", "", "", "", ""]);
  const [buyPowerLoading, setBuyPowerLoading] = useState(false);
  const [buyPowerError, setBuyPowerError] = useState("");
  const [powerSuccessData, setPowerSuccessData] = useState<any | null>(null);

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
    if (activeTab !== "home" || !user) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        // Silent fail on refresh - don't show errors
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [activeTab, user]);

  const fetchTransactionsPage = async (page: number, append = false) => {
    try {
      setTransactionsLoading(true);
      const res = await fetch(`/api/transactions?page=${page}&limit=20`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const rows = Array.isArray(data.transactions) ? data.transactions : [];
      setTransactions((prev) => (append ? [...prev, ...rows] : rows));
      setTransactionsHasMore(!!data.hasMore);
      setTransactionsPage(page);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const downloadTransactionReceiptPng = async (tx: any) => {
    const canvas = document.createElement("canvas");
    canvas.width = 840;
    canvas.height = 1028;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const NAIRA = "\u20A6";
    const WEBSITE = "www.danbaiwahdataplug.com";
    const SUPPORT_EMAIL = "support@danbaiwahdataplug.com";
    const receiptStatus = String(tx.status || "PENDING").toUpperCase();
    const success = receiptStatus === "SUCCESS";
    const amount = Number(tx.amount || 0);
    const reference = String(tx.reference || tx.id || "N/A");
    const createdAt = tx.createdAt ? new Date(tx.createdAt) : new Date();
    const dateTime = Number.isNaN(createdAt.getTime())
      ? "N/A"
      : new Intl.DateTimeFormat("en-GB", {
          timeZone: "Africa/Lagos",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }).format(createdAt);

    const roundedRect = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      const r = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + r, y);
      context.lineTo(x + width - r, y);
      context.quadraticCurveTo(x + width, y, x + width, y + r);
      context.lineTo(x + width, y + height - r);
      context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      context.lineTo(x + r, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.closePath();
    };

    const loadLogo = () =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = "/logo.jpeg";
      });

    const drawRightFittedText = (
      text: string,
      rightX: number,
      baselineY: number,
      maxWidth: number,
      initialSize = 28
    ) => {
      let fontSize = initialSize;
      do {
        ctx.font = `900 ${fontSize}px Arial`;
        if (ctx.measureText(text).width <= maxWidth || fontSize <= 18) break;
        fontSize -= 1;
      } while (fontSize > 18);
      ctx.fillText(text, rightX, baselineY);
    };

    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 500);
    headerGradient.addColorStop(0, "#064E3B");
    headerGradient.addColorStop(0.56, "#16A34A");
    headerGradient.addColorStop(1, "#34D399");
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, canvas.width, 498);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(780, 58, 202, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(5,150,105,0.18)";
    ctx.beginPath();
    ctx.arc(746, 94, 50, 0, Math.PI * 2);
    ctx.fill();

    const logo = await loadLogo();
    roundedRect(ctx, 44, 52, 78, 78, 22);
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.fill();
    if (logo) {
      ctx.save();
      roundedRect(ctx, 56, 64, 54, 54, 14);
      ctx.clip();
      ctx.drawImage(logo, 56, 64, 54, 54);
      ctx.restore();
    } else {
      ctx.fillStyle = "#047857";
      ctx.font = "900 30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("D", 83, 102);
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 32px Arial";
    ctx.fillText("DANBAIWA", 140, 88);
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "900 18px Arial";
    ctx.fillText("TRANSACTION RECEIPT", 141, 114);

    const statusText = success ? "SUCCESS" : receiptStatus;
    ctx.font = "900 23px Arial";
    const statusWidth = Math.max(178, ctx.measureText(statusText).width + 80);
    roundedRect(ctx, canvas.width - statusWidth - 44, 66, statusWidth, 52, 26);
    ctx.fillStyle = success ? "rgba(22,163,74,0.28)" : "rgba(185,28,28,0.22)";
    ctx.fill();
    ctx.strokeStyle = success ? "rgba(74,222,128,0.68)" : "rgba(248,113,113,0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = success ? "#86EFAC" : "#FCA5A5";
    ctx.beginPath();
    ctx.arc(canvas.width - statusWidth - 15, 92, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(statusText, canvas.width - statusWidth + 4, 100);

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.56)";
    ctx.font = "900 21px Arial";
    ctx.fillText("TOTAL AMOUNT PAID", canvas.width / 2, 190);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 112px Arial";
    ctx.fillText(amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), canvas.width / 2 + 38, 315);
    ctx.fillStyle = "rgba(255,255,255,0.64)";
    ctx.font = "900 42px Arial";
    ctx.fillText(NAIRA, 224, 269);

    ctx.font = "900 18px Consolas, monospace";
    const refText = `REF: ${reference}`;
    const refWidth = Math.min(560, Math.max(244, ctx.measureText(refText).width + 58));
    roundedRect(ctx, (canvas.width - refWidth) / 2, 356, refWidth, 47, 15);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.fillText(refText.length > 38 ? `${refText.slice(0, 35)}...` : refText, canvas.width / 2, 386);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 498, canvas.width, 356);
    for (let x = 42; x < canvas.width + 44; x += 44) {
      ctx.beginPath();
      ctx.arc(x, 498, 21, Math.PI, 0);
      ctx.fill();
    }

    const rows = [
      ["NETWORK", String(tx.networkName || "N/A")],
      ["PLAN BOUGHT", String(tx.planName || "N/A")],
      ["RECIPIENT", String(tx.phone || "N/A")],
      ["DATE & TIME", dateTime],
    ];

    ctx.textAlign = "left";
    rows.forEach(([label, value], index) => {
      const rowTop = 508 + index * 82;
      ctx.strokeStyle = "#E7EBE8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(44, rowTop + 75);
      ctx.lineTo(796, rowTop + 75);
      ctx.stroke();

      ctx.fillStyle = "#9CA3AF";
      ctx.font = "900 21px Arial";
      ctx.fillText(label, 44, rowTop + 47);

      ctx.textAlign = "right";
      ctx.fillStyle = "#181827";
      drawRightFittedText(value, 796, rowTop + 47, 395, 28);
      ctx.textAlign = "left";
    });

    ctx.fillStyle = "#F3F4F6";
    ctx.fillRect(0, 854, canvas.width, 174);
    ctx.strokeStyle = "#D1D5DB";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(62, 893);
    ctx.lineTo(268, 893);
    ctx.moveTo(572, 893);
    ctx.lineTo(778, 893);
    ctx.stroke();
    ctx.fillStyle = "#A7ABB3";
    ctx.textAlign = "center";
    ctx.font = "900 18px Arial";
    ctx.fillText("SECURED BY DANBAIWA", canvas.width / 2, 900);
    ctx.font = "400 20px Arial";
    ctx.fillText(SUPPORT_EMAIL, canvas.width / 2, 946);
    ctx.fillStyle = "#C0C4CB";
    ctx.font = "600 17px Arial";
    ctx.fillText(`\u00A9 DANBAIWA DATA PLUG 2026 \u00B7 ${WEBSITE}`, canvas.width / 2, 982);

    const link = document.createElement("a");
    link.download = `receipt-${tx.reference || tx.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  useEffect(() => {
    if (!user) return;
    setTransactions([]);
    fetchTransactionsPage(1, false);
  }, [user?.id]);

  useEffect(() => {
    if (activeTab !== "transactions" || !transactionsHasMore || transactionsLoading) return;
    const node = transactionsLoadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first?.isIntersecting && transactionsHasMore && !transactionsLoading) {
        fetchTransactionsPage(transactionsPage + 1, true);
      }
    }, { threshold: 0.5 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, transactionsHasMore, transactionsLoading, transactionsPage]);

  const fetchBroadcasts = async () => {
    try {
      setBroadcastsLoading(true);
      const res = await fetch("/api/broadcasts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch broadcasts");
      const data = await res.json();
      setBroadcasts(Array.isArray(data.broadcasts) ? data.broadcasts : []);
    } catch {
      setBroadcasts([]);
    } finally {
      setBroadcastsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      const res = await fetch("/api/accounts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
    } catch {
      toast.error("Failed to load reserved accounts");
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchBroadcasts();
  }, [user?.id]);

  useEffect(() => {
    if (activeTab !== "accounts") return;
    fetchAccounts();
  }, [activeTab]);

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

  useEffect(() => {
    if (activeTab !== "data") return;
    const fetchBeneficiaries = async () => {
      try {
        const res = await fetch("/api/data/beneficiaries", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setSavedBeneficiaries(Array.isArray(data.data) ? data.data : []);
      } catch {
        setSavedBeneficiaries([]);
      }
    };
    fetchBeneficiaries();
  }, [activeTab]);

  // CRITICAL: NO CACHING - Always fetch plans fresh from database
  useEffect(() => {
    // Clear plans if not in plan-loading stage
    if (buyDataStage !== 2) {
      if (plans.length > 0) setPlans([]);
      return;
    }

    // Must have network selected
    if (!selectedNetwork) {
      if (plans.length > 0) setPlans([]);
      return;
    }

    // ALWAYS FETCH FRESH - NO CACHING (add timestamp to bust cache)
    setBuyDataLoading(true);
    (async () => {
      try {
        const timestamp = Date.now();
        const url = `/api/data/plans?networkId=${selectedNetwork.id}&t=${timestamp}`;
        
        const res = await fetch(url, {
          cache: 'no-store',  // Disable Next.js caching
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });

        if (!res.ok) throw new Error("Failed to fetch plans");
        
        const data = await res.json();
        
        // Deduplicate plans
        const uniquePlans = Array.isArray(data) 
          ? data.reduce((unique: any[], plan: any) => {
              const isDuplicate = unique.some(
                (p) => 
                  p.networkId === plan.networkId &&
                  p.sizeLabel === plan.sizeLabel &&
                  p.validity === plan.validity &&
                  p.price === plan.price
              );
              return isDuplicate ? unique : [...unique, plan];
            }, [])
          : [];
        
        setPlans(uniquePlans);
        const available = ["SME", "GIFTING", "CORPORATE"].find((cat) =>
          uniquePlans.some((p: any) => (p.category || "SME") === cat)
        ) as "SME" | "GIFTING" | "CORPORATE" | undefined;
        setPlanCategory(available || "SME");
      } catch (error) {
        toast.error("Couldn't load plans. Check your connection.");
        setBuyDataStage(1);
        setPlans([]);
      } finally {
        setBuyDataLoading(false);
      }
    })();
  }, [buyDataStage, selectedNetwork?.id]);

  // Load cable plans when buying cable
  useEffect(() => {
    if (buyCableStage !== 2 || cablePlans.length > 0 || !cableProvider) return;

    (async () => {
      setBuyCableLoading(true);
      try {
        const res = await fetch(`/api/admin/cable/plans?provider=${cableProvider.id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setCablePlans(Array.isArray(data) ? data : data.plans || []);
      } catch {
        toast.error("Couldn't load cable plans. Check your connection.");
        setBuyCableStage(1);
      } finally {
        setBuyCableLoading(false);
      }
    })();
  }, [buyCableStage, cableProvider, cablePlans.length]);

  // Load power plans when buying power
  useEffect(() => {
    if (buyPowerStage !== 3 || powerPlans.length > 0 || !powerProvider) return;

    (async () => {
      setBuyPowerLoading(true);
      try {
        const res = await fetch(`/api/admin/power/plans?provider=${powerProvider.id}&meterType=${meterType}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPowerPlans(Array.isArray(data) ? data : data.plans || []);
      } catch {
        toast.error("Couldn't load power plans. Check your connection.");
        setBuyPowerStage(2);
      } finally {
        setBuyPowerLoading(false);
      }
    })();
  }, [buyPowerStage, powerProvider, meterType, powerPlans.length]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/app/auth");
    } catch {
      toast.error("Logout failed");
    }
  };

  const dismissBroadcast = async (broadcastId: string) => {
    try {
      setDismissingBroadcastId(broadcastId);
      const res = await fetch(`/api/broadcasts/${broadcastId}/dismiss`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dismiss broadcast");
      setBroadcasts((current) => current.filter((item) => item.id !== broadcastId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to dismiss broadcast");
    } finally {
      setDismissingBroadcastId(null);
    }
  };

  const createReservedAccount = async () => {
    if (!selectedReservedBank) {
      toast.error("Select a bank first");
      return;
    }

    try {
      setCreatingReservedAccount(true);
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bankId: selectedReservedBank }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      const updatedAccounts = Array.isArray(data.accounts) ? data.accounts : [];
      setAccounts(updatedAccounts);
      setSelectedReservedBank("");

      const primaryAccount = updatedAccounts.find((account: ReservedAccount) => account.isPrimary);
      if (primaryAccount) {
        setUser((current) =>
          current
            ? {
                ...current,
                accountNumber: primaryAccount.accountNumber,
                bankName: primaryAccount.bankName || primaryAccount.bankId,
                accountName: primaryAccount.accountName || current.accountName,
              }
            : current
        );
      }

      toast.success(`${data.account?.bankName || selectedReservedBank} account created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setCreatingReservedAccount(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{
        background: T.bg, minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
        fontFamily: font,
      }}>
        {/* Pulsing brand circle */}
        <div
          style={{
            width: 80, height: 80, borderRadius: 24,
            background: `linear-gradient(135deg, ${T.blue}, ${T.violet})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 40px ${T.services.data.glow}`,
            animation: "pulse 1.8s ease-in-out infinite",
          }}
        >
          <Loader2 size={36} color="white" style={{ animation: "spin 1s linear infinite" }} />
        </div>
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
    { id: "contact",     label: "Support",      icon: Mail,     sc: T.services.contact     },
  ];

  const NAV = [
    { id: "home",         icon: Home,           label: "Home"         },
    { id: "accounts",     icon: Landmark,       label: "Accounts"     },
    { id: "transactions", icon: History,         label: "Transactions" },
    { id: "settings",     icon: SettingsIcon,    label: "Settings"     },
  ];


  // Modal wrapper
  const Modal = ({
    show, onClose, children,
  }: { show: boolean; onClose: () => void; children: React.ReactNode }) => (
    <>
      {show && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(15,42,31,0.22)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "flex-end",
          }}
        >
          <div
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
          </div>
        </div>
      )}
    </>
  );

  // Modal header row
  const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.textPrimary, letterSpacing: "-0.5px" }}>
        {title}
      </h2>
      <button
        onClick={onClose}
        style={{
          background: T.bgElevated, border: `1px solid ${T.border}`,
          borderRadius: 12, width: 38, height: 38,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: T.textSecondary,
        }}
      >
        <X size={18} />
      </button>
    </div>
  );

  // Coming-soon view for service tabs
  const ComingSoon = ({
    icon: Icon, label, color,
  }: { icon: any; label: string; color: string }) => (
    <div
      style={{ padding: "20px 20px 120px", fontFamily: font }}
    >
      <button
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
      </button>

      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div
          style={{
            width: 96, height: 96, borderRadius: 28, margin: "0 auto 32px",
            background: `radial-gradient(circle, ${color}22, ${color}08)`,
            border: `1.5px solid ${color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 40px ${color}22`,
            animation: "pulse 2.5s ease-in-out infinite",
          }}
        >
          <Icon size={44} color={color} strokeWidth={1.5} />
        </div>
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
          <div
            style={{ width: 8, height: 8, borderRadius: "50%", background: color, animation: "pulse 1.5s ease-in-out infinite" }}
          />
          <span style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600 }}>In development</span>
        </div>
      </div>
    </div>
  );

  // never unmounts/remounts it on parent re-renders, keeping the keyboard alive.
  // The plans-loading useEffect has been moved up to DanbaiwaApp above.
  const BuyDataCard = () => {
    // Progress indicator component
    const ProgressIndicator = () => (
      <div style={{
        display: "flex", gap: 6, justifyContent: "center", marginBottom: 24,
      }}>
        {[1, 2, 3, 4].map((stage) => (
          <div
            key={stage}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: stage < buyDataStage ? T.blue : stage === buyDataStage ? T.blue : T.border,
              cursor: "pointer", opacity: stage <= buyDataStage ? 1 : 0.3,
              transform: stage === buyDataStage ? "scale(1.2)" : "scale(1)",
              transition: "all 0.2s ease-out",
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
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background: T.bgElevated,
          border: `1px solid ${T.border}`,
          height: 100,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    );

    // Stage 1: Network + Phone Input
    if (buyDataStage === 1) {
      const phoneIsValid = phone.length === 11 && /^\d{11}$/.test(phone);
      const canContinue = selectedNetwork !== null && phoneIsValid;
      const detectDataNetwork = (value: string) => {
        const prefix = value.slice(0, 4);
        const match = DATA_NETWORK_PREFIXES.find((n) => n.prefix.test(prefix));
        if (!match) return null;
        return networks.find((n) => Number(n.id) === match.id) || null;
      };

      return (
        <div
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

          {/* Network selector - compact single row */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 20,
          }}>
            {networks.map((net) => {
              const isSelected = selectedNetwork?.id === net.id;
              return (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetwork(net)}
                  style={{
                    position: "relative",
                    padding: 6,
                    borderRadius: 10,
                    background: isSelected ? `${T.blue}15` : T.bgCard,
                    border: `1.5px solid ${isSelected ? T.blue : T.border}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    fontFamily: font,
                    minHeight: 52,
                  }}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <div style={{ position: "relative", width: 14, height: 14 }}>
                    <Image
                      src={net.logo}
                      alt={net.name}
                      fill
                      className="object-contain"
                      sizes="14px"
                      priority
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as any).style.display = "none";
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.textPrimary,
                    textAlign: "center",
                    lineHeight: 1.1,
                  }}>
                    {net.name}
                  </span>

                  {/* Checkmark badge */}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: T.blue,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={9} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
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
              ref={phoneInputRef}
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhone(digits);
                if (digits.length >= 4) {
                  const detected = detectDataNetwork(digits);
                  if (detected) setSelectedNetwork(detected);
                }
              }}
              onKeyDown={(e) => {
                const isDigit = /^\d$/.test(e.key);
                const isControlKey = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key);
                
                if (!isDigit && !isControlKey && e.key !== "Enter" && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
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
            <div
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: phoneIsValid ? 1 : 0,
                transition: "opacity 150ms ease",
                pointerEvents: phoneIsValid ? "auto" : "none",
              }}
            >
              <Check size={20} color={T.green} strokeWidth={3} />
            </div>

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
          {savedBeneficiaries.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 6 }}>Saved beneficiaries</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {savedBeneficiaries.slice(0, 8).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setPhone(String(b.phone || ""));
                      const net = networks.find((n) => Number(n.id) === Number(b.network_id));
                      if (net) setSelectedNetwork(net);
                    }}
                    style={{ border: `1px solid ${T.border}`, background: T.bgCard, color: T.textSecondary, borderRadius: 999, padding: "6px 10px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {b.network_name || "Network"} • {b.phone}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
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
          </button>
        </div>
      );
    }

    // Stage 2: Plan Selection
    if (buyDataStage === 2) {
      return (
        <div
          style={{
            padding: "20px 20px 120px",
            fontFamily: font,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ProgressIndicator />

          {/* Back button */}
          <button
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
          </button>

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
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                style={{ margin: "0 auto 16px", opacity: 0.5 }}
              >
                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" />
                <path d="M 30 35 L 50 45 L 30 55" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: 15, margin: "0 0 8px", fontWeight: 500 }}>
                No plans available
              </p>
              <p style={{ fontSize: 13, margin: 0, color: T.textMuted }}>
                for {selectedNetwork?.name} right now.
              </p>
            </div>
          ) : (
            <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {(["SME", "GIFTING", "CORPORATE"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPlanCategory(cat)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: `1px solid ${planCategory === cat ? T.blue : T.border}`,
                    background: planCategory === cat ? `${T.blue}25` : T.bgCard,
                    color: planCategory === cat ? T.blue : T.textSecondary,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: font,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}>
              {plans.filter((plan) => (plan.category || "SME") === planCategory).map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => {
                    if (!plan.isActive) return;
                    setSelectedPlan(plan);
                    setBuyDataStage(3);
                  }}
                  disabled={!plan.isActive}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: T.bgCard,
                    border: `1.5px solid ${!plan.isActive ? `${T.red}66` : T.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: !plan.isActive ? "not-allowed" : "pointer",
                    transition: "all 150ms ease",
                    fontFamily: font,
                    textAlign: "left",
                    filter: !plan.isActive ? "blur(0.6px) grayscale(0.35)" : "none",
                    opacity: !plan.isActive ? 0.65 : 1,
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
                  {!plan.isActive && <div style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>Temporarily unavailable</div>}
                </button>
              ))}
            </div>
            </>
          )}
        </div>
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
            const pinMsg = "Incorrect PIN. Please check and try again.";
            toast.error(pinMsg);
            setBuyDataError(pinMsg);
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
            if (error.error?.toLowerCase?.().includes("insufficient")) {
              const msg = "Insufficient wallet balance. Please fund your wallet and try again.";
              toast.error(msg);
              setBuyDataError(msg);
            } else if (error.error?.toLowerCase?.().includes("phone") || error.error?.toLowerCase?.().includes("number")) {
              const msg = "Invalid phone number. Enter a valid 11-digit number.";
              toast.error(msg);
              setBuyDataError(msg);
            } else if (error.error?.includes("refunded")) {
              const msg = "Purchase failed but your wallet has been refunded.";
              toast.error(msg);
              setBuyDataError(msg);
            } else {
              const msg = "We could not complete this purchase right now. Please try again.";
              toast.error(msg);
              setBuyDataError(msg);
            }
            setPinInput(["", "", "", "", "", ""]);
            setBuyDataLoading(false);
            return;
          }

          const data = await purchaseRes.json();
          if (saveBeneficiary) {
            fetch("/api/data/beneficiaries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                phone,
                networkId: selectedNetwork?.id,
                networkName: selectedNetwork?.name,
                label: selectedPlan?.sizeLabel || "Data",
              }),
            }).catch(() => {});
          }
          toast.success(`Data purchase successful for ${phone}.`);
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
        <div
          style={{
            padding: "20px 20px 120px",
            fontFamily: font,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ProgressIndicator />

          {/* Back button */}
          <button
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
          </button>

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
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: T.textSecondary, fontSize: 12 }}>
            <input type="checkbox" checked={saveBeneficiary} onChange={(e) => setSaveBeneficiary(e.target.checked)} />
            Save this beneficiary for future purchases
          </label>

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
          <div
            style={{
              background: `${T.red}20`,
              border: `1px solid ${T.red}50`,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: T.red,
              fontSize: 13,
              fontWeight: 500,
              opacity: buyDataError ? 1 : 0,
              maxHeight: buyDataError ? "100%" : "0",
              overflow: "hidden",
              transition: "opacity 150ms ease, max-height 150ms ease",
              pointerEvents: buyDataError ? "auto" : "none",
            }}
            role="alert"
          >
            {buyDataError}
          </div>

          {/* Confirm & Pay button */}
          <button
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
          </button>
        </div>
      );
    }

    // Stage 4: Success
    if (buyDataStage === 4) {
      return (
        <div
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

            <div style={{ marginBottom: 28, textAlign: "left" }}>
              <TransactionReceipt
                beneficiaryNumber={phone}
                planBought={selectedPlan?.sizeLabel || selectedPlan?.name || "Data Plan"}
                price={Number(successData?.amount || 0)}
                status={String(successData?.status || "SUCCESS")}
                reference={String(successData?.reference || "")}
                networkName={selectedNetwork?.name || selectedPlan?.networkName || "N/A"}
                createdAt={successData?.createdAt || null}
              />
            </div>
            <button
              onClick={() =>
                downloadTransactionReceiptPng({
                  id: successData?.transactionId || successData?.reference || "data-receipt",
                  planName: selectedPlan?.sizeLabel || selectedPlan?.name || "Data Plan",
                  networkName: selectedNetwork?.name || selectedPlan?.networkName || "N/A",
                  phone,
                  amount: Number(successData?.amount || selectedPlan?.price || 0),
                  status: String(successData?.status || "SUCCESS"),
                  reference: String(successData?.reference || ""),
                  createdAt: successData?.createdAt || new Date().toISOString(),
                })
              }
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                background: T.bgCard,
                border: `1.5px solid ${T.green}`,
                color: T.green,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 10,
                fontFamily: font,
              }}
            >
              Download Receipt
            </button>
            <button
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
                padding: 12,
                borderRadius: 12,
                background: T.blue,
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const AIRTIME_NETWORKS: AirtimeNetwork[] = [
    { id: 1, name: "MTN", prefix: /^(0803|0806|0703|0706|0810|0813|0814|0816|0903|0906|0913|0916)/, color: "#FFD700", hexColor: "#ffd700" },
    { id: 2, name: "Airtel", prefix: /^(0801|0802|0808|0812|0701|0708|0902|0904|0907|0912)/, color: "#DC143C", hexColor: "#dc143c" },
    { id: 3, name: "Glo", prefix: /^(0805|0807|0811|0815|0705|0905|0915)/, color: "#228B22", hexColor: "#228b22" },
    { id: 4, name: "9mobile", prefix: /^(0809|0817|0818|0908|0909)/, color: "#006400", hexColor: "#006400" },
  ];

  const CABLE_PROVIDERS = [
    { id: "dstv", name: "DSTV", logo: "📺" },
    { id: "gotv", name: "GOTV", logo: "📺" },
    { id: "startimes", name: "Startimes", logo: "📺" },
  ];

  const POWER_PROVIDERS = [
    { id: "ekedc", name: "EKEDC", logo: "⚡" },
    { id: "ibadanelectricity", name: "Ibadan Electricity", logo: "⚡" },
    { id: "enugu", name: "Enugu Electricity", logo: "⚡" },
    { id: "kano", name: "Kano Electricity", logo: "⚡" },
    { id: "kaduna", name: "Kaduna Electricity", logo: "⚡" },
  ];

  const METER_TYPES = [
    { id: "PREPAID", label: "Prepaid Meter", description: "Buy credit upfront" },
    { id: "POSTPAID", label: "Postpaid Meter", description: "Pay after usage" },
  ];

  const BuyAirtimeCard = () => {
    // Detect which network a phone prefix belongs to
    const detectNetwork = (phone: string) => {
      if (!phone || phone.length < 4) return null;
      const prefix = phone.slice(0, 4);
      return AIRTIME_NETWORKS.find(net => net.prefix.test(prefix)) || null;
    };

    // Progress indicator
    const ProgressIndicator = () => (
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: s <= buyAirtimeStage ? T.blue : T.border,
            opacity: s <= buyAirtimeStage ? 1 : 0.3,
            transform: s === buyAirtimeStage ? "scale(1.2)" : "scale(1)",
            transition: "all 0.2s ease-out", cursor: "pointer",
          }} onClick={() => s < buyAirtimeStage && setBuyAirtimeStage(s)} />
        ))}
      </div>
    );

    // STAGE 1: Combined Network + Phone + Amount Selection
    if (buyAirtimeStage === 1) {
      const PRESETS = [50, 100, 200, 500, 1000];
      const phoneValid = airtimePhone.length === 11 && /^0\d{10}$/.test(airtimePhone);
      const amountNum = parseInt(airtimeAmount) || 0;
      const amountValid = amountNum >= 50 && amountNum <= 5000;
      const selectedPreset = PRESETS.includes(amountNum) ? amountNum : null;
      const detectedNet = detectNetwork(airtimePhone);
      const networkMismatch = phoneValid && detectedNet && detectedNet.id !== airtimeNetwork?.id;
      const allValid = airtimeNetwork && phoneValid && amountValid;

      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />

          {/* Network Selection */}
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Network</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
            {AIRTIME_NETWORKS.map((net) => (
              <button key={net.id} onClick={() => { setAirtimeNetwork(net); setShowNetworkWarning(false); setBuyAirtimeError(""); }}
                style={{
                  padding: 12, borderRadius: 12, background: airtimeNetwork?.id === net.id ? `${net.color}15` : T.bgCard,
                  border: `2px solid ${airtimeNetwork?.id === net.id ? net.color : T.border}`, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all 150ms",
                  fontFamily: font,
                }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: net.color, opacity: 0.3 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>{net.name}</span>
              </button>
            ))}
          </div>

          {/* Phone Input */}
          {airtimeNetwork && (
            <>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone Number</h3>
              <input type="tel" inputMode="numeric" maxLength={11} placeholder="08012345678" value={airtimePhone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  const detected = detectNetwork(digits);
                  setAirtimePhone(digits);
                  setShowNetworkWarning(false);
                  setBuyAirtimeError("");
                  if (detected) {
                    setAirtimeNetwork(detected);
                  }
                }}
                ref={airtimePhoneInputRef}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, background: T.bgCard,
                  border: `1.5px solid ${phoneValid ? T.green : T.border}`, color: T.textPrimary, fontSize: 15,
                  fontFamily: font, boxSizing: "border-box", transition: "all 150ms", marginBottom: 6,
                }} />
              <div style={{ fontSize: 12, color: phoneValid ? T.green : T.textMuted, marginBottom: 16, fontWeight: 500 }}>
                {airtimePhone.length}/11 digits
              </div>

              {networkMismatch && !showNetworkWarning && (
                <div style={{
                  background: `${T.amber}20`, border: `1px solid ${T.amber}50`, borderRadius: 12, padding: 12,
                  marginBottom: 16, color: T.amber, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>⚠ Looks like {detectedNet?.name}, not {airtimeNetwork?.name}</span>
                  <button onClick={() => setShowNetworkWarning(true)} style={{ background: "transparent", border: "none", color: T.amber, cursor: "pointer", fontWeight: 600 }}>Use anyway →</button>
                </div>
              )}
            </>
          )}

          {/* Amount Selection */}
          {phoneValid && (
            <>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Amount</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
                {PRESETS.map((amt) => (
                  <button key={amt} onClick={() => setAirtimeAmount(String(amt))}
                    style={{
                      padding: 10, borderRadius: 10, background: selectedPreset === amt ? T.blue : T.bgCard,
                      border: `1.5px solid ${selectedPreset === amt ? T.blue : T.border}`, color: selectedPreset === amt ? "#fff" : T.textPrimary,
                      fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: font, transition: "all 150ms",
                    }}>₦{amt.toLocaleString()}</button>
                ))}
              </div>

              <input type="number" inputMode="decimal" placeholder="Custom (₦50-₦5,000)" value={airtimeAmount}
                onChange={(e) => setAirtimeAmount(e.target.value.replace(/\D/g, ""))}
                min="50" max="5000"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12, background: T.bgCard,
                  border: `1.5px solid ${amountValid && airtimeAmount ? T.green : T.border}`, color: T.textPrimary, fontSize: 14,
                  fontFamily: font, boxSizing: "border-box", transition: "all 150ms", marginBottom: 6,
                }} />
              {!amountValid && airtimeAmount && (
                <div style={{ fontSize: 12, color: T.red, marginBottom: 16 }}>
                  {amountNum < 50 ? "Minimum is ₦50" : "Maximum is ₦5,000"}
                </div>
              )}
              {amountValid && (
                <div style={{ fontSize: 12, color: T.green, marginBottom: 16, fontWeight: 600 }}>✓ Valid amount</div>
              )}
            </>
          )}

          <button onClick={() => { if (showNetworkWarning) setShowNetworkWarning(false); setBuyAirtimeStage(2); }} disabled={!allValid}
            style={{
              width: "100%", padding: 14, borderRadius: 12, background: allValid ? T.blue : T.bgElevated,
              border: "none", color: allValid ? "#fff" : T.textMuted, fontSize: 16, fontWeight: 600,
              cursor: allValid ? "pointer" : "not-allowed", opacity: allValid ? 1 : 0.5,
              fontFamily: font, transition: "all 150ms", marginTop: 8,
            }}>{allValid ? "Review Order" : "Complete Selection"}</button>
        </div>
      );
    }

    // STAGE 2: Review Only - No Submission
    if (buyAirtimeStage === 2) {
      const amountNum = parseInt(airtimeAmount) || 0;

      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />
          <button onClick={() => setBuyAirtimeStage(1)} style={{
            background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 8, color: T.blue, fontSize: 12, fontWeight: 600,
            cursor: "pointer", marginBottom: 24, fontFamily: font,
          }}><ArrowLeft size={14} /> Back</button>

          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary }}>Review & Confirm</h2>

          <div style={{
            background: T.bgElevated, borderRadius: 16, padding: 20, marginBottom: 24, border: `1px solid ${T.border}`,
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>Network</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{airtimeNetwork?.name}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>Phone Number</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary }}>{airtimePhone}</div>
            </div>
            <div style={{ height: 1, background: T.border, marginBottom: 16 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>Amount</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.green }}>₦{amountNum.toLocaleString()}</div>
            </div>
          </div>

          <button onClick={() => { setBuyAirtimeStage(3); setAirtimePinInput(["", "", "", "", "", ""]); setBuyAirtimeError(""); }}
            style={{
              width: "100%", padding: 14, borderRadius: 12, background: T.blue, border: "none",
              color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, fontFamily: font, transition: "all 150ms",
            }}>
            Continue to PIN
          </button>
        </div>
      );
    }

    // STAGE 3: PIN Confirmation
    if (buyAirtimeStage === 3) {
      const amountNum = parseInt(airtimeAmount) || 0;
      const pinFull = airtimePinInput.every((d) => d !== "");

      const handlePinSubmit = async () => {
        if (!pinFull) return;

        setBuyAirtimeLoading(true);
        setBuyAirtimeError("");

        try {
          const res = await fetch("/api/airtime", {
            method: "POST", headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              network: airtimeNetwork?.id, 
              mobile_number: airtimePhone, 
              amount: amountNum,
              pin: airtimePinInput.join("")
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            const rawMsg = data?.errors?.amount?.[0] || data?.errors?.mobile_number?.[0] || data?.error || "Purchase failed";
            const msgLower = String(rawMsg).toLowerCase();
            const friendlyMsg =
              msgLower.includes("pin") ? "Incorrect PIN. Please try again." :
              msgLower.includes("insufficient") ? "Insufficient wallet balance. Please fund your wallet." :
              msgLower.includes("valid") || msgLower.includes("number") ? "Invalid phone number. Enter a valid 11-digit number." :
              msgLower.includes("refunded") ? "Purchase failed but your wallet has been refunded." :
              "Airtime purchase failed. Please try again.";
            setBuyAirtimeError(friendlyMsg);
            toast.error(friendlyMsg);
            setAirtimePinInput(["", "", "", "", "", ""]);
            setBuyAirtimeLoading(false);
            return;
          }

          toast.success(`Airtime purchase successful for ${airtimePhone}.`);
          setAirtimeSuccessData(data);
          setAirtimePinInput(["", "", "", "", "", ""]);
          setBuyAirtimeStage(4);
        } catch (err: any) {
          const msg = err.message || "Network error. Please try again.";
          setBuyAirtimeError(msg);
          toast.error(msg);
          setAirtimePinInput(["", "", "", "", "", ""]);
        } finally {
          setBuyAirtimeLoading(false);
        }
      };

      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font, position: "relative", overflow: "hidden" }}>
          <ProgressIndicator />

          <button onClick={() => { setBuyAirtimeStage(2); setAirtimePinInput(["", "", "", "", "", ""]); setBuyAirtimeError(""); }}
            style={{
              background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 16px",
              display: "flex", alignItems: "center", gap: 8, color: T.blue, fontSize: 14, fontWeight: 600,
              cursor: "pointer", marginBottom: 24, fontFamily: font,
            }}>
            <ArrowLeft size={16} /> Back
          </button>

          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.5px" }}>
            Confirm Purchase
          </h2>

          <div style={{ background: T.bgElevated, borderRadius: 16, padding: 16, marginBottom: 24, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Network</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{airtimeNetwork?.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Phone</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{airtimePhone}</span>
            </div>
            <div style={{ height: 1, background: T.border, margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.textSecondary, fontWeight: 600, fontSize: 14 }}>Amount</span>
              <span style={{ color: T.green, fontWeight: 700, fontSize: 18 }}>
                ₦{amountNum.toLocaleString()}
              </span>
            </div>
          </div>

          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.textSecondary, marginBottom: 12 }}>
            Enter your 6-digit PIN
          </label>

          <div style={{ marginBottom: 16 }}>
            <PinInput
              value={airtimePinInput}
              onChange={setAirtimePinInput}
              error={buyAirtimeError.length > 0}
              disabled={buyAirtimeLoading}
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

          <div style={{
            background: `${T.red}20`, border: `1px solid ${T.red}50`, borderRadius: 12, padding: 12,
            marginBottom: 16, color: T.red, fontSize: 13, fontWeight: 500,
            opacity: buyAirtimeError ? 1 : 0, maxHeight: buyAirtimeError ? "100%" : "0",
            overflow: "hidden", transition: "opacity 150ms ease, max-height 150ms ease",
            pointerEvents: buyAirtimeError ? "auto" : "none",
          }} role="alert">
            {buyAirtimeError}
          </div>

          <button onClick={handlePinSubmit} disabled={!pinFull || buyAirtimeLoading}
            style={{
              width: "100%", padding: 14, borderRadius: 12, background: pinFull && !buyAirtimeLoading ? T.blue : T.bgElevated,
              border: "none", color: "#fff", fontSize: 16, fontWeight: 600,
              cursor: pinFull && !buyAirtimeLoading ? "pointer" : "not-allowed",
              opacity: pinFull && !buyAirtimeLoading ? 1 : 0.5, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, fontFamily: font, transition: "all 150ms ease",
            }} aria-disabled={!pinFull || buyAirtimeLoading}>
            {buyAirtimeLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
            {buyAirtimeLoading ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      );
    }

    // STAGE 4: Success
    if (buyAirtimeStage === 4) {
      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font, textAlign: "center" }}>
          <ProgressIndicator />
          <SuccessCheck greenColor={T.green} size={80} />
          <h2 style={{ margin: "16px 0 8px", fontSize: 24, fontWeight: 800, color: T.textPrimary }}>Airtime Sent!</h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: T.textSecondary }}>
            ₦{(parseInt(airtimeAmount) || 0).toLocaleString()} to {airtimePhone}
          </p>`r`n          <div style={{ marginBottom: 24, textAlign: "left" }}>
            <TransactionReceipt
              beneficiaryNumber={airtimePhone}
              planBought={`${airtimeNetwork?.name || "Network"} Airtime`}
              price={Number(parseInt(airtimeAmount) || 0)}
              status={String(airtimeSuccessData?.status || "SUCCESS")}
              reference={String(airtimeSuccessData?.reference || "--")}
              networkName={airtimeNetwork?.name || "N/A"}
              createdAt={airtimeSuccessData?.createdAt || null}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { setBuyAirtimeStage(1); setAirtimePhone(""); setAirtimeAmount(""); setAirtimeNetwork(null); setAirtimeSuccessData(null); setBuyAirtimeError(""); setShowNetworkWarning(false); setAirtimePinInput(["", "", "", "", "", ""]); }}
              style={{
                width: "100%", padding: 12, borderRadius: 12, background: T.blue, border: "none",
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: font,
              }}>Send Another</button>
          </div>
        </div>
      );
    }

    return null;
  };

  const BuyCableCard = () => {
    const ProgressIndicator = () => (
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
        {[1, 2, 3, 4].map((stage) => (
          <div
            key={stage}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: stage < buyCableStage ? T.blue : stage === buyCableStage ? T.blue : T.border,
              cursor: "pointer", opacity: stage <= buyCableStage ? 1 : 0.3,
              transform: stage === buyCableStage ? "scale(1.2)" : "scale(1)",
              transition: "all 0.2s ease-out",
            }}
            onClick={() => stage < buyCableStage && setBuyCableStage(stage)}
          />
        ))}
      </div>
    );

    // Stage 1: Provider + Smart Card
    if (buyCableStage === 1) {
      const smartCardValid = smartCardNumber.length >= 10 && /^\d+$/.test(smartCardNumber);
      const canContinue = cableProvider !== null && smartCardValid;

      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />
          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary }}>Select Provider</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {CABLE_PROVIDERS.map((provider) => {
              const isSelected = cableProvider?.id === provider.id;
              return (
                <button
                  key={provider.id}
                  onClick={() => setCableProvider(provider)}
                  style={{
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
                >
                  <div style={{ fontSize: 32 }}>{provider.logo}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{provider.name}</span>
                  {isSelected && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: T.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: T.textPrimary }}>Smart Card Number</h2>
          <div style={{ position: "relative", marginBottom: 24 }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={20}
              placeholder="e.g. 1234567890"
              value={smartCardNumber}
              onChange={(e) => setSmartCardNumber(e.target.value.replace(/\D/g, "").slice(0, 20))}
              style={{
                width: "100%",
                padding: "12px 40px 12px 14px",
                borderRadius: 12,
                background: T.bgCard,
                border: `1.5px solid ${smartCardValid ? T.green : T.border}`,
                color: T.textPrimary,
                fontSize: 16,
                fontFamily: font,
                boxSizing: "border-box",
                transition: "all 150ms ease",
              }}
            />
            <div style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: smartCardValid ? 1 : 0,
              transition: "opacity 150ms ease",
              pointerEvents: smartCardValid ? "auto" : "none",
            }}>
              <Check size={20} color={T.green} strokeWidth={3} />
            </div>
            <div style={{ fontSize: 12, color: smartCardValid ? T.green : T.textMuted, textAlign: "right", marginTop: 6, fontWeight: 500 }}>
              {smartCardNumber.length}/10
            </div>
          </div>

          <button
            onClick={() => canContinue && setBuyCableStage(2)}
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
          >
            Continue
          </button>
        </div>
      );
    }

    // Stage 2: Plan Selection
    if (buyCableStage === 2) {
      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />
          <button
            onClick={() => setBuyCableStage(1)}
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
          </button>

          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary }}>Select Plan</h2>

          {buyCableLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 16, background: T.bgElevated, border: `1px solid ${T.border}`, height: 80, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : cablePlans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: T.textSecondary }}>
              <p style={{ fontSize: 15, margin: "0 0 8px", fontWeight: 500 }}>No plans available</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {cablePlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => {
                    setSelectedCablePlan(plan);
                    setBuyCableStage(3);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: T.bgCard,
                    border: `1.5px solid ${T.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    fontFamily: font,
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>{plan.planName}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Plan Code: {plan.planCode}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.blue }}>₦{(plan.price || 0).toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Stage 3: PIN Confirmation
    if (buyCableStage === 3) {
      const pinFull = cablePinInput.every((d) => d !== "");

      const handlePinSubmit = async () => {
        if (!pinFull) return;

        setBuyCableLoading(true);
        setBuyCableError("");

        try {
          const validateRes = await fetch("/api/data/validate-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ pin: cablePinInput.join("") }),
          });

          if (!validateRes.ok) {
            const error = await validateRes.json();
            setBuyCableError(error.error || "Incorrect PIN");
            setCablePinInput(["", "", "", "", "", ""]);
            setBuyCableLoading(false);
            return;
          }

          const purchaseRes = await fetch("/api/cable/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              provider: cableProvider.id,
              smartCardNumber,
              planCode: selectedCablePlan.planCode,
              pin: cablePinInput.join(""),
            }),
          });

          if (!purchaseRes.ok) {
            const error = await purchaseRes.json();
            if (error.error?.includes("Insufficient balance")) {
              setBuyCableError("Insufficient balance. Please fund your wallet.");
            } else if (error.error?.includes("refunded")) {
              toast.error("Delivery failed. Your balance has been refunded.");
              setBuyCableError("Delivery failed. Your balance has been refunded.");
            } else {
              setBuyCableError(error.error || "Purchase failed");
            }
            setCablePinInput(["", "", "", "", "", ""]);
            setBuyCableLoading(false);
            return;
          }

          const data = await purchaseRes.json();
          toast.success(`?${(data.amount || 0).toLocaleString()} ? ${selectedCablePlan.planName} subscribed ?`);
          setCableSuccessData(data);
          setCablePinInput(["", "", "", "", "", ""]);
          setBuyCableStage(4);
        } catch (error: any) {
          toast.error("Something went wrong. Please try again.");
          setBuyCableError(error.message || "An error occurred");
          setCablePinInput(["", "", "", "", "", ""]);
        } finally {
          setBuyCableLoading(false);
        }
      };

      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />
          <button
            onClick={() => {
              setBuyCableStage(2);
              setCablePinInput(["", "", "", "", "", ""]);
              setBuyCableError("");
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
          </button>

          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary }}>Confirm Purchase</h2>

          <div style={{
            background: T.bgElevated,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Provider</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{cableProvider?.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Smart Card</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{smartCardNumber}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Plan</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{selectedCablePlan?.planName}</span>
            </div>
            <div style={{ height: 1, background: T.border, margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.textSecondary, fontWeight: 600, fontSize: 14 }}>Amount</span>
              <span style={{ color: T.green, fontWeight: 700, fontSize: 18 }}>₦{(selectedCablePlan?.price || 0).toLocaleString()}</span>
            </div>
          </div>

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
              value={cablePinInput}
              onChange={setCablePinInput}
              error={buyCableError.length > 0}
              disabled={buyCableLoading}
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

          <div
            style={{
              background: `${T.red}20`,
              border: `1px solid ${T.red}50`,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: T.red,
              fontSize: 13,
              fontWeight: 500,
              opacity: buyCableError ? 1 : 0,
              maxHeight: buyCableError ? "100%" : "0",
              overflow: "hidden",
              transition: "opacity 150ms ease, max-height 150ms ease",
              pointerEvents: buyCableError ? "auto" : "none",
            }}
            role="alert"
          >
            {buyCableError}
          </div>

          <button
            onClick={handlePinSubmit}
            disabled={!pinFull || buyCableLoading}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              background: pinFull && !buyCableLoading ? T.blue : T.bgElevated,
              border: "none",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: pinFull && !buyCableLoading ? "pointer" : "not-allowed",
              opacity: pinFull && !buyCableLoading ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: font,
              transition: "all 150ms ease",
            }}
          >
            {buyCableLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
            {buyCableLoading ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      );
    }

    // Stage 4: Success
    if (buyCableStage === 4) {
      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font, textAlign: "center" }}>
          <ProgressIndicator />
          <SuccessCheck greenColor={T.green} size={80} />
          <h2 style={{ margin: "16px 0 8px", fontSize: 26, fontWeight: 800, color: T.textPrimary }}>Subscription Activated!</h2>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: T.textSecondary }}>
            Your {selectedCablePlan?.planName} subscription is now active
          </p>

          <div style={{
            background: T.bgElevated,
            borderRadius: 16,
            padding: 20,
            marginBottom: 28,
            border: `1px solid ${T.border}`,
            textAlign: "left",
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>Reference</div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: T.textPrimary,
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}>
                {cableSuccessData?.reference || cableSuccessData?.ident}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>Amount Paid</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>
                ₦{(cableSuccessData?.amount || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => {
                setBuyCableStage(1);
                setCableProvider(null);
                setSmartCardNumber("");
                setSelectedCablePlan(null);
                setCablePinInput(["", "", "", "", "", ""]);
                setBuyCableError("");
                setCableSuccessData(null);
                setCablePlans([]);
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
                fontFamily: font,
              }}
            >
              Done
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const BuyPowerCard = () => {
    const ProgressIndicator = () => (
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
        {[1, 2, 3, 4].map((stage) => (
          <div
            key={stage}
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: stage < buyPowerStage ? T.blue : stage === buyPowerStage ? T.blue : T.border,
              cursor: "pointer", opacity: stage <= buyPowerStage ? 1 : 0.3,
              transform: stage === buyPowerStage ? "scale(1.2)" : "scale(1)",
              transition: "all 0.2s ease-out",
            }}
            onClick={() => stage < buyPowerStage && setBuyPowerStage(stage)}
          />
        ))}
      </div>
    );

    // Stage 1: Meter Type Selection
    if (buyPowerStage === 1) {
      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />
          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary }}>Select Meter Type</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 28 }}>
            {METER_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setMeterType(type.id as "PREPAID" | "POSTPAID");
                  setBuyPowerStage(2);
                }}
                style={{
                  padding: 20,
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
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>{type.label}</div>
                <div style={{ fontSize: 13, color: T.textSecondary }}>{type.description}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Stage 2: Provider + Meter Number
    if (buyPowerStage === 2) {
      const meterValid = meterNumber.length >= 9 && /^\d+$/.test(meterNumber);
      const canContinue = powerProvider !== null && meterValid;

      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />
          <button
            onClick={() => setBuyPowerStage(1)}
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
          </button>

          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary }}>Select Provider</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {POWER_PROVIDERS.map((provider) => {
              const isSelected = powerProvider?.id === provider.id;
              return (
                <button
                  key={provider.id}
                  onClick={() => setPowerProvider(provider)}
                  style={{
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
                >
                  <div style={{ fontSize: 32 }}>{provider.logo}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, textAlign: "center" }}>{provider.name}</span>
                  {isSelected && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: T.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={14} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: T.textPrimary }}>Meter Number</h2>
          <div style={{ position: "relative", marginBottom: 24 }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={20}
              placeholder="e.g. 09123456789"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, "").slice(0, 20))}
              style={{
                width: "100%",
                padding: "12px 40px 12px 14px",
                borderRadius: 12,
                background: T.bgCard,
                border: `1.5px solid ${meterValid ? T.green : T.border}`,
                color: T.textPrimary,
                fontSize: 16,
                fontFamily: font,
                boxSizing: "border-box",
                transition: "all 150ms ease",
              }}
            />
            <div style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              opacity: meterValid ? 1 : 0,
              transition: "opacity 150ms ease",
              pointerEvents: meterValid ? "auto" : "none",
            }}>
              <Check size={20} color={T.green} strokeWidth={3} />
            </div>
            <div style={{ fontSize: 12, color: meterValid ? T.green : T.textMuted, textAlign: "right", marginTop: 6, fontWeight: 500 }}>
              {meterNumber.length}/9
            </div>
          </div>

          <button
            onClick={() => canContinue && setBuyPowerStage(3)}
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
          >
            Continue
          </button>
        </div>
      );
    }

    // Stage 3: Plan Selection
    if (buyPowerStage === 3) {
      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />
          <button
            onClick={() => setBuyPowerStage(2)}
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
          </button>

          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary }}>Select Plan</h2>

          {buyPowerLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 16, background: T.bgElevated, border: `1px solid ${T.border}`, height: 80, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : powerPlans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: T.textSecondary }}>
              <p style={{ fontSize: 15, margin: "0 0 8px", fontWeight: 500 }}>No plans available</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {powerPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => {
                    setSelectedPowerPlan(plan);
                    setBuyPowerStage(4);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: T.bgCard,
                    border: `1.5px solid ${T.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    fontFamily: font,
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>{plan.planName || "Electricity Plan"}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Amount: ₦{(plan.price || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.blue }}>₦{(plan.price || 0).toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Stage 4: PIN Confirmation
    if (buyPowerStage === 4) {
      const pinFull = powerPinInput.every((d) => d !== "");

      const handlePinSubmit = async () => {
        if (!pinFull) return;

        setBuyPowerLoading(true);
        setBuyPowerError("");

        try {
          const validateRes = await fetch("/api/data/validate-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ pin: powerPinInput.join("") }),
          });

          if (!validateRes.ok) {
            const error = await validateRes.json();
            setBuyPowerError(error.error || "Incorrect PIN");
            setPowerPinInput(["", "", "", "", "", ""]);
            setBuyPowerLoading(false);
            return;
          }

          const purchaseRes = await fetch("/api/power/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              provider: powerProvider.id,
              meterType,
              meterNumber,
              amount: selectedPowerPlan.price,
              pin: powerPinInput.join(""),
            }),
          });

          if (!purchaseRes.ok) {
            const error = await purchaseRes.json();
            if (error.error?.includes("Insufficient balance")) {
              setBuyPowerError("Insufficient balance. Please fund your wallet.");
            } else if (error.error?.includes("refunded")) {
              toast.error("Delivery failed. Your balance has been refunded.");
              setBuyPowerError("Delivery failed. Your balance has been refunded.");
            } else {
              setBuyPowerError(error.error || "Purchase failed");
            }
            setPowerPinInput(["", "", "", "", "", ""]);
            setBuyPowerLoading(false);
            return;
          }

          const data = await purchaseRes.json();
          toast.success(`?${(data.amount || 0).toLocaleString()} ? Power credit loaded ?`);
          setPowerSuccessData(data);
          setPowerPinInput(["", "", "", "", "", ""]);
          setBuyPowerStage(5);
        } catch (error: any) {
          toast.error("Something went wrong. Please try again.");
          setBuyPowerError(error.message || "An error occurred");
          setPowerPinInput(["", "", "", "", "", ""]);
        } finally {
          setBuyPowerLoading(false);
        }
      };

      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
          <ProgressIndicator />
          <button
            onClick={() => {
              setBuyPowerStage(3);
              setPowerPinInput(["", "", "", "", "", ""]);
              setBuyPowerError("");
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
          </button>

          <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: T.textPrimary }}>Confirm Purchase</h2>

          <div style={{
            background: T.bgElevated,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Provider</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{powerProvider?.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Meter Type</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{meterType}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
              <span style={{ color: T.textSecondary, fontWeight: 500 }}>Meter Number</span>
              <span style={{ color: T.textPrimary, fontWeight: 600 }}>{meterNumber}</span>
            </div>
            <div style={{ height: 1, background: T.border, margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.textSecondary, fontWeight: 600, fontSize: 14 }}>Amount</span>
              <span style={{ color: T.green, fontWeight: 700, fontSize: 18 }}>₦{(selectedPowerPlan?.price || 0).toLocaleString()}</span>
            </div>
          </div>

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
              value={powerPinInput}
              onChange={setPowerPinInput}
              error={buyPowerError.length > 0}
              disabled={buyPowerLoading}
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

          <div
            style={{
              background: `${T.red}20`,
              border: `1px solid ${T.red}50`,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: T.red,
              fontSize: 13,
              fontWeight: 500,
              opacity: buyPowerError ? 1 : 0,
              maxHeight: buyPowerError ? "100%" : "0",
              overflow: "hidden",
              transition: "opacity 150ms ease, max-height 150ms ease",
              pointerEvents: buyPowerError ? "auto" : "none",
            }}
            role="alert"
          >
            {buyPowerError}
          </div>

          <button
            onClick={handlePinSubmit}
            disabled={!pinFull || buyPowerLoading}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              background: pinFull && !buyPowerLoading ? T.blue : T.bgElevated,
              border: "none",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: pinFull && !buyPowerLoading ? "pointer" : "not-allowed",
              opacity: pinFull && !buyPowerLoading ? 1 : 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: font,
              transition: "all 150ms ease",
            }}
          >
            {buyPowerLoading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
            {buyPowerLoading ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      );
    }

    // Stage 5: Success
    if (buyPowerStage === 5) {
      return (
        <div style={{ padding: "20px 20px 120px", fontFamily: font, textAlign: "center" }}>
          <ProgressIndicator />
          <SuccessCheck greenColor={T.green} size={80} />
          <h2 style={{ margin: "16px 0 8px", fontSize: 26, fontWeight: 800, color: T.textPrimary }}>Payment Successful!</h2>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: T.textSecondary }}>
            Power credit has been loaded to your meter
          </p>

          <div style={{
            background: T.bgElevated,
            borderRadius: 16,
            padding: 20,
            marginBottom: 28,
            border: `1px solid ${T.border}`,
            textAlign: "left",
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>Reference</div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: T.textPrimary,
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}>
                {powerSuccessData?.reference || powerSuccessData?.ident}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4, fontWeight: 500 }}>Amount Paid</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>
                ₦{(powerSuccessData?.amount || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => {
                setBuyPowerStage(1);
                setMeterType(null);
                setMeterNumber("");
                setPowerProvider(null);
                setSelectedPowerPlan(null);
                setPowerPinInput(["", "", "", "", "", ""]);
                setBuyPowerError("");
                setPowerSuccessData(null);
                setPowerPlans([]);
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
                fontFamily: font,
              }}
            >
              Done
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

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

      <div style={{
        position: "fixed", top: -120, left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300,
        background: `radial-gradient(ellipse, ${T.blue}18 0%, transparent 70%)`,
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ height: "env(safe-area-inset-top, 16px)", flexShrink: 0 }} />

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
        <button
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
        </button>
      </div>

      {!broadcastsLoading && broadcasts[0] && (
        <div
          style={{
            padding: "0 20px 14px",
            position: "relative",
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              borderRadius: 18,
              border: `1px solid rgba(13,154,107,0.28)`,
              background: "linear-gradient(135deg, rgba(13,154,107,0.16), rgba(57,201,150,0.10))",
              boxShadow: "0 10px 26px rgba(13,154,107,0.16)",
              padding: "14px 16px",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "rgba(255,255,255,0.65)",
                border: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Megaphone size={18} color={T.blueLight} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: T.blueLight, textTransform: "uppercase", letterSpacing: "1px" }}>
                  Announcement
                </p>
                <button
                  onClick={() => dismissBroadcast(broadcasts[0].id)}
                  disabled={dismissingBroadcastId === broadcasts[0].id}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: T.textSecondary,
                    cursor: dismissingBroadcastId === broadcasts[0].id ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: font,
                  }}
                >
                  {dismissingBroadcastId === broadcasts[0].id ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <X size={14} />
                  )}
                  Dismiss
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: T.textPrimary }}>
                {broadcasts[0].message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{
        flex: 1, overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        position: "relative", zIndex: 5,
      }}>
        <>

          {activeTab === "home" && (
            <div
              key="home"
              style={{ padding: "0 20px 120px" }}
            >

              <div
                style={{
                  borderRadius: 28,
                  padding: "20px 24px",
                  marginBottom: 28,
                  overflow: "hidden",
                  position: "relative",
                  background: `linear-gradient(145deg, #0F7A5B 0%, #14966E 45%, #1CB884 100%)`,
                  boxShadow: `0 18px 42px rgba(13,154,107,0.28), 0 0 0 1px rgba(255,255,255,0.34)`,
                }}
              >
                {/* Decorative orbs */}
                <div style={{
                  position: "absolute", top: -60, right: -60,
                  width: 220, height: 220, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute", bottom: -80, left: -40,
                  width: 200, height: 200, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(157,255,218,0.22) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                {/* Shine line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  pointerEvents: "none",
                }} />

                {/* Label */}
                <div style={{
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                }}>
                  <p style={{
                    margin: 0, fontSize: 11, fontWeight: 700,
                    color: "rgba(255,255,255,0.65)", textTransform: "uppercase",
                    letterSpacing: "1.5px",
                  }}>
                    Available Balance
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => setBalanceVisible((v) => !v)}
                      style={{
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        borderRadius: 8, padding: "2px 4px",
                        color: "white", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {balanceVisible ? <EyeOff size={10} /> : <Eye size={10} />}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/auth/me", { credentials: "include" });
                          if (res.ok) {
                            const updatedUser = await res.json();
                            setUser(updatedUser);
                            toast.success("Wallet updated.");
                          }
                        } catch {
                          toast.error("Could not refresh wallet now.");
                        }
                      }}
                      style={{
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        borderRadius: 8, padding: "2px 4px",
                        color: "white", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Zap size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Amount row */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 18, position: "relative",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span style={{
                      fontSize: 31, fontWeight: 700, color: "rgba(255,255,255,0.8)",
                    }}>?</span>
                    <span
                      key={balanceVisible ? "vis" : "hid"}
                      style={{
                        fontSize: 31, fontWeight: 900, color: "white",
                        letterSpacing: "-1px",
                        fontVariantNumeric: "tabular-nums",
                        textShadow: "0 2px 12px rgba(0,0,0,0.2)",
                      }}
                    >
                      {balanceVisible ? user.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                    </span>
                  </div>


                </div>

                {/* Virtual Account Info Row */}
                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                  paddingTop: 8,
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", position: "relative",
                }}>
                  <div style={{ flex: 1 }}>
                    {user.accountNumber && user.bankName ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1 }}><div style={{
                            display: "flex", alignItems: "center", gap: 8,
                            fontSize: 13, fontWeight: 700, color: "white",
                            letterSpacing: "0.5px",
                          }}>
                            <span style={{ fontFamily: "monospace" }}>{user.accountNumber}</span>
                            <span style={{ color: "rgba(255,255,255,0.6)" }}>?</span>
                            <span>{user.bankName}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.accountNumber!);
                            toast.success("Account number copied!");
                          }}
                          style={{
                            background: "rgba(255,255,255,0.18)",
                            border: "1.5px solid rgba(255,255,255,0.35)",
                            borderRadius: 8, padding: "4px 6px",
                            color: "white", fontWeight: 700, cursor: "pointer",
                            fontSize: 10, display: "flex", alignItems: "center",
                            gap: 4, backdropFilter: "blur(10px)",
                            boxShadow: "0 2px 8px rgba(13,154,107,0.18)",
                            flexShrink: 0,
                          }}
                        >
                          <Copy size={10} strokeWidth={2.5} />
                          Copy
                        </button>
                      </div>
                    ) : (
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)",
                      }}>
                        Virtual account not available. Please contact support.
                      </p>
                    )}
                  </div></div>
              </div>

              <p style={{
                margin: "0 0 14px", fontSize: 13, fontWeight: 700,
                color: T.textMuted, textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                Quick Services
              </p>

              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12, marginBottom: 32,
              }}>
                {SERVICES.map((svc, i) => {
                  const Icon = svc.icon;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => setActiveTab(svc.id)}
                      style={{
                        background: T.bgCard,
                        border: `1px solid ${T.border}`,
                        borderRadius: 20,
                        padding: "20px 10px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 10,
                        cursor: "pointer",
                        boxShadow: `0 4px 14px rgba(13,154,107,0.12)`,
                        transition: "box-shadow 0.18s, transform 0.18s",
                      }}
                    >
                      {/* Icon bubble */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: svc.sc.bg,
                        border: `1px solid ${svc.sc.icon}22`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 4px 14px ${svc.sc.glow}`,
                      }}>
                        <Icon size={26} color={svc.sc.icon} strokeWidth={2} />
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: T.textSecondary,
                        textAlign: "center", letterSpacing: "0.1px",
                      }}>
                        {svc.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontWeight: 700,
                color: T.textMuted,
                letterSpacing: "0.3px",
              }}>
                Recent transactions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {transactions.slice(0, 4).map((tx: any) => (
                  <button
                    key={tx.id}
                    onClick={() => {
                      setSelectedTransaction(tx);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: T.bgCard,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      padding: "10px 12px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>
                        {tx.planName}
                      </div>
                      <div style={{ fontSize: 11, color: T.textSecondary }}>
                        {tx.networkName} • {tx.phone || "N/A"}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: tx.status === "SUCCESS" ? T.green : T.red }}>
                      ₦{Number(tx.amount || 0).toLocaleString()}
                    </div>
                  </button>
                ))}
                {transactions.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.textMuted, padding: "4px 2px" }}>
                    No transactions yet.
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
              <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: T.textPrimary }}>Transactions</h1>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: T.textSecondary }}>All your recent data and airtime transactions.</p>
              {transactions.length === 0 && !transactionsLoading ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: T.textMuted, fontSize: 13 }}>No transactions yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {transactions.map((tx: any, idx: number) => {
                    const isSuccess = tx.status === "SUCCESS";
                    const TxIcon = tx.type === "airtime" ? Phone : Wifi;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedTransaction(tx)}
                        style={{
                          background: T.bgCard,
                          borderRadius: 14,
                          padding: "12px",
                          border: `1px solid ${T.border}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 11,
                            background: isSuccess ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <TxIcon size={16} color={isSuccess ? T.green : T.red} />
                          </div>
                          <div>
                            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{tx.planName}</p>
                            <p style={{ margin: "0 0 2px", fontSize: 11, color: T.textSecondary }}>{tx.networkName} • {tx.phone || "N/A"}</p>
                            <p style={{ margin: 0, fontSize: 10, color: T.textMuted }}>
                              {new Date(tx.createdAt).toLocaleDateString("en-NG")} • {new Date(tx.createdAt).toLocaleTimeString("en-NG")}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: isSuccess ? T.green : T.textSecondary }}>₦{tx.amount.toLocaleString()}</p>
                          <span style={{ fontSize: 10, color: isSuccess ? T.green : T.red }}>{tx.status}</span>
                        </div>
                      </div>
                    );
                  })}
                  {transactionsLoading ? (
                    <div style={{ textAlign: "center", color: T.textSecondary, fontSize: 12, padding: 12 }}>Loading...</div>
                  ) : null}
                  <div ref={transactionsLoadMoreRef} style={{ height: 1 }} />
                </div>
              )}
            </div>
          )}

          {activeTab === "accounts" && (
            <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
              <button
                onClick={() => setActiveTab("home")}
                style={{
                  background: T.bgElevated, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: "10px 16px",
                  display: "flex", alignItems: "center", gap: 8,
                  color: T.blue, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", marginBottom: 24, fontFamily: font,
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div style={{ marginBottom: 20 }}>
                <h1 style={{
                  margin: "0 0 8px", fontSize: 28, fontWeight: 800,
                  color: T.textPrimary, letterSpacing: "-0.6px",
                }}>
                  Accounts
                </h1>
                <p style={{
                  margin: 0, fontSize: 14, color: T.textSecondary, lineHeight: 1.6,
                }}>
                  All reserved accounts created for your wallet. Your primary account stays on the wallet card.
                </p>
              </div>

              <div style={{
                background: T.bgCard,
                borderRadius: 20,
                border: `1px solid ${T.border}`,
                padding: 18,
                marginBottom: 18,
              }}>
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: T.textPrimary }}>
                    Create another account
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>
                    Choose a bank and create another reserved account with your saved name, email, and phone number.
                  </p>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  {AVAILABLE_RESERVED_BANKS.map((bank) => {
                    const alreadyCreated = accounts.some((account) => account.bankId === bank.id);
                    const selected = selectedReservedBank === bank.id;

                    return (
                      <button
                        key={bank.id}
                        onClick={() => !alreadyCreated && setSelectedReservedBank(bank.id)}
                        disabled={alreadyCreated || creatingReservedAccount || accountsLoading}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: alreadyCreated
                            ? `${T.green}14`
                            : selected
                              ? `${T.blue}20`
                              : T.bgElevated,
                          border: `1px solid ${
                            alreadyCreated ? `${T.green}40` : selected ? T.blue : T.border
                          }`,
                          color: alreadyCreated ? T.green : selected ? T.blueLight : T.textPrimary,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: alreadyCreated || creatingReservedAccount || accountsLoading ? "not-allowed" : "pointer",
                          fontFamily: font,
                        }}
                      >
                        {bank.label}
                        {alreadyCreated ? " • Added" : ""}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={createReservedAccount}
                  disabled={!selectedReservedBank || creatingReservedAccount || accountsLoading}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: selectedReservedBank && !creatingReservedAccount ? T.blue : T.bgElevated,
                    border: `1px solid ${selectedReservedBank ? T.blue : T.border}`,
                    color: selectedReservedBank && !creatingReservedAccount ? "#fff" : T.textMuted,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: selectedReservedBank && !creatingReservedAccount && !accountsLoading ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontFamily: font,
                  }}
                >
                  {creatingReservedAccount && (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  )}
                  {creatingReservedAccount ? "Creating account..." : "Create account"}
                </button>
              </div>

              {accountsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
                  <Loader2 size={28} style={{ color: T.blue, animation: "spin 1s linear infinite" }} />
                </div>
              ) : accounts.length === 0 ? (
                <div style={{
                  background: T.bgCard,
                  borderRadius: 20,
                  border: `1px solid ${T.border}`,
                  padding: 24,
                  textAlign: "center",
                }}>
                  <p style={{ margin: 0, color: T.textSecondary, fontSize: 14 }}>
                    No reserved accounts available yet.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      style={{
                        background: T.bgCard,
                        borderRadius: 20,
                        border: `1px solid ${T.border}`,
                        padding: 18,
                        boxShadow: "0 4px 16px rgba(13,154,107,0.1)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                        <div>
                          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>
                            {account.bankName || account.bankId}
                          </p>
                          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.textPrimary, fontFamily: "monospace", letterSpacing: "0.5px" }}>
                            {account.accountNumber}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {account.isPrimary && (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "6px 10px",
                              borderRadius: 999,
                              background: `${T.blue}20`,
                              border: `1px solid ${T.blue}40`,
                              color: T.blueLight,
                              fontSize: 11,
                              fontWeight: 700,
                            }}>
                              Primary
                            </span>
                          )}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(account.accountNumber);
                              toast.success("Account number copied!");
                            }}
                            style={{
                              background: T.bgElevated,
                              border: `1px solid ${T.border}`,
                              borderRadius: 12,
                              padding: "8px 12px",
                              color: T.textPrimary,
                              fontWeight: 700,
                              cursor: "pointer",
                              fontSize: 12,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 10 }}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                            Account Name
                          </p>
                          <p style={{ margin: 0, fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>
                            {account.accountName || "?"}
                          </p>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                              Bank ID
                            </p>
                            <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, fontWeight: 600 }}>
                              {account.bankId}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.8px" }}>
                              Reference
                            </p>
                            <p style={{ margin: 0, fontSize: 13, color: T.textSecondary, fontWeight: 600 }}>
                              {account.billstackReference || "?"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FIX: Called as {BuyDataCard()} not <BuyDataCard /> so React does
              not treat it as a new component type on each render, preventing
              the unmount/remount that was dismissing the keyboard. */}
          {activeTab === "data" && BuyDataCard()}
          {activeTab === "airtime" && BuyAirtimeCard()}
          {activeTab === "cable" && BuyCableCard()}
          {activeTab === "electricity" && BuyPowerCard()}
          {activeTab === "exampin" && (
            <ComingSoon key="exam" icon={BookOpen} label="Exam PINs" color={T.services.exampin.icon} />
          )}
          {activeTab === "contact" && (
            <div style={{ padding: "20px 20px 120px", fontFamily: font }}>
              <button
                onClick={() => setActiveTab("home")}
                style={{
                  background: T.bgElevated, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: "10px 16px",
                  display: "flex", alignItems: "center", gap: 8,
                  color: T.blue, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", marginBottom: 24, fontFamily: font,
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div style={{ textAlign: "center", padding: "20px 20px" }}>
                <h1 style={{
                  margin: "0 0 8px", fontSize: 28, fontWeight: 800,
                  color: T.textPrimary, letterSpacing: "-0.6px",
                }}>
                  Contact Us
                </h1>
                <p style={{
                  margin: "0 0 32px", fontSize: 14, color: T.textSecondary,
                  lineHeight: 1.6,
                }}>
                  We're here to help! Reach out to us using any of the methods below.
                </p>

                {/* Contact Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, maxWidth: 400, marginInline: "auto", marginBottom: 32 }}>
                  {/* Call */}
                  <div style={{
                    background: T.bgElevated, borderRadius: 16, padding: 20,
                    border: `1px solid ${T.border}`, textAlign: "left",
                  }}>
                    <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      📞 Call Us
                    </p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.textPrimary }}>
                      08069601974
                    </p>
                    <button
                      onClick={() => {
                        window.open("tel:08069601974", "_blank");
                      }}
                      style={{
                        marginTop: 12, padding: "8px 16px", borderRadius: 8,
                        background: T.blue, border: "none", color: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font,
                      }}
                    >
                      Call Now
                    </button>
                  </div>

                  {/* Chat */}
                  <div style={{
                    background: T.bgElevated, borderRadius: 16, padding: 20,
                    border: `1px solid ${T.border}`, textAlign: "left",
                  }}>
                    <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      💬 Chat With Us
                    </p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.textPrimary }}>
                      08069601974
                    </p>
                    <button
                      onClick={() => {
                        window.open("https://wa.me/2348069601974?text=Hello", "_blank");
                      }}
                      style={{
                        marginTop: 12, padding: "8px 16px", borderRadius: 8,
                        background: "#25D366", border: "none", color: "#fff",
                        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font,
                      }}
                    >
                      WhatsApp
                    </button>
                  </div>

                  {/* Location */}
                  <div style={{
                    background: T.bgElevated, borderRadius: 16, padding: 20,
                    border: `1px solid ${T.border}`, textAlign: "left",
                  }}>
                    <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      📍 Location
                    </p>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.textPrimary }}>
                      Jigawa State, Gagarawa
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textSecondary }}>
                      Tasha
                    </p>
                  </div>
                </div>

                {/* Built By Section */}
                <div style={{
                  borderTop: `1px solid ${T.border}`,
                  paddingTop: 24, marginTop: 24,
                  textAlign: "center",
                }}>
                  <p style={{
                    margin: "0 0 12px", fontSize: 13, color: T.textSecondary,
                    fontWeight: 500,
                  }}>
                    Built by
                  </p>
                  <a
                    href="https://anjalventures.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "8px 16px", borderRadius: 12,
                      background: `${T.blue}15`, border: `1px solid ${T.blue}40`,
                      textDecoration: "none", cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = `${T.blue}25`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = `${T.blue}15`;
                    }}
                  >
                    <img
                      src="https://anjalventures.com/favicon.ico"
                      alt="ANJAL VENTURES"
                      style={{ width: 20, height: 20, borderRadius: 4 }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>
                      ANJAL VENTURES
                    </span>
                  </a>
                </div>
              </div>
            </div>
          )}

        </>
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: `rgba(255,255,255,0.92)`,
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
            : tab.id === "accounts"
              ? activeTab === "accounts"
              : tab.id === "transactions"
                ? activeTab === "transactions"
                : false;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "home")         setActiveTab("home");
                if (tab.id === "accounts")     setActiveTab("accounts");
                if (tab.id === "transactions") setActiveTab("transactions");
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
                <div
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
            </button>
          );
        })}
      </div>


      <Modal show={!!selectedTransaction} onClose={() => setSelectedTransaction(null)}>
        <ModalHeader title="Receipt" onClose={() => setSelectedTransaction(null)} />
        {selectedTransaction ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <TransactionReceipt
              beneficiaryNumber={selectedTransaction.phone || "N/A"}
              planBought={selectedTransaction.planName || "N/A"}
              price={Number(selectedTransaction.amount || 0)}
              status={String(selectedTransaction.status || "PENDING")}
              reference={selectedTransaction.reference || selectedTransaction.id}
              networkName={selectedTransaction.networkName || "N/A"}
              createdAt={selectedTransaction.createdAt}
            />
            <div style={{ fontSize: 12, color: T.textSecondary }}>
              {new Date(selectedTransaction.createdAt).toLocaleDateString("en-NG")} · {new Date(selectedTransaction.createdAt).toLocaleTimeString("en-NG")}
            </div>
            <button
              onClick={() => downloadTransactionReceiptPng(selectedTransaction)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                background: T.green,
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              Download PNG
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal show={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
        <EnhancedSettingsPanel
          user={user}
          onClose={() => setShowSettingsModal(false)}
          onPinChangeClick={() => {
            setPinForm({ oldPin: "", newPin: "", confirmPin: "" });
            setPinError("");
            setShowSettingsModal(false);
            setShowPinChangeModal(true);
          }}
          onLogoutClick={handleLogout}
        />
      </Modal>

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
          <button
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
              boxShadow: pinChangeLoading ? "none" : "0 8px 20px rgba(13,154,107,0.24)",
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
          </button>
        </div>
      </Modal>

    </div>
  );
}











