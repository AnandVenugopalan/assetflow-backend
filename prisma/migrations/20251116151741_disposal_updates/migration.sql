/*
  Warnings:

  - You are about to drop the `DisposalRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DisposalRequest" DROP CONSTRAINT "DisposalRequest_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "DisposalRequest" DROP CONSTRAINT "DisposalRequest_assetId_fkey";

-- DropTable
DROP TABLE "DisposalRequest";

-- CreateTable
CREATE TABLE "Disposal" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisposalStatus" NOT NULL DEFAULT 'REQUESTED',
    "method" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "salvageValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disposal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Disposal" ADD CONSTRAINT "Disposal_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposal" ADD CONSTRAINT "Disposal_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
