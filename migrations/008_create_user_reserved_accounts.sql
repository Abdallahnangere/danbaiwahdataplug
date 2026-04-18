CREATE TABLE IF NOT EXISTS "UserReservedAccount" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "billstackReference" VARCHAR(255),
  "accountNumber" VARCHAR(255) NOT NULL UNIQUE,
  "accountName" VARCHAR(255),
  "bankName" VARCHAR(255),
  "bankId" VARCHAR(255) NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserReservedAccount_user_bank_key"
ON "UserReservedAccount" ("userId", "bankId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserReservedAccount_primary_key"
ON "UserReservedAccount" ("userId")
WHERE "isPrimary" = true;
