/**
 * DANBAIWA DATA PLUG - Brand Identity & Design System
 * Color Palette: Cyan/Turquoise → Orange/Yellow Gradient
 * Modern, high-energy aesthetic with particle effects
 */

export const BrandColors = {
  // Primary Gradients
  gradient: {
    primary: "from-cyan-400 via-blue-500 to-orange-500",
    secondary: "from-blue-600 to-purple-600",
    accent: "from-cyan-400 to-yellow-400",
    glow: "from-pink-500 via-blue-500 to-green-500",
  },

  // Core Colors
  cyan: "#00D9FF",
  turquoise: "#00E8D1",
  blue: "#1E40AF",
  orange: "#FF6B35",
  yellow: "#FFD700",
  gold: "#FDB022",
  purple: "#8B5CF6",
  pink: "#EC4899",
  green: "#10B981",
  red: "#EF4444",

  // Neutral Colors
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Dark background (for particles effect)
  darkBg: "#0F1419",
  darkCard: "#1A1F2E",

  // Semantic Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

export const BrandGradients = {
  // Text Gradients
  textPrimary: "bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent",
  textAccent: "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent",
  
  // Button Gradients
  buttonPrimary: "bg-gradient-to-r from-cyan-400 to-orange-500 hover:shadow-lg hover:shadow-orange-500/50",
  buttonSecondary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/50",
  
  // Card Gradients
  cardBg: "bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-lg",
  cardBgDark: "bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg",
};

export const ShadowStyles = {
  glow: {
    cyan: "shadow-lg shadow-cyan-400/50",
    orange: "shadow-lg shadow-orange-500/50",
    purple: "shadow-lg shadow-purple-600/50",
    pink: "shadow-lg shadow-pink-500/50",
  },
  card: "shadow-lg shadow-black/5",
  cardHover: "shadow-xl shadow-black/10",
};

export const BorderStyles = {
  gradient: "border-transparent bg-gradient-to-r from-cyan-400/20 to-orange-500/20",
  subtle: "border-gray-200/50",
  accent: "border-cyan-400/30",
};

export const MinimalColors = {
  // Minimalist palette for clean UI
  surface: BrandColors.white,
  surfaceAlt: BrandColors.gray[50],
  surfaceDim: BrandColors.gray[100],
  border: BrandColors.gray[200],
  text: BrandColors.gray[900],
  textSecondary: BrandColors.gray[600],
  textTertiary: BrandColors.gray[400],
  accent: BrandColors.cyan,
  accentAlt: BrandColors.orange,
};

export const IconGradients = {
  cyan: "text-cyan-400",
  orange: "text-orange-500",
  blue: "text-blue-600",
  purple: "text-purple-600",
  yellow: "text-yellow-400",
  green: "text-green-500",
  pink: "text-pink-500",
  gradient: "bg-gradient-to-r from-cyan-400 to-orange-500",
};

// Legacy color system for compatibility
export const LegacyColors = {
  bg: "#ffffff",
  surface: "#f8f9fc",
  card: "#ffffff",
  border: "#e5e7eb",
  blueLight: "#dbeafe",
  blue: "#2563eb",
  blueShadow: "0 12px 30px rgba(37, 99, 235, 0.15)",
  blueBorder: "rgba(37, 99, 235, 0.2)",
  gold: "#fbbf24",
  green: "#10b981",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  text: "#1f2937",
  textMid: "#6b7280",
  textDim: "#9ca3af",
  font: "'DM Sans', sans-serif",
  mono: "'DM Mono', monospace",
};
