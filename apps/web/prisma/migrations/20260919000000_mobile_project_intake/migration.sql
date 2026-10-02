-- CreateTable
CREATE TABLE "MobileAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileChallenge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobileSession" (
    "tokenHash" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileSession_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "MobileRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MobileSubmission" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "projectId" TEXT NOT NULL,
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MobileAccount_email_key" ON "MobileAccount"("email");

-- CreateIndex
CREATE INDEX "MobileChallenge_email_idx" ON "MobileChallenge"("email");

-- CreateIndex
CREATE INDEX "MobileChallenge_expiresAt_idx" ON "MobileChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "MobileSession_accountId_idx" ON "MobileSession"("accountId");

-- CreateIndex
CREATE INDEX "MobileSession_expiresAt_idx" ON "MobileSession"("expiresAt");

-- CreateIndex
CREATE INDEX "MobileRateLimit_expiresAt_idx" ON "MobileRateLimit"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MobileSubmission_projectId_key" ON "MobileSubmission"("projectId");

-- CreateIndex
CREATE INDEX "MobileSubmission_accountId_idx" ON "MobileSubmission"("accountId");

-- CreateIndex
CREATE INDEX "MobileSubmission_notificationSentAt_idx" ON "MobileSubmission"("notificationSentAt");

-- AddForeignKey
ALTER TABLE "MobileSession" ADD CONSTRAINT "MobileSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MobileAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileSubmission" ADD CONSTRAINT "MobileSubmission_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MobileAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobileSubmission" ADD CONSTRAINT "MobileSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

