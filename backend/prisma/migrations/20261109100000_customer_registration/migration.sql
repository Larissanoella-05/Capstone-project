-- Phone numbers and meter numbers are now matched exactly (sign-in by phone, a meter per customer),
-- so the spaces in values such as '+250 788 300 114' and '0421 5583 019' go first.
UPDATE "User" SET "phone" = regexp_replace("phone", '\s', '', 'g') WHERE "phone" IS NOT NULL;
UPDATE "ServiceLocation" SET "meterNumber" = regexp_replace("meterNumber", '\s', '', 'g');

-- DropIndex
DROP INDEX "ServiceLocation_meterNumber_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceLocation_customerId_meterNumber_key" ON "ServiceLocation"("customerId", "meterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
