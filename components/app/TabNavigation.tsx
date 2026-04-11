/**
 * App Tab Navigation Component
 * Contains: Data, Airtime, Electricity, Cable, Exam PINs
 */

"use client";

import React, { useState } from "react";
import { Zap, Phone, Wifi, Tv, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BrandColors } from "@/lib/brand";

export interface TabType {
  id: "data" | "airtime" | "electricity" | "cable" | "exampin";
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  gradient: string;
}

export const APP_TABS: TabType[] = [
  {
    id: "data",
    label: "Data",
    icon: <Wifi className="w-6 h-6" />,
    description: "Buy mobile data",
    color: BrandColors.cyan,
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    id: "airtime",
    label: "Airtime",
    icon: <Phone className="w-6 h-6" />,
    description: "Get airtime",
    color: BrandColors.purple,
    gradient: "from-purple-400 to-pink-500",
  },
  {
    id: "electricity",
    label: "Electricity",
    icon: <Zap className="w-6 h-6" />,
    description: "Pay bills",
    color: BrandColors.yellow,
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    id: "cable",
    label: "Cable TV",
    icon: <Tv className="w-6 h-6" />,
    description: "Subscribe to cable",
    color: BrandColors.green,
    gradient: "from-green-400 to-emerald-500",
  },
  {
    id: "exampin",
    label: "Exam PINs",
    icon: <BookOpen className="w-6 h-6" />,
    description: "Exam credentials",
    color: BrandColors.pink,
    gradient: "from-pink-400 to-red-500",
  },
];

interface BottomTabNavProps {
  activeTab: TabType["id"];
  onTabChange: (tabId: TabType["id"]) => void;
}

export function BottomTabNav({ activeTab, onTabChange }: BottomTabNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/50 shadow-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        {APP_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                  : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label={tab.label}
            >
              <div className="w-5 h-5">{tab.icon}</div>
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SidebarTabNavProps {
  activeTab: TabType["id"];
  onTabChange: (tabId: TabType["id"]) => void;
}

export function SidebarTabNav({ activeTab, onTabChange }: SidebarTabNavProps) {
  return (
    <div className="hidden md:flex flex-col gap-3 w-full">
      {APP_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg font-semibold`
                : "text-gray-700 hover:bg-gray-50 border border-transparent"
            }`}
          >
            <div className="w-6 h-6">{tab.icon}</div>
            <div className="text-left">
              <div className="font-semibold text-sm">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Tab Content Components

export function DataTabContent() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-400/10 to-blue-500/10 border border-cyan-200/50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">📱 Mobile Data</h3>
        <p className="text-sm text-gray-600">
          Buy affordable data plans for all networks - MTN, Airtel, Glo, 9Mobile.
          Get instant activation with no hidden charges.
        </p>
      </div>
    </div>
  );
}

export function AirtimeTabContent() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-400/10 to-pink-500/10 border border-purple-200/50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">📞 Mobile Airtime</h3>
        <p className="text-sm text-gray-600">
          Top-up airtime for calls and SMS. Simple, fast, and secure.
          Available for all networks in Nigeria.
        </p>
      </div>
    </div>
  );
}

interface ElectricityReceipt {
  id: string;
  reference: string;
  meterNumber: string;
  disco: string;
  customerName: string;
  meterType: string;
  amount: number;
  token?: string;
  status: string;
  timestamp: string;
}

const DISCOS = [
  { id: "ikeja-electric", name: "Ikeja Electric", code: "IKEDC" },
  { id: "eko-electric", name: "Eko Electric", code: "EKEDC" },
  { id: "abuja-electric", name: "Abuja Electric", code: "AEDC" },
  { id: "kano-electric", name: "Kano Electric", code: "KEDC" },
  { id: "enugu-electric", name: "Enugu Electric", code: "EEDC" },
  { id: "portharcourt-electric", name: "Port Harcourt Electric", code: "PHEDC" },
  { id: "ibadan-electric", name: "Ibadan Electric", code: "IBEDC" },
  { id: "kaduna-electric", name: "Kaduna Electric", code: "KADC" },
  { id: "jos-electric", name: "Jos Electric", code: "JEDC" },
  { id: "benin-electric", name: "Benin Electric", code: "BEDC" },
  { id: "yola-electric", name: "Yola Electric", code: "YEDC" },
];

