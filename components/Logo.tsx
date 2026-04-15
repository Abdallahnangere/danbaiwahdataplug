import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface LogoProps {
  variant?: "default" | "horizontal" | "compact";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { logo: 32, text: 14 },
  md: { logo: 48, text: 16 },
  lg: { logo: 64, text: 20 },
};

// Fallback gradient logo when image fails to load
function LogoFallback({ dimensions }: { dimensions: { logo: number; text: number } }) {
  return (
    <div
      className="rounded-lg bg-gradient-to-br from-cyan-400 to-orange-500 flex items-center justify-center font-bold text-white"
      style={{ width: dimensions.logo, height: dimensions.logo, fontSize: dimensions.logo * 0.6 }}
    >
      DB
    </div>
  );
}

export function Logo({
  variant = "default",
  size = "md",
  href = "/",
  className = "",
}: LogoProps) {
  const dimensions = sizeMap[size];
  const [imageError, setImageError] = useState(false);

  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: dimensions.logo, height: dimensions.logo }}>
        {imageError ? (
          <LogoFallback dimensions={dimensions} />
        ) : (
          <Image
            src="/logo.jpeg"
            alt="Danbaiwa Data Plug Logo"
            fill
            className="object-contain"
            priority
            sizes={`${dimensions.logo}px`}
            quality={90}
            onError={() => setImageError(true)}
          />
        )}
      </div>
      {variant !== "compact" && (
        <div className="flex flex-col">
          <span
            className="font-bold bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent"
            style={{ fontSize: dimensions.text }}
          >
            Danbaiwa
          </span>
          {variant === "horizontal" && (
            <span className="text-xs text-gray-400">Data Plug</span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}

// Simplified icon-only variant
export function LogoIcon({ size = "md", className = "" }: Omit<LogoProps, "variant" | "href">) {
  const dimensions = sizeMap[size];
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`relative ${className}`} style={{ width: dimensions.logo, height: dimensions.logo }}>
      {imageError ? (
        <LogoFallback dimensions={dimensions} />
      ) : (
        <Image
          src="/logo.jpeg"
          alt="Danbaiwa Data Plug"
          fill
          className="object-contain"
          priority
          sizes={`${dimensions.logo}px`}
          quality={90}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
