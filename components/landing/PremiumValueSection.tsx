"use client";

import { Zap, Lock, Award } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning-Fast Delivery",
    description: "Data, airtime, and bills processed in seconds. Most transactions complete within 2-5 seconds.",
  },
  {
    icon: Award,
    title: "All Services, One App",
    description: "Data, airtime, electricity bills, cable TV, and exam PINs. Everything you need in 5 simple taps.",
  },
  {
    icon: Lock,
    title: "Secure & Trusted",
    description: "Bank-grade security with encrypted transactions. Trusted by 100,000+ Nigerians nationwide.",
  },
];

export function PremiumValueSection() {
  return (
    <section className="bg-gray-50 py-16 sm:py-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4 leading-tight">
            Why millions choose DANBAIWA
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete digital solutions for every Nigerian. Fast, reliable, trustworthy.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="bg-white rounded-lg p-8 border border-gray-200">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-orange-500 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="border-t border-gray-200 pt-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                100K+
              </p>
              <p className="text-gray-600 font-medium text-sm">Happy Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-cyan-500 mb-2">
                5M+
              </p>
              <p className="text-gray-600 font-medium text-sm">Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-green-500 mb-2">
                99.9%
              </p>
              <p className="text-gray-600 font-medium text-sm">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-purple-500 mb-2">
                2-5s
              </p>
              <p className="text-gray-600 font-medium text-sm">Avg Delivery</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">
                4.9★
              </p>
              <p className="text-gray-600 font-medium text-sm">App Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
