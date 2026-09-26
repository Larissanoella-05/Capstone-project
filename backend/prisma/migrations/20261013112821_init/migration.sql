-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'TECHNICIAN', 'COORDINATOR');

-- CreateEnum
CREATE TYPE "FaultCategory" AS ENUM ('POWER_OUTAGE', 'LOW_VOLTAGE', 'DAMAGED_CONNECTION', 'METER_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "FaultStatus" AS ENUM ('REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WORKING', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('SUPPLY_RESTORED', 'TEMPORARY_REPAIR', 'NO_FAULT_FOUND', 'REFERRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FAULT_SUBMITTED', 'TECHNICIAN_ASSIGNED', 'TECHNICIAN_ON_THE_WAY', 'TECHNICIAN_ARRIVED', 'FAULT_RESOLVED', 'FAULT_CANCELLED', 'JOB_ASSIGNED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "staffNumber" TEXT NOT NULL,
    "onDuty" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCoordinator" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "office" TEXT NOT NULL DEFAULT 'Ndera Sector',

    CONSTRAINT "ServiceCoordinator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceLocation" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "village" TEXT,
    "cell" TEXT NOT NULL,
    "sector" TEXT NOT NULL DEFAULT 'Ndera',
    "district" TEXT NOT NULL DEFAULT 'Gasabo',
    "landmark" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ServiceLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaultReport" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "category" "FaultCategory" NOT NULL,
    "description" TEXT,
    "contactPhone" TEXT,
    "photo" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "FaultStatus" NOT NULL DEFAULT 'REPORTED',
    "customerId" INTEGER NOT NULL,
    "serviceLocationId" INTEGER NOT NULL,
    "technicianId" INTEGER,
    "assignedById" INTEGER,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "onTheWayAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "workingAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "outcome" "Outcome",
    "resolutionNote" TEXT,
    "workCompleted" TEXT,
    "clarificationContacts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaultReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaultStatusHistory" (
    "id" SERIAL NOT NULL,
    "faultId" INTEGER NOT NULL,
    "status" "FaultStatus" NOT NULL,
    "note" TEXT,
    "changedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaultStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianLocation" (
    "id" SERIAL NOT NULL,
    "technicianId" INTEGER NOT NULL,
    "faultId" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicianLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "faultId" INTEGER,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_userId_key" ON "Technician"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_staffNumber_key" ON "Technician"("staffNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCoordinator_userId_key" ON "ServiceCoordinator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceLocation_meterNumber_key" ON "ServiceLocation"("meterNumber");

-- CreateIndex
CREATE INDEX "ServiceLocation_customerId_idx" ON "ServiceLocation"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "FaultReport_reference_key" ON "FaultReport"("reference");

-- CreateIndex
CREATE INDEX "FaultReport_status_idx" ON "FaultReport"("status");

-- CreateIndex
CREATE INDEX "FaultReport_customerId_idx" ON "FaultReport"("customerId");

-- CreateIndex
CREATE INDEX "FaultReport_technicianId_idx" ON "FaultReport"("technicianId");

-- CreateIndex
CREATE INDEX "FaultStatusHistory_faultId_createdAt_idx" ON "FaultStatusHistory"("faultId", "createdAt");

-- CreateIndex
CREATE INDEX "TechnicianLocation_technicianId_recordedAt_idx" ON "TechnicianLocation"("technicianId", "recordedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCoordinator" ADD CONSTRAINT "ServiceCoordinator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLocation" ADD CONSTRAINT "ServiceLocation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaultReport" ADD CONSTRAINT "FaultReport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaultReport" ADD CONSTRAINT "FaultReport_serviceLocationId_fkey" FOREIGN KEY ("serviceLocationId") REFERENCES "ServiceLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaultReport" ADD CONSTRAINT "FaultReport_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaultReport" ADD CONSTRAINT "FaultReport_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "ServiceCoordinator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaultStatusHistory" ADD CONSTRAINT "FaultStatusHistory_faultId_fkey" FOREIGN KEY ("faultId") REFERENCES "FaultReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaultStatusHistory" ADD CONSTRAINT "FaultStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianLocation" ADD CONSTRAINT "TechnicianLocation_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianLocation" ADD CONSTRAINT "TechnicianLocation_faultId_fkey" FOREIGN KEY ("faultId") REFERENCES "FaultReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_faultId_fkey" FOREIGN KEY ("faultId") REFERENCES "FaultReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
