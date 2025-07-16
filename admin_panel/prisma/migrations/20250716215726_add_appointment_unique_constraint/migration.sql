/*
  Warnings:

  - A unique constraint covering the columns `[providerId,customerId,start]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Appointment_providerId_customerId_start_key" ON "Appointment"("providerId", "customerId", "start");
