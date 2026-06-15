-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ProcessingActivity" (
    "id" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "activityCode" TEXT,
    "personalData" TEXT NOT NULL DEFAULT '',
    "purpose" TEXT NOT NULL DEFAULT '',
    "legalBasis" TEXT NOT NULL DEFAULT '',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityPurpose" (
    "id" TEXT NOT NULL,
    "processingActivityId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT '',
    "retentionDeadline" TEXT NOT NULL DEFAULT 'Indeterminado',
    "legalBasis" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityPurpose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalDataItem" (
    "id" TEXT NOT NULL,
    "processingActivityId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Geral',
    "dataName" TEXT NOT NULL,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "subjectTypes" TEXT[],
    "sync" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalDataItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingActivity_activityCode_key" ON "ProcessingActivity"("activityCode");

-- CreateIndex
CREATE INDEX "ActivityPurpose_processingActivityId_idx" ON "ActivityPurpose"("processingActivityId");

-- CreateIndex
CREATE INDEX "PersonalDataItem_processingActivityId_idx" ON "PersonalDataItem"("processingActivityId");

-- AddForeignKey
ALTER TABLE "ActivityPurpose" ADD CONSTRAINT "ActivityPurpose_processingActivityId_fkey" FOREIGN KEY ("processingActivityId") REFERENCES "ProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalDataItem" ADD CONSTRAINT "PersonalDataItem_processingActivityId_fkey" FOREIGN KEY ("processingActivityId") REFERENCES "ProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
