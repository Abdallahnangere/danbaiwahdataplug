"use client";

import Link from "next/link";
import Image from "next/image";
import { BrandColors } from "@/lib/brand";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-white via-cyan-50/30 to-orange-50/20 pt-28 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
      {/* Animated gradient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cyan glow */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        {/* Orange glow */}
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        {/* Purple accent */}
        <div className="absolute top-40 right-1/3 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl" />
        
        {/* Particle effects */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 drop-shadow-2xl hover:scale-105 transition-transform duration-300">
            <Image
              src="/logo.png"
              alt="Danbaiwa Data Plug Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-100 to-orange-100 border border-cyan-200 mb-8">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-orange-500 animate-pulse" />
          <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent">
            🚀 All Your Digital Services in One App
          </span>
        </div>

        {/* Main headline with gradient */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
          <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-orange-600 bg-clip-text text-transparent">
            Everything Nigeria Needs
          </span>
          <br />
          <span className="text-gray-900">Digital & Bills, Made Simple</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
          Buy data for all networks, pay electricity bills, subscribe to cable TV, get airtime, and grab exam PINs—all from one app. Instant delivery, best prices, zero hassle.
        </p>

        {/* Trust indicators - stats row */}
        <div className="grid grid-cols-3 gap-6 mb-12 py-8 px-6 rounded-2xl bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-md border border-cyan-200/30 shadow-lg">
          <div className="flex flex-col items-center">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent">
              100K+
            </div>
            <div className="text-sm text-gray-600 font-semibold">Happy Users</div>
          </div>
          <div className="flex flex-col items-center border-l border-r border-cyan-200/30">
            <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent">
              5M+
            </div>
            <div className="text-sm text-gray-600 font-semibold">Transactions</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl sm:text-4xl font-black text-emerald-500">4.9★</div>
            <div className="text-sm text-gray-600 font-semibold">App Rating</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/app"
            className="px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-orange-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105 text-center"
          >
            Get Started Now
          </Link>
          <button className="px-8 py-3.5 border-2 border-cyan-300 text-cyan-700 rounded-xl font-semibold hover:bg-cyan-50 transition-all duration-300 hover:shadow-lg">
            See Features →
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>Instant Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>Secure Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
