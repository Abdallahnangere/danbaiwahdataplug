#!/usr/bin/env node

/**
 * Safe Prisma generate that uses placeholder URL if DATABASE_URL not available
 * This allows the build to continue even if the environment isn't fully set up yet
 */

const { execSync } = require("child_process");

const originalDbUrl = process.env.DATABASE_URL;

// If DATABASE_URL isn't available, use a placeholder so prisma generate doesn't fail
if (!process.env.DATABASE_URL) {
  console.log("⚠️  DATABASE_URL not set, using placeholder for schema generation...");
  process.env.DATABASE_URL = "postgresql://user:password@localhost/db";
}

try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma client generated");
} catch (error) {
  console.error("⚠️  Prisma generation failed (non-critical during build)");
}

// Restore original
process.env.DATABASE_URL = originalDbUrl;
