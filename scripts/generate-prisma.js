#!/usr/bin/env node

/**
 * Robust Prisma client generation
 * Handles missing DATABASE_URL gracefully
 * This runs during both postinstall and build
 */

const { execSync } = require("child_process");
const path = require("path");

const cwd = path.resolve(__dirname, "..");

// Try to generate with DATABASE_URL if available
// Otherwise use placeholder URL
const env = { ...process.env };
if (!env.DATABASE_URL) {
  console.log("ℹ️  DATABASE_URL not available, using placeholder for schema...");
  env.DATABASE_URL = "postgresql://placeholder:placeholder@localhost:5432/placeholder";
}

try {
  console.log("🔄 Generating Prisma client...");
  
  // First try with --skip-engine-check (skips database validation)
  execSync("npx prisma generate --skip-engine-check", {
    stdio: ["ignore", "pipe", "pipe"],
    env,
    cwd,
  });
  
  console.log("✅ Prisma client generated successfully");
  process.exit(0);
} catch (firstError) {
  // If that fails, try without the flag
  try {
    console.log("   Retrying without --skip-engine-check...");
    execSync("npx prisma generate", {
      stdio: ["ignore", "pipe", "pipe"],
      env,
      cwd,
    });
    
    console.log("✅ Prisma client generated successfully (retry)");
    process.exit(0);
  } catch (secondError) {
    // If both fail and we have a real DATABASE_URL, fail hard
    if (process.env.DATABASE_URL) {
      console.error("❌ Failed to generate Prisma client");
      process.exit(1);
    }
    
    // If no DATABASE_URL was available, just warn and continue
    console.warn("⚠️  Prisma generation skipped - DATABASE_URL not available");
    console.warn("    The application will regenerate during build with proper DATABASE_URL");
    process.exit(0);
  }
}
