-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ActiveApi" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "ApiProvider" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pinHash" TEXT,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "tier" TEXT NOT NULL DEFAULT 'user',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VirtualAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataNetwork" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "networkCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "apiAId" INTEGER,
    "apiBId" INTEGER,
    "price" DECIMAL(65,30) NOT NULL,
    "activeApi" "ActiveApi" NOT NULL DEFAULT 'A',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "apiUsed" "ApiProvider",
    "providerResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "VirtualAccount_userId_key" ON "VirtualAccount"("userId");

-- CreateIndex
CREATE INDEX "VirtualAccount_userId_idx" ON "VirtualAccount"("userId");

-- CreateIndex
CREATE INDEX "DataNetwork_name_idx" ON "DataNetwork"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DataNetwork_networkCode_key" ON "DataNetwork"("networkCode");

-- CreateIndex
CREATE INDEX "DataPlan_networkId_idx" ON "DataPlan"("networkId");

-- CreateIndex
CREATE INDEX "DataPlan_isActive_idx" ON "DataPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DataTransaction_reference_key" ON "DataTransaction"("reference");

-- CreateIndex
CREATE INDEX "DataTransaction_userId_idx" ON "DataTransaction"("userId");

-- CreateIndex
CREATE INDEX "DataTransaction_status_idx" ON "DataTransaction"("status");

-- CreateIndex
CREATE INDEX "DataTransaction_createdAt_idx" ON "DataTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "DataTransaction_phone_idx" ON "DataTransaction"("phone");

-- AddForeignKey
ALTER TABLE "VirtualAccount" ADD CONSTRAINT "VirtualAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataPlan" ADD CONSTRAINT "DataPlan_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "DataNetwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataTransaction" ADD CONSTRAINT "DataTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataTransaction" ADD CONSTRAINT "DataTransaction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DataPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
