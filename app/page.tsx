import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PlansSection } from "@/components/landing/PlansSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PremiumValueSection } from "@/components/landing/PremiumValueSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTABanner } from "@/components/landing/CTABanner";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "DANBAIWA DATA PLUG - Data, Airtime, Bills, Cable TV & More",
  description:
    "Buy data for MTN, Glo, Airtel & 9Mobile. Pay electricity bills, subscribe to cable TV, get airtime, and grab exam PINs. Fast delivery, best prices, 100% secure.",
  keywords:
    "buy data Nigeria, airtime, electricity bills, cable tv, DSTV, GOtv, exam pins, MTN, Airtel, Glo, 9Mobile",
  authors: [{ name: "DANBAIWA DATA PLUG" }],
  creator: "DANBAIWA DATA PLUG",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://danbaiwa.com",
    images: "https://danbaiwa.com/og-image.png",
    title: "DANBAIWA DATA PLUG - Everything Nigeria Needs, One App",
    description:
      "Data, airtime, electricity bills, cable TV, exam PINs—instant delivery, best prices",
  },
  twitter: {
    card: "summary_large_image",
    title: "DANBAIWA DATA PLUG - Everything Nigeria Needs, One App",
    description:
      "Buy data, pay bills, subscribe to cable—all in one secure app. Fast delivery. Best prices.",
    images: "https://danbaiwa.com/og-image.png",
    creator: "@danbaiwa",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Plans Section */}
      <PlansSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Premium Value Proposition */}
      <PremiumValueSection />

      {/* FAQ */}
      <FAQSection />

      {/* CTA Banner */}
      <CTABanner />

      {/* Footer */}
      <Footer />
    </main>
  );
}
