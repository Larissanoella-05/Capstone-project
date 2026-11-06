-- CreateEnum
CREATE TYPE "LocationSource" AS ENUM ('GPS', 'TYPED');

-- AlterTable
ALTER TABLE "FaultReport" ADD COLUMN     "accuracyM" INTEGER,
ADD COLUMN     "cell" TEXT,
ADD COLUMN     "claimedMeter" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationSource" "LocationSource",
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "placeText" TEXT,
ADD COLUMN     "trackingToken" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL,
ALTER COLUMN "serviceLocationId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FaultReport_trackingToken_key" ON "FaultReport"("trackingToken");

