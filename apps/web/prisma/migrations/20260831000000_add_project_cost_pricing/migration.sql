-- Add categorized project costs and a saved COGS-to-retail multiplier.
ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "retailMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1;

ALTER TABLE "VendorBill"
ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'OTHER';
