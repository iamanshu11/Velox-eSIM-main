ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "countryCode" TEXT,
ADD COLUMN IF NOT EXISTS "countryName" TEXT,
ADD COLUMN IF NOT EXISTS "countrySource" TEXT,
ADD COLUMN IF NOT EXISTS "lastSeenCountryCode" TEXT,
ADD COLUMN IF NOT EXISTS "lastSeenCountryName" TEXT,
ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "users_countryCode_idx" ON "users"("countryCode");
CREATE INDEX IF NOT EXISTS "users_lastSeenCountryCode_idx" ON "users"("lastSeenCountryCode");