import { Metadata } from "next";

export interface StructuredData {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

export function generateOrganizationSchema(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DANBAIWA DATA PLUG",
    url: "https://danbaiwahdataplug.com",
    logo: "https://danbaiwahdataplug.com/logo.jpeg",
    description: "Buy data, airtime, electricity bills, cable TV and exam PINs instantly at the best prices in Nigeria",
    sameAs: [
      "https://www.facebook.com/danbaiwa",
      "https://www.whatsapp.com",
      "https://www.instagram.com/danbaiwa",
      "https://twitter.com/danbaiwa",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+234-XXX-XXXX-XXX",
      contactType: "Customer Service",
      areaServed: "NG",
      availableLanguage: ["en"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
      addressLocality: "Lagos",
      addressRegion: "Nigeria",
    },
  };
}

export function generateWebsiteSchema(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DANBAIWA DATA PLUG",
    url: "https://danbaiwahdataplug.com",
    description: "Ultimate data & airtime platform for Nigeria",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://danbaiwahdataplug.com/search?q={search_term_string}",
      },
      query_input: "required name=search_term_string",
    },
  };
}

export function generateLocalBusinessSchema(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "DANBAIWA DATA PLUG",
    image: "https://danbaiwahdataplug.com/og-image.png",
    description: "Digital services platform offering data, airtime, and utility bill payments",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
      addressLocality: "Lagos",
      addressRegion: "Nigeria",
    },
    telephone: "+234-XXX-XXXX-XXX",
    url: "https://danbaiwahdataplug.com",
    priceRange: "₦100 - ₦100,000",
    areaServed: "NG",
  };
}

export const structuredDataScripts: StructuredData[] = [
  generateOrganizationSchema(),
  generateWebsiteSchema(),
  generateLocalBusinessSchema(),
];
