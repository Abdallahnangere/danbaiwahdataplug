#!/usr/bin/env node

/**
 * Safe Prisma generate that ensures the client is generated
 * Uses placeholder URL if DATABASE_URL not available
 * This is critical for Vercel builds where DATABASE_URL may not be available during npm install
 */

const { execSync } = require("child_process");
const path = require("path");

const originalDbUrl = process.env.DATABASE_URL;
let needsPlaceholder = false;

// If DATABASE_URL isn't available, use a placeholder
// This prevents the schema validation from failing
if (!process.env.DATABASE_URL) {
  console.log("⚠️  DATABASE_URL not set, using placeholder for Prisma generation...");
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/db";
  needsPlaceholder = true;
}

try {
  console.log("🔄 Generating Prisma client...");
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
  
  // Force generation with stderr and stdout to see any issues
  execSync("npx prisma generate --skip-engine-check 2>&1 || npx prisma generate 2>&1", {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });
  
  console.log("✅ Prisma client generated successfully");
  process.exit(0);
} catch (error) {
  if (needsPlaceholder) {
    // If we used placeholder and it failed, just warn but continue
    // The real DATABASE_URL will be available during the actual build
    console.warn("⚠️  Prisma generation with placeholder URL failed");
    console.warn("    This is expected if DATABASE_URL is not set yet");
    console.warn("    It will regenerate during build with the real DATABASE_URL");
    process.exit(0);
  } else {
    // If we had a real DATABASE_URL and generation failed, this is a real error
    console.error("❌ Failed to generate Prisma client with real DATABASE_URL");
    process.exit(1);
  }
}
