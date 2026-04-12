#!/usr/bin/env node

/**
 * Ensure Prisma client is generated even when DATABASE_URL isn't available
 * Only runs during build phase, not during npm install
 * Uses environment variable or placeholder URL
 */

const { execSync } = require("child_process");

const hasDatabase = !!process.env.DATABASE_URL;

if (!hasDatabase) {
  console.log("⚠️  DATABASE_URL not available, using placeholder for Prisma generation...");
  process.env.DATABASE_URL = "postgresql://user:pass@localhost/db";
}

try {
  console.log("🔄 Generating Prisma client...");
  // Use --skip-engine-check to avoid validation issues during build
  execSync("npx prisma generate --skip-engine-check", { stdio: "inherit" });
  console.log("✅ Prisma client generated successfully");
} catch (error) {
  // Attempt regular generate without skip flag if first attempt fails
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✅ Prisma client generated successfully (retry)");
  } catch (retryError) {
    if (hasDatabase) {
      console.error("❌ Failed to generate Prisma client");
      process.exit(1);
    } else {
      console.warn(
        "⚠️  Prisma generation skipped (will retry on deploy with real DATABASE_URL)"
      );
    }
  }
}
