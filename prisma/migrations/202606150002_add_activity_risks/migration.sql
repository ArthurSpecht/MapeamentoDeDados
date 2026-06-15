CREATE TABLE "ActivityRisk" (
    "id" TEXT NOT NULL,
    "processingActivityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "impact" TEXT NOT NULL,
    "probability" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityRisk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityRisk_processingActivityId_idx" ON "ActivityRisk"("processingActivityId");
CREATE INDEX "ActivityRisk_createdAt_idx" ON "ActivityRisk"("createdAt");

ALTER TABLE "ActivityRisk"
ADD CONSTRAINT "ActivityRisk_processingActivityId_fkey"
FOREIGN KEY ("processingActivityId") REFERENCES "ProcessingActivity"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
