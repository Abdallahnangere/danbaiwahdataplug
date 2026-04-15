import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DANBAIWA DATA PLUG — Buy Data Instantly | Best Prices ₦",
  description:
    "🚀 Ultimate data & airtime platform. Buy data for MTN, GLO, Airtel & 9Mobile instantly. Electricity, Cable TV & Exam PINs too!",
  keywords: ["buy data", "cheap data", "MTN data", "GLO data", "Airtel data", "9mobile data", "Nigeria data", "airtime", "cable tv", "electricity"],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://danbaiwahdataplug.com"),
  themeColor: "#06b6d4",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DANBAIWA DATA PLUG",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://danbaiwahdataplug.com",
    siteName: "DANBAIWA DATA PLUG",
    title: "DANBAIWA DATA PLUG — Buy Data Instantly",
    description: "Affordable, always connected. Buy data and airtime for all Nigerian networks at the best prices.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DANBAIWA DATA PLUG - Buy Data Instantly",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DANBAIWA DATA PLUG — Buy Data Instantly",
    description: "Affordable, always connected. Buy data and airtime for all Nigerian networks.",
    images: ["/og-image.png"],
    creator: "@danbaiwa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${dmSans.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
