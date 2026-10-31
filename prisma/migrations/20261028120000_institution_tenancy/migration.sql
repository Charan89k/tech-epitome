-- Institution tenancy, part 1: tables.
--
-- Additive only. Existing users get status ACTIVE and sessionVersion 0,
-- which every JWT issued before this migration also carries (a token with
-- no version reads as 0), so nobody is signed out by deploying it.
-- Institutions start empty, so no existing user gains or loses access.
--
-- RLS is enabled on every new table here, as the lock-down migration
-- requires; the policies that let the tenant role in are in the next
-- migration.

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InstitutionRole" AS ENUM ('STUDENT', 'FACULTY', 'INSTITUTION_ADMIN');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "MembershipSource" AS ENUM ('INVITATION', 'EMAIL_DOMAIN', 'PLATFORM');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "suspendedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "InstitutionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_domains" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institution_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_memberships" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "InstitutionRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "MembershipSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "institution_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_invitations" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "InstitutionRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institution_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_audit_logs" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institution_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institutions_slug_key" ON "institutions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "institution_domains_domain_key" ON "institution_domains"("domain");

-- CreateIndex
CREATE INDEX "institution_domains_institutionId_idx" ON "institution_domains"("institutionId");

-- CreateIndex
CREATE INDEX "institution_memberships_userId_idx" ON "institution_memberships"("userId");

-- CreateIndex
CREATE INDEX "institution_memberships_institutionId_role_status_idx" ON "institution_memberships"("institutionId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "institution_memberships_institutionId_userId_key" ON "institution_memberships"("institutionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "institution_invitations_tokenHash_key" ON "institution_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "institution_invitations_institutionId_email_idx" ON "institution_invitations"("institutionId", "email");

-- CreateIndex
CREATE INDEX "institution_audit_logs_institutionId_createdAt_idx" ON "institution_audit_logs"("institutionId", "createdAt");

-- AddForeignKey
ALTER TABLE "institution_domains" ADD CONSTRAINT "institution_domains_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_invitations" ADD CONSTRAINT "institution_invitations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_audit_logs" ADD CONSTRAINT "institution_audit_logs_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Keep Supabase's Data API out, as for every other table.
ALTER TABLE "institutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "institution_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "institution_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "institution_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "institution_audit_logs" ENABLE ROW LEVEL SECURITY;
