CREATE TABLE IF NOT EXISTS "BroadcastMessage" (
  id UUID PRIMARY KEY,
  message TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "stoppedAt" TIMESTAMP NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "BroadcastDismissal" (
  id UUID PRIMARY KEY,
  "broadcastId" UUID NOT NULL REFERENCES "BroadcastMessage"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "BroadcastDismissal_broadcast_user_key"
ON "BroadcastDismissal" ("broadcastId", "userId");

CREATE INDEX IF NOT EXISTS "BroadcastMessage_isActive_createdAt_idx"
ON "BroadcastMessage" ("isActive", "createdAt" DESC);
