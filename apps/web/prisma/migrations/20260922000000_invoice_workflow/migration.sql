-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "quickBooksCustomerId" TEXT,
ADD COLUMN     "quickBooksRealmId" TEXT;

-- AlterTable
ALTER TABLE "VendorBill" ADD COLUMN     "supplierInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "draft" JSONB;

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "sha256" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "warning" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "duplicateKey" TEXT,
    "approvedAt" TIMESTAMP(3),
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickBooksConnection" (
    "id" TEXT NOT NULL DEFAULT 'company',
    "realmId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "defaults" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickBooksConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickBooksExport" (
    "id" TEXT NOT NULL,
    "realmId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "remoteId" TEXT,
    "attachmentId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickBooksExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_sha256_key" ON "SupplierInvoice"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_duplicateKey_key" ON "SupplierInvoice"("duplicateKey");

-- CreateIndex
CREATE INDEX "SupplierInvoice_projectId_idx" ON "SupplierInvoice"("projectId");

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

