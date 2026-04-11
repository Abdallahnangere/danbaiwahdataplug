"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Phone, Wifi, Tv, BookOpen, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app/AppHeader";
import { BottomTabNav, SidebarTabNav, APP_TABS } from "@/components/app/TabNavigation";
import { BalanceCard, PremiumCard, ServiceCard } from "@/components/app/Cards";
import { BrandColors } from "@/lib/brand";

interface User {
  id: string;
  fullName: string;
  phone: string;
  balance: number;
  tier: "user" | "agent";
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AppDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"data" | "airtime" | "electricity" | "cable" | "exampin">("data");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          router.push("/app/auth");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/app/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { credentials: "include", method: "POST" });
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-orange-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-400 to-orange-500 rounded-full animate-spin" />
          <p className="text-gray-600 font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-cyan-50/30 to-orange-50/20">
      {/* Header */}
      <AppHeader
        userName={user.fullName}
        balance={user.balance}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation - Desktop Only */}
          <div className="hidden lg:block">
            <SidebarTabNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              {/* Balance Card */}
              <BalanceCard
                balance={user.balance}
                onFundWallet={() => {
                  // TODO: Implement fund wallet
                  toast.info("Fund wallet feature coming soon");
                }}
              />

              {/* Tab Content Based on Active Tab */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Data Tab */}
                  {activeTab === "data" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-black mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                          📱 Mobile Data
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Select your network and data plan
                        </p>

                        {/* Coming Soon */}
                        <div className="rounded-2xl border-2 border-dashed border-cyan-300 p-12 text-center">
                          <div className="text-5xl mb-4">🚀</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Data Plans Loading
                          </h3>
                          <p className="text-gray-600">
                            Select your preferred network and data size
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Airtime Tab */}
                  {activeTab === "airtime" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-black mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ☎️ Mobile Airtime
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Top-up airtime for all networks
                        </p>

                        {/* Coming Soon */}
                        <div className="rounded-2xl border-2 border-dashed border-purple-300 p-12 text-center">
                          <div className="text-5xl mb-4">📞</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Airtime Plans Loading
                          </h3>
                          <p className="text-gray-600">
                            Quick and fast airtime top-up
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Electricity Tab */}
                  {activeTab === "electricity" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-black mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                          ⚡ Electricity Bills
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Pay your electricity bills instantly
                        </p>

                        {/* Coming Soon */}
                        <div className="rounded-2xl border-2 border-dashed border-yellow-300 p-12 text-center">
                          <div className="text-5xl mb-4">⚡</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Electricity Bill Payment
                          </h3>
                          <p className="text-gray-600">
                            UI created - Backend routing coming soon
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cable TV Tab */}
                  {activeTab === "cable" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-black mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          📺 Cable Subscriptions
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Subscribe to your favorite cable provider
                        </p>

                        {/* Coming Soon */}
                        <div className="rounded-2xl border-2 border-dashed border-green-300 p-12 text-center">
                          <div className="text-5xl mb-4">📺</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Cable Subscription
                          </h3>
                          <p className="text-gray-600">
                            UI created - Backend routing coming soon
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exam PINs Tab */}
                  {activeTab === "exampin" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-black mb-4 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                          🎓 Exam PINs & eCredentials
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Purchase exam pins and credentials
                        </p>

                        {/* Coming Soon */}
                        <div className="rounded-2xl border-2 border-dashed border-pink-300 p-12 text-center">
                          <div className="text-5xl mb-4">🎓</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Exam PINs & eCredentials
                          </h3>
                          <p className="text-gray-600">
                            UI created - Backend routing coming soon
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Tab Navigation for Mobile */}
              <div className="md:hidden mt-8 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold mb-3">
                  Use tabs at the bottom to navigate
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Bottom Tab Navigation - Mobile Only */}
      <BottomTabNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
