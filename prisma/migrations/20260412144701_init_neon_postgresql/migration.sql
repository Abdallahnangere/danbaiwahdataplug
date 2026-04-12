-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "pin" TEXT,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "tier" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "networkId" INTEGER NOT NULL,
    "networkName" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "validity" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "userPrice" DECIMAL(10,2),
    "agentPrice" DECIMAL(10,2),
    "apiAId" INTEGER,
    "apiBId" INTEGER,
    "activeApi" TEXT NOT NULL DEFAULT 'A',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "networkId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "providerUsed" TEXT NOT NULL,
    "providerRef" TEXT,
    "providerResponse" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "balanceBefore" DECIMAL(10,2),
    "balanceAfter" DECIMAL(10,2),
    "customerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "DataTransaction" ADD CONSTRAINT "DataTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataTransaction" ADD CONSTRAINT "DataTransaction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DataPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
