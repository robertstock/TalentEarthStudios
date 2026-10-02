-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "approvedSowBody" TEXT,
ADD COLUMN     "approvedSowRevision" INTEGER,
ADD COLUMN     "folderName" TEXT,
ADD COLUMN     "jobNumber" TEXT,
ADD COLUMN     "productionFolder" TEXT,
ADD COLUMN     "sowBody" TEXT,
ADD COLUMN     "sowRevision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workflowApprovedAt" TIMESTAMP(3),
ADD COLUMN     "workflowApprovedById" TEXT,
ADD COLUMN     "workflowState" TEXT;

-- CreateTable
CREATE TABLE "JobSubmission" (
    "id" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT,

    CONSTRAINT "JobSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyJobSequence" (
    "day" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "DailyJobSequence_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "WorkflowTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "revision" INTEGER,
    "payload" JSONB NOT NULL,
    "leaseToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "attention" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundInvoice" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "sourceMessageIds" TEXT[],
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "jobNumber" TEXT,
    "projectId" TEXT,
    "vendorKey" TEXT,
    "details" JSONB NOT NULL,
    "state" TEXT NOT NULL,
    "attention" TEXT,
    "localPath" TEXT,
    "supplierInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobSubmission_projectId_key" ON "JobSubmission"("projectId");

-- CreateIndex
CREATE INDEX "WorkflowTask_kind_state_idx" ON "WorkflowTask"("kind", "state");

-- CreateIndex
CREATE UNIQUE INDEX "InboundInvoice_sha256_key" ON "InboundInvoice"("sha256");

-- CreateIndex
CREATE INDEX "InboundInvoice_vendorKey_idx" ON "InboundInvoice"("vendorKey");

-- CreateIndex
CREATE INDEX "InboundInvoice_projectId_state_idx" ON "InboundInvoice"("projectId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Project_jobNumber_key" ON "Project"("jobNumber");

-- AddForeignKey
ALTER TABLE "JobSubmission" ADD CONSTRAINT "JobSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundInvoice" ADD CONSTRAINT "InboundInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Historical projects remain unnumbered. A numbered identity can never be reused.
CREATE FUNCTION guard_numbered_job() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD."jobNumber" IS NOT NULL THEN RAISE EXCEPTION 'Numbered jobs must be retained; cancel instead'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' AND OLD."jobNumber" IS DISTINCT FROM NEW."jobNumber" THEN
  RAISE EXCEPTION 'Job number is immutable; no historical renumbering';
 END IF;
 IF NEW."jobNumber" IS NOT NULL THEN
  IF NEW."workflowState"='AWAITING_APPROVAL' AND NEW.status NOT IN ('SOW_DRAFT','CANCELLED') THEN
   RAISE EXCEPTION 'Owner approval of latest saved SOW is required';
  END IF;
  IF NEW.status IN ('IN_PROGRESS','COMPLETED') AND
    (NEW."workflowState"<>'READY' OR NEW."approvedSowRevision" IS DISTINCT FROM NEW."sowRevision" OR NEW."productionFolder" IS NULL) THEN
   RAISE EXCEPTION 'Production requires current SOW approval and acknowledged folder';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER numbered_job_guard BEFORE INSERT OR UPDATE OR DELETE ON "Project" FOR EACH ROW EXECUTE FUNCTION guard_numbered_job();

CREATE FUNCTION guard_numbered_sow_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM "Project" WHERE id=OLD."projectId" AND "jobNumber" IS NOT NULL) THEN
  IF TG_OP='DELETE' OR NEW."bodyRichText" IS DISTINCT FROM OLD."bodyRichText" OR NEW."versionNumber" IS DISTINCT FROM OLD."versionNumber" OR NEW."projectId" IS DISTINCT FROM OLD."projectId" THEN
   RAISE EXCEPTION 'Saved SOW snapshots are immutable; create a new workflow revision';
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER numbered_sow_snapshot_guard BEFORE UPDATE OR DELETE ON "SOW" FOR EACH ROW EXECUTE FUNCTION guard_numbered_sow_snapshot();
