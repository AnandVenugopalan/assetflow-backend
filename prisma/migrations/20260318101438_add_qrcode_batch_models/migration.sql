-- CreateTable
CREATE TABLE "QRCodeBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" SERIAL NOT NULL,
    "startNumber" INTEGER NOT NULL,
    "endNumber" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "generatedBy" TEXT,
    "pdfUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCodeBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCodeSequence" (
    "id" TEXT NOT NULL,
    "currentNumber" INTEGER NOT NULL DEFAULT 100000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCodeSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QRCodeBatch_batchNumber_key" ON "QRCodeBatch"("batchNumber");
