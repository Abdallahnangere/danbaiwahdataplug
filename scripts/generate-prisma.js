#!/usr/bin/env node

/**
 * Prisma client generation script
 * Silently tries to generate Prisma client during build
 * SUCCESS: Database URL available → generates successfully
 * SKIP: Prisma client already generated in node_modules → skips
 * FAIL: Generation fails → continues anyway (build won't use DB at build time)
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Check if @prisma/client already exists
const prismaClientPath = path.resolve(__dirname, "..", "node_modules", "@prisma", "client");
const prismaClientExists = fs.existsSync(prismaClientPath);

if (prismaClientExists) {
  process.exit(0);
}

// Try to generate Prisma client
const result = spawnSync("npx", ["prisma", "generate"], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "pipe",
  timeout: 60000,
});

// Exit successfully regardless (ignore generation failures)
process.exit(0);
