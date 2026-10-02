-- Preserve every existing multiplier and historical freight treatment.
ALTER TABLE "Project" ADD COLUMN "pricingPolicy" TEXT NOT NULL DEFAULT 'LEGACY_DELIVERY_AT_COST',
  ADD COLUMN "priceApprovedVersion" TEXT,
  ADD COLUMN "priceApprovedById" TEXT,
  ADD COLUMN "priceApprovedAt" TIMESTAMP(3);
ALTER TABLE "Project" ALTER COLUMN "pricingPolicy" SET DEFAULT 'ALL_COSTS';
ALTER TABLE "Project" ALTER COLUMN "retailMultiplier" SET DEFAULT 2;

-- All cost writers share the same row lock as price approval/invoice freezing.
-- No existing rows or agreed prices are changed by this migration.
CREATE FUNCTION invalidate_project_price_approval() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW."projectId" <> OLD."projectId" THEN
    RAISE EXCEPTION 'Move costs through an explicitly reviewed correction';
  END IF;
  UPDATE "Project" SET "priceApprovedVersion" = NULL,
    "priceApprovedById" = NULL, "priceApprovedAt" = NULL
    WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD."projectId" ELSE NEW."projectId" END;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER vendor_bill_price_approval BEFORE INSERT OR UPDATE OR DELETE ON "VendorBill"
FOR EACH ROW EXECUTE FUNCTION invalidate_project_price_approval();
