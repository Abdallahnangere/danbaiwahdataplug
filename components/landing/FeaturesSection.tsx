"use client";

import {
  Zap,
  CreditCard,
  Building2,
  Gift,
  Smartphone,
  Shield,
} from "lucide-react";
import { BrandColors } from "@/lib/brand";

const features = [
  {
    icon: Zap,
    title: "Mobile Data",
    description: "Get instant data for MTN, Glo, Airtel & 9Mobile. ₦50 to ₦50k plans delivered in seconds.",
    gradient: "from-yellow-400 to-orange-500",
    color: "text-orange-500",
  },
  {
    icon: CreditCard,
    title: "Airtime Top-up",
    description: "Quick airtime for any network. From ₦50 to ₦50k, buy and send to anyone instantly.",
    gradient: "from-cyan-400 to-blue-500",
    color: "text-cyan-500",
  },
  {
    icon: Building2,
    title: "Electricity Bills",
    description: "Pay prepaid & postpaid meters for all 11 Nigerian DISCOs. Minimum ₦1,000 per payment.",
    gradient: "from-green-400 to-emerald-500",
    color: "text-green-500",
  },
  {
    icon: Gift,
    title: "Cable TV Subscription",
    description: "Subscribe to DSTV, GOtv, or Startimes with multiple plan tiers at best prices.",
    gradient: "from-pink-400 to-rose-500",
    color: "text-pink-500",
  },
  {
    icon: Smartphone,
    title: "Exam PINs",
    description: "Buy WAEC, NECO, NABTEB PINs in bulk (1-5 units) with instant delivery.",
    gradient: "from-purple-400 to-indigo-500",
    color: "text-purple-500",
  },
  {
    icon: Shield,
    title: "Secure & Trusted",
    description: "Bank-grade security with encrypted transactions and 99.9% uptime guaranteed.",
    gradient: "from-blue-400 to-cyan-500",
    color: "text-blue-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-gradient-to-b from-white via-cyan-50/20 to-white py-20 sm:py-32 px-6 sm:px-8 lg:px-12 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-40 left-0 w-96 h-96 bg-cyan-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-0 w-96 h-96 bg-orange-200/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
            Why Choose
            <br />
            <span className="bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent">
              DANBAIWA?
            </span>
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
            Premium features designed for the modern Nigerian consumer
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative rounded-2xl bg-white border border-gray-200/50 p-8 hover:shadow-2xl hover:border-cyan-300/50 transition-all duration-300 hover:scale-105"
              >
                {/* Gradient Top Border */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} rounded-t-2xl`}
                />

                {/* Icon Container */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
