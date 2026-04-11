"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandColors, BrandGradients } from "@/lib/brand";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-white to-cyan-50/30 backdrop-blur-md border-b border-cyan-200/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity">
            <div className="relative w-10 h-10">
              {/* DB Logo Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-orange-500 rounded-lg opacity-20 blur-lg" />
              <div className="relative w-10 h-10 bg-gradient-to-r from-cyan-400 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-orange-500/50">
                DB
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold bg-gradient-to-r from-cyan-500 to-orange-500 bg-clip-text text-transparent">
                DANBAIWA
              </div>
              <div className="text-xs text-gray-500 font-semibold">
                DATA PLUG
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "How it works", href: "#howitworks" },
              { label: "FAQ", href: "#faq" }
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-orange-500 hover:bg-clip-text hover:text-transparent transition-all duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              href="/app"
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-orange-500 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
            >
              Open App
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 -mr-2 flex items-center justify-center text-gray-700 hover:text-orange-500 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-cyan-200/20 bg-gradient-to-br from-white to-cyan-50/50">
            <div className="flex flex-col py-3 space-y-1">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "How it works", href: "#howitworks" },
                { label: "FAQ", href: "#faq" }
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors px-4 py-2"
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-cyan-200/20 mt-3 pt-3">
                <Link
                  href="/app"
                  className="block w-full px-4 py-2.5 bg-gradient-to-r from-cyan-400 to-orange-500 text-white text-sm font-semibold text-center rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all"
                  onClick={closeMenu}
                >
                  Open App
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
