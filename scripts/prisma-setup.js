#!/usr/bin/env node

/**
 * Ensure Prisma client is generated even when DATABASE_URL isn't available
 * Uses a placeholder URL for schema validation during build
 */

const { execSync } = require("child_process");
const path = require("path");

const hasDatabase = !!process.env.DATABASE_URL;

if (!hasDatabase) {
  console.log("⚠️  DATABASE_URL not available, using placeholder for Prisma generation...");
  process.env.DATABASE_URL =
    "postgresql://user:password@localhost:5432/build-placeholder";
}

try {
  console.log("🔄 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma client generated successfully");
} catch (error) {
  if (hasDatabase) {
    // If error occurred and we had a real DATABASE_URL, this is a real error
    console.error("❌ Failed to generate Prisma client:", error.message);
    process.exit(1);
  } else {
    // If error occurred with placeholder URL, log but continue (will regenerate on deploy)
    console.warn(
      "⚠️  Prisma generation with placeholder URL failed (this is okay, will regenerate on deploy with real DATABASE_URL)"
    );
  }
}
