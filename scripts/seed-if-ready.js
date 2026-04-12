#!/usr/bin/env node

/**
 * Safely attempt to seed database after build
 * Only runs if DATABASE_URL is available
 * Non-blocking - doesn't fail the build if seed fails
 */

const { spawn } = require("child_process");
const path = require("path");

const isDatabaseReady = !!process.env.DATABASE_URL;

if (!isDatabaseReady) {
  console.log("⏭️  DATABASE_URL not set, skipping auto-seed");
  process.exit(0);
}

console.log("🌱 Attempting to seed database after build...");

const seed = spawn("npx", ["ts-node", "prisma/seed.ts"], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
});

seed.on("close", (code) => {
  if (code === 0) {
    console.log("✨ Database seeding completed successfully!");
    process.exit(0);
  } else {
    console.log(
      "⚠️  Seed process failed but build completed. You can manually seed later."
    );
    // Don't fail the build if seed fails
    process.exit(0);
  }
});

seed.on("error", (error) => {
  console.error("⚠️  Seed error (non-blocking):", error.message);
  process.exit(0);
});
