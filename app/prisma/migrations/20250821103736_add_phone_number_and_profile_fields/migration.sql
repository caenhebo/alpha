-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "address" TEXT;
ALTER TABLE "profiles" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "profiles" ADD COLUMN "city" TEXT;
ALTER TABLE "profiles" ADD COLUMN "country" TEXT;
ALTER TABLE "profiles" ADD COLUMN "dateOfBirth" DATETIME;
ALTER TABLE "profiles" ADD COLUMN "postalCode" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "phoneNumber" TEXT;
