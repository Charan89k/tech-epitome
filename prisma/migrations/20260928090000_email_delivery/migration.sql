-- Email delivery records, and the opt-in that gates them.
--
-- `email_deliveries` is both the audit trail and the idempotency
-- mechanism: the unique index on (userId, kind, periodKey) is what stops a
-- scheduler firing twice in a period from producing two sends. Doing it
-- with a constraint rather than a time-window query matters because two
-- workers can both pass a query and only one can win an insert.
--
-- `emailReviewReminders` defaults to FALSE, unlike the in-app preferences
-- next to it. Mail leaves the building and cannot be un-sent, so switching
-- on a provider must not immediately mail everyone who ever signed up.

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "emailReviewReminders" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "email_deliveries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_deliveries_createdAt_idx" ON "email_deliveries"("createdAt");

-- CreateIndex
CREATE INDEX "email_deliveries_userId_createdAt_idx" ON "email_deliveries"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_deliveries_userId_kind_periodKey_key" ON "email_deliveries"("userId", "kind", "periodKey");

-- AddForeignKey
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
