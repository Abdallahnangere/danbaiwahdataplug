#!/usr/bin/env node

/**
 * Pre-build verification script
 * Ensures Prisma is properly configured before Next.js build
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 Pre-build checks...\n");

// 1. Check @prisma/client exists
const prismaClientPath = path.resolve(__dirname, "..", "node_modules", "@prisma", "client");
if (!fs.existsSync(prismaClientPath)) {
  console.error("❌ @prisma/client not found in node_modules");
  process.exit(1);
}
console.log("✅ @prisma/client found");

// 2. Check schema exists  
const schemaPath = path.resolve(__dirname, "..", "prisma", "schema.prisma");
if (!fs.existsSync(schemaPath)) {
  console.error("❌ prisma/schema.prisma not found");
  process.exit(1);
}
console.log("✅ schema.prisma found");

// 3. Check if .prisma/client is already generated
const generatedClientPath = path.resolve(__dirname, "..", ".prisma", "client");
const needsGeneration = !fs.existsSync(generatedClientPath);

if (needsGeneration) {
  console.log("ℹ️  .prisma/client not found, generating...\n");
  
  try {
    execSync("npx prisma generate", {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
      env: {
        ...process.env,
        // Provide placeholder if DATABASE_URL missing
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://user:pass@localhost/db",
      },
    });
    
    console.log("\n✅ Prisma client generated successfully");
  } catch (error) {
    console.error("\n❌ Prisma generation failed");
    if (process.env.DATABASE_URL) {
      // Real DATABASE_URL is set, so this is a real error
      process.exit(1);
    } else {
      // No DATABASE_URL, warn but continue
      console.warn("⚠️  DATABASE_URL not set - proceeding anyway");
    }
  }
} else {
  console.log("✅ Prisma client already generated");
}

// 4. Verify generated files exist
if (fs.existsSync(generatedClientPath)) {
  const files = fs.readdirSync(generatedClientPath);
  console.log(`✅ .prisma/client contains ${files.length} files`);
}

console.log("\n✨ Pre-build checks complete\n");
