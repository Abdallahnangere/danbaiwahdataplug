import Image from "next/image";
import Link from "next/link";

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

export function Logo({
  variant = "default",
  size = "md",
  href = "/",
  className = "",
}: LogoProps) {
  const dimensions = sizeMap[size];

  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: dimensions.logo, height: dimensions.logo }}>
        <Image
          src="/logo.jpeg"
          alt="Danbaiwa Data Plug"
          fill
          className="object-contain"
          priority={true}
          quality={100}
          sizes={`${dimensions.logo}px`}
          unoptimized={false}
        />
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

// Icon-only variant for compact use cases
export function LogoIcon({ size = "md", className = "" }: Omit<LogoProps, "variant" | "href">) {
  const dimensions = sizeMap[size];

  return (
    <div className={`relative ${className}`} style={{ width: dimensions.logo, height: dimensions.logo }}>
      <Image
        src="/logo.jpeg"
        alt="Danbaiwa Data Plug"
        fill
        className="object-contain"
        priority={true}
        quality={100}
        sizes={`${dimensions.logo}px`}
        unoptimized={false}
      />
    </div>
  );
}
