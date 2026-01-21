-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TALENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PortfolioType" AS ENUM ('IMAGE', 'VIDEO', 'LINK');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "ProjectAssignedType" AS ENUM ('INDIVIDUAL', 'TEAM');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SENT', 'QUOTE_RECEIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('SUBMITTED', 'REVISED', 'ACCEPTED_INTERNAL', 'REJECTED_INTERNAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TALENT',
    "status" "UserStatus" NOT NULL DEFAULT 'DRAFT',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isTeamLeader" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "primaryDiscipline" TEXT,
    "skills" TEXT[],
    "industries" TEXT[],
    "languages" TEXT[],
    "websiteInternal" TEXT,
    "socialsInternal" JSONB,
    "approvalNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PortfolioType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "assetUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "leaderUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TeamMemberStatus" NOT NULL DEFAULT 'INVITED',
    "roleInTeam" TEXT,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRequest" (
    "id" TEXT NOT NULL,
    "createdByAdminId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "timeline" TEXT NOT NULL,
    "budgetRange" TEXT,
    "dueDateForQuote" TIMESTAMP(3),
    "assignedType" "ProjectAssignedType" NOT NULL,
    "assignedUserId" TEXT,
    "assignedTeamId" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAttachment" (
    "id" TEXT NOT NULL,
    "projectRequestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "projectRequestId" TEXT NOT NULL,
    "submittedByUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "breakdown" JSONB,
    "assumptions" TEXT,
    "turnaroundTime" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "talentSlug" TEXT,
    "teamSlug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_userId_key" ON "TalentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_publicSlug_key" ON "TalentProfile"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderUserId_fkey" FOREIGN KEY ("leaderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_assignedTeamId_fkey" FOREIGN KEY ("assignedTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAttachment" ADD CONSTRAINT "ProjectAttachment_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_projectRequestId_fkey" FOREIGN KEY ("projectRequestId") REFERENCES "ProjectRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