export function ElectricityTabContent() {
  const [step, setStep] = useState<"select" | "validate" | "payment" | "receipt">("select");
  const [selectedDisco, setSelectedDisco] = useState<string>("ikeja-electric");
  const [meterNumber, setMeterNumber] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [validationData, setValidationData] = useState<{
    customerName: string;
    address: string;
  } | null>(null);
  const [receipt, setReceipt] = useState<ElectricityReceipt | null>(null);

  const discoObject = DISCOS.find((d) => d.id === selectedDisco);
  const discoName = discoObject?.name || "Selected Distributor";

  const handleValidateMeter = async () => {
    if (!meterNumber) {
      toast.error("Please enter a meter number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/electricity/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meterNumber,
          disco: selectedDisco,
          meterType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Meter validation failed");
        return;
      }

      setValidationData({
        customerName: data.data.customerName,
        address: data.data.address,
      });

      toast.success("Meter validated successfully!");
      setStep("payment");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async () => {
    if (!validationData?.customerName || amount < 1000) {
      toast.error("Invalid payment details");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/electricity/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meterType,
          phoneNumber,
          customerName: validationData.customerName,
          meterNumber,
          disco: selectedDisco,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Payment failed");
        return;
      }

      // Show receipt
      setReceipt({
        id: data.transaction.id,
        reference: data.transaction.reference,
        meterNumber: data.transaction.meterNumber,
        disco: data.transaction.disco,
        customerName: data.transaction.customerName,
        meterType: data.transaction.meterType,
        amount: data.transaction.amount,
        token: data.transaction.token,
        status: data.transaction.status,
        timestamp: new Date(data.transaction.timestamp).toLocaleString(),
      });

      toast.success(data.message || "Electricity bill paid successfully!");
      setStep("receipt");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("select");
    setMeterNumber("");
    setMeterType("prepaid");
    setPhoneNumber("");
    setAmount(5000);
    setValidationData(null);
    setSelectedDisco("ikeja-electric");
  };

  // Receipt View
  if (step === "receipt" && receipt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Success Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-900">Payment Successful!</h2>
            <p className="text-green-700">Your electricity bill has been paid successfully.</p>
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-white border border-gray-200/50 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Distributor</p>
              <p className="font-semibold text-gray-900">{receipt.disco}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Meter Type</p>
              <p className="font-semibold text-gray-900 capitalize">{receipt.meterType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Meter Number</p>
              <p className="font-mono text-sm text-gray-900">{receipt.meterNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Name</p>
              <p className="font-semibold text-gray-900">{receipt.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Paid</p>
              <p className="font-bold text-lg bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                ₦{receipt.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-green-600 capitalize">{receipt.status}</p>
            </div>
            {receipt.token && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Prepaid Token</p>
                <p className="font-mono text-sm text-gray-900 break-all">{receipt.token}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Reference</p>
              <p className="font-mono text-sm text-gray-900 break-all">{receipt.reference}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="text-sm text-gray-900">{receipt.timestamp}</p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={resetForm}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Pay Another Bill
        </button>
      </motion.div>
    );
  }

  // Payment Form View
  if (step === "payment" && validationData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-200/50 rounded-xl p-6">
          <h3 className="font-bold text-lg bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
            ⚡ Confirm Payment Details
          </h3>
          <p className="text-sm text-gray-600">Review and confirm your electricity bill payment.</p>
        </div>

        {/* Validation Details */}
        <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-blue-900">Meter Details (Validated)</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-blue-600">Meter Number</p>
              <p className="font-mono font-semibold text-blue-900">{meterNumber}</p>
            </div>
            <div>
              <p className="text-blue-600">Type</p>
              <p className="font-semibold text-blue-900 capitalize">{meterType}</p>
            </div>
            <div className="col-span-2">
              <p className="text-blue-600">Customer Name</p>
              <p className="font-semibold text-blue-900">{validationData.customerName}</p>
            </div>
            <div className="col-span-2">
              <p className="text-blue-600">Address</p>
              <p className="text-blue-900">{validationData.address}</p>
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Contact Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="08101234567"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Amount */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Payment Amount (₦)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(1000, parseInt(e.target.value) || 1000))}
            min="1000"
            step="100"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-600">Minimum: ₦1,000</p>
        </div>

        {/* Payment Summary */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Distributor:</span>
            <span className="font-semibold">{discoName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">₦{amount.toLocaleString()}</span>
          </div>
          <div className="border-t border-yellow-200 pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="font-bold text-lg bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              ₦{amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep("select")}
            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
            disabled={loading}
          >
            Back
          </button>
          <motion.button
            onClick={handlePayBill}
            disabled={loading || !phoneNumber}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Processing...
              </div>
            ) : (
              `Pay ₦${amount.toLocaleString()}`
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Meter Validation View
  if (step === "validate") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-200/50 rounded-xl p-6">
          <h3 className="font-bold text-lg bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
            ⚡ Validate Your Meter
          </h3>
          <p className="text-sm text-gray-600">Enter your meter details to verify before payment.</p>
        </div>

        {/* Meter Number */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Meter Number</label>
          <input
            type="text"
            value={meterNumber}
            onChange={(e) => setMeterNumber(e.target.value)}
            placeholder="Enter your 11-13 digit meter number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Meter Type */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Meter Type</label>
          <div className="flex gap-3">
            {(["prepaid", "postpaid"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMeterType(type)}
                className={`flex-1 p-3 rounded-lg font-semibold transition-all ${
                  meterType === type
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type === "prepaid" ? "📱 Prepaid" : "📋 Postpaid"}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep("select")}
            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
            disabled={loading}
          >
            Back
          </button>
          <motion.button
            onClick={handleValidateMeter}
            disabled={loading || !meterNumber}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Validating...
              </div>
            ) : (
              "Validate Meter"
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Select DISCO View (Default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-200/50 rounded-xl p-6">
        <h3 className="font-bold text-lg bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
          ⚡ Pay Electricity Bills
        </h3>
        <p className="text-sm text-gray-600">
          Select your electricity distributor and pay your bills instantly.
        </p>
      </div>

      {/* DISCO Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">Select Electricity Distributor</label>
        <div className="grid grid-cols-1 gap-3">
          {DISCOS.map((disco) => (
            <button
              key={disco.id}
              onClick={() => {
                setSelectedDisco(disco.id);
                setStep("validate");
              }}
              className={`p-4 rounded-lg text-left transition-all border-2 ${
                selectedDisco === disco.id
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-gray-200 bg-white hover:border-yellow-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{disco.name}</p>
                  <p className="text-xs text-gray-600">Code: {disco.code}</p>
                </div>
                <div className="text-2xl">⚡</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-4 text-sm text-blue-800">
        ℹ️ Your meter will be validated before payment to ensure accuracy and security.
      </div>
    </motion.div>
  );
}

interface CableReceipt {
  id: string;
  reference: string;
  cableName: string;
  planName: string;
  smartCardNumber: string;
  amount: number;
  status: string;
  timestamp: string;
}

const CABLE_DATA = [
  {
    id: "DSTV",
    name: "DSTV",
    icon: "📺",
    gradient: "from-green-400 to-emerald-500",
    color: "text-green-600",
    plans: [
      { id: 1, name: "DStv Padi", amount: 2500 },
      { id: 2, name: "DStv Yanga", amount: 3500 },
      { id: 3, name: "DStv Confam", amount: 6200 },
      { id: 4, name: "DStv Premium", amount: 24500 },
    ],
  },
  {
    id: "GOTV",
    name: "GOtv",
    icon: "📺",
    gradient: "from-blue-400 to-cyan-500",
    color: "text-blue-600",
    plans: [
      { id: 5, name: "GOtv Smallie", amount: 1100 },
      { id: 6, name: "GOtv Jinja", amount: 2250 },
      { id: 7, name: "GOtv Jolli", amount: 3300 },
      { id: 8, name: "GOtv Max", amount: 4850 },
    ],
  },
  {
    id: "STARTIME",
    name: "Startimes",
    icon: "📡",
    gradient: "from-purple-400 to-pink-500",
    color: "text-purple-600",
    plans: [
      { id: 9, name: "Startimes Nova", amount: 1950 },
      { id: 10, name: "Startimes Nova+ Plus", amount: 3500 },
      { id: 11, name: "Startimes Smart", amount: 5000 },
    ],
  },
];

export function CableTabContent() {
  const [step, setStep] = useState<"select" | "plan" | "payment" | "receipt">("select");
  const [selectedProvider, setSelectedProvider] = useState<string>("DSTV");
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<CableReceipt | null>(null);

  const provider = CABLE_DATA.find((p) => p.id === selectedProvider);
  const plan = provider?.plans.find((p) => p.id === selectedPlan);
  const amount = plan?.amount || 0;

  const handleSubscribe = async () => {
    if (!smartCardNumber) {
      toast.error("Please enter your smart card number");
      return;
    }

    if (!plan) {
      toast.error("Please select a plan");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/cable/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cableName: selectedProvider,
          planId: selectedPlan,
          smartCardNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Subscription failed");
        return;
      }

      // Show receipt
      setReceipt({
        id: data.transaction.id,
        reference: data.transaction.reference,
        cableName: data.transaction.cableName,
        planName: data.transaction.planName,
        smartCardNumber: data.transaction.smartCardNumber,
        amount: data.transaction.amount,
        status: data.transaction.status,
        timestamp: new Date(data.transaction.timestamp).toLocaleString(),
      });

      toast.success(data.message || "Subscription successful!");
      setStep("receipt");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("select");
    setSelectedProvider("DSTV");
    setSelectedPlan(1);
    setSmartCardNumber("");
    setReceipt(null);
  };

  // Receipt View
  if (step === "receipt" && receipt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Success Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-900">Subscription Successful!</h2>
            <p className="text-green-700">Your cable subscription has been activated.</p>
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-white border border-gray-200/50 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Cable Provider</p>
              <p className="font-semibold text-gray-900">{receipt.cableName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-semibold text-gray-900">{receipt.planName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Smart Card Number</p>
              <p className="font-mono text-sm text-gray-900">{receipt.smartCardNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-green-600 capitalize">{receipt.status}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Amount Charged</p>
              <p className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ₦{receipt.amount.toLocaleString()}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Reference</p>
              <p className="font-mono text-sm text-gray-900 break-all">{receipt.reference}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="text-sm text-gray-900">{receipt.timestamp}</p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={resetForm}
          className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Subscribe to Another Plan
        </button>
      </motion.div>
    );
  }

  // Payment Form View
  if (step === "payment" && provider) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${provider.gradient}/10 border ${provider.gradient.split(" ")[1]?.replace("to-", "border-")}/50 rounded-xl p-6`}>
          <h3 className={`font-bold text-lg ${provider.color} mb-2`}>
            {provider.icon} Complete Your Subscription
          </h3>
          <p className="text-sm text-gray-600">Enter your decoder details to complete the subscription.</p>
        </div>

        {/* Subscription Details Review */}
        <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-blue-900">Subscription Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-blue-600">Provider</p>
              <p className="font-semibold text-blue-900">{provider.name}</p>
            </div>
            <div>
              <p className="text-blue-600">Plan</p>
              <p className="font-semibold text-blue-900">{plan?.name}</p>
            </div>
            <div className="col-span-2">
              <p className="text-blue-600">Monthly Amount</p>
              <p className="font-bold text-lg text-blue-900">₦{amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Smart Card Number */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900">Smart Card Number</label>
          <input
            type="text"
            value={smartCardNumber}
            onChange={(e) => setSmartCardNumber(e.target.value)}
            placeholder="Enter your decoder smart card number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-600">This is your IUC or decoder number on your decoder/card.</p>
        </div>

        {/* Cost Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Plan:</span>
            <span className="font-semibold">{plan?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monthly Cost:</span>
            <span className="font-semibold">₦{amount.toLocaleString()}</span>
          </div>
          <div className="border-t border-green-200 pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Total to Charge:</span>
            <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ₦{amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setStep("plan")}
            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
            disabled={loading}
          >
            Back
          </button>
          <motion.button
            onClick={handleSubscribe}
            disabled={loading || !smartCardNumber}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Processing...
              </div>
            ) : (
              `Subscribe for ₦${amount.toLocaleString()}`
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Plan Selection View
  if (step === "plan" && provider) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${provider.gradient}/10 border ${provider.gradient.split(" ")[1]?.replace("to-", "border-")}/50 rounded-xl p-6`}>
          <h3 className={`font-bold text-lg ${provider.color} mb-2`}>
            {provider.icon} Choose Your Plan - {provider.name}
          </h3>
          <p className="text-sm text-gray-600">Select the subscription plan that suits you best.</p>
        </div>

        {/* Plans Grid */}
        <div className="space-y-3">
          {provider.plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => {
                setSelectedPlan(plan.id);
                setStep("payment");
              }}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedPlan === plan.id
                  ? `bg-gradient-to-r ${provider.gradient} text-white shadow-lg`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className={`font-bold text-lg ${selectedPlan === plan.id ? "text-white" : provider.color}`}>
                    {plan.name}
                  </p>
                  <p className={`text-sm ${selectedPlan === plan.id ? "text-white/80" : "text-gray-600"}`}>
                    Monthly subscription
                  </p>
                </div>
                <div className={`text-2xl font-bold ${selectedPlan === plan.id ? "text-white" : provider.color}`}>
                  ₦{plan.amount.toLocaleString()}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Back Button */}
        <button
          onClick={() => setStep("select")}
          className="w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
        >
          Back
        </button>
      </motion.div>
    );
  }

  // Provider Selection View (Default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-400/10 to-emerald-500/10 border border-green-200/50 rounded-xl p-6">
        <h3 className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          📺 Cable TV Subscriptions
        </h3>
        <p className="text-sm text-gray-600">
          Subscribe to your favorite cable TV providers and enjoy unlimited entertainment.
        </p>
      </div>

      {/* Provider Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">Select Your Cable Provider</label>
        <div className="grid grid-cols-1 gap-3">
          {CABLE_DATA.map((prov) => (
            <button
              key={prov.id}
              onClick={() => {
                setSelectedProvider(prov.id);
                setSelectedPlan(prov.plans[0].id);
                setStep("plan");
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedProvider === prov.id
                  ? `bg-gradient-to-r ${prov.gradient} text-white shadow-lg`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <p className="font-bold text-lg">{prov.icon} {prov.name}</p>
                  <p className={`text-xs ${selectedProvider === prov.id ? "text-white/80" : "text-gray-600"}`}>
                    {prov.plans.length} plans available • Starting from ₦{Math.min(...prov.plans.map((p) => p.amount)).toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl">→</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-4 text-sm text-blue-800">
        ℹ️ Your subscription will be activated immediately on your decoder after payment confirmation.
      </div>
    </motion.div>
  );
}

interface ExamPinTxn {
  id: string;
  examName: string;
  quantity: number;
  amount: number;
  status: string;
  timestamp: string;
  reference: string;
}

export function ExamPinTabContent() {
  const [selectedExam, setSelectedExam] = useState<"WAEC" | "NECO" | "NABTEB">("WAEC");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ExamPinTxn | null>(null);

  const examPrices: Record<string, number> = {
    WAEC: 1000,
    NECO: 500,
    NABTEB: 800,
  };

  const totalAmount = examPrices[selectedExam] * quantity;

  const handlePurchase = async () => {
    if (!selectedExam || quantity < 1 || quantity > 5) {
      toast.error("Invalid quantity. Must be 1-5 PINs.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/exampin/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examName: selectedExam, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Purchase failed");
        return;
      }

      // Show receipt
      setReceipt({
        id: data.transaction.id,
        examName: data.transaction.examName,
        quantity: data.transaction.quantity,
        amount: data.transaction.amount,
        status: data.transaction.status,
        timestamp: new Date(data.transaction.timestamp).toLocaleString(),
        reference: data.transaction.reference,
      });

      toast.success(data.message || "Exam PINs purchased successfully!");
      setSelectedExam("WAEC");
      setQuantity(1);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Success Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-900">Purchase Successful!</h2>
            <p className="text-green-700">Your exam PINs have been purchased and will be delivered shortly.</p>
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-white border border-gray-200/50 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Exam Type</p>
              <p className="font-semibold text-gray-900">{receipt.examName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-semibold text-gray-900">{receipt.quantity} PIN{receipt.quantity > 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Charged</p>
              <p className="font-semibold text-gray-900">₦{receipt.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-green-600 capitalize">{receipt.status}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Reference</p>
              <p className="font-mono text-sm text-gray-900 break-all">{receipt.reference}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="text-sm text-gray-900">{receipt.timestamp}</p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setReceipt(null)}
          className="w-full bg-gradient-to-r from-cyan-400 to-orange-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Close Receipt
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400/10 to-red-500/10 border border-pink-200/50 rounded-xl p-6">
        <h3 className="font-bold text-lg bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
          🎓 Exam Result Checker PINs
        </h3>
        <p className="text-sm text-gray-600">Purchase exam result checker PINs for WAEC, NECO, and NABTEB instantly.</p>
      </div>

      {/* Exam Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">Select Exam Type</label>
        <div className="grid grid-cols-3 gap-3">
          {(["WAEC", "NECO", "NABTEB"] as const).map((exam) => (
            <button
              key={exam}
              onClick={() => setSelectedExam(exam)}
              className={`p-4 rounded-lg font-semibold transition-all duration-200 ${
                selectedExam === exam
                  ? "bg-gradient-to-r from-pink-400 to-red-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="text-lg mb-1">
                {exam === "WAEC" && "📚"}
                {exam === "NECO" && "📖"}
                {exam === "NABTEB" && "🎓"}
              </div>
              {exam}
              <div className="text-xs mt-1 opacity-80">₦{examPrices[exam].toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">Number of PINs</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-all"
            disabled={quantity <= 1}
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max="5"
            value={quantity}
            onChange={(e) => setQuantity(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-20 h-10 border border-gray-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            onClick={() => setQuantity(Math.min(5, quantity + 1))}
            className="w-10 h-10 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-all"
            disabled={quantity >= 5}
          >
            +
          </button>
          <span className="text-xs text-gray-600 ml-auto">Max: 5 PINs</span>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Unit Price ({selectedExam}):</span>
          <span className="font-semibold">₦{examPrices[selectedExam].toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-semibold">{quantity} PIN{quantity > 1 ? "s" : ""}</span>
        </div>
        <div className="border-t border-pink-200 pt-2 flex justify-between">
          <span className="font-semibold text-gray-900">Total Amount:</span>
          <span className="font-bold text-lg bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
            ₦{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Purchase Button */}
      <motion.button
        onClick={handlePurchase}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-pink-400 to-red-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            Processing...
          </div>
        ) : (
          `Purchase for ₦${totalAmount.toLocaleString()}`
        )}
      </motion.button>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-4 text-sm text-blue-800">
        ℹ️ PINs will be delivered to your registered email within minutes. You can check the status in your transaction history.
      </div>
    </motion.div>
  );
}
