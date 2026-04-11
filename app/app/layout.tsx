import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import AppLayoutClient from "./layout-client";

export const metadata: Metadata = {
  title: "DANBAIWA DATA PLUG - Buy Data, Airtime & Pay Bills",
  description: "Fast, reliable data, airtime, cable TV & electricity payments. Best prices on MTN, Glo, Airtel & 9Mobile. Download now!",
  themeColor: "#06b6d4",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "DANBAIWA DATA PLUG",
    description: "Your one-stop platform for mobile recharges and utility bills",
    images: ["/logo.png"],
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AppLayoutClient>{children}</AppLayoutClient>
    </Providers>
  );
}
