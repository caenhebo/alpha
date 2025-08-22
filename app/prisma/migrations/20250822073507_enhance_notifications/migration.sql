/*
  Warnings:

  - Added the required column `offerPrice` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "data" JSONB;
ALTER TABLE "notifications" ADD COLUMN "propertyId" TEXT;

-- CreateTable
CREATE TABLE "counter_offers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "message" TEXT,
    "terms" TEXT,
    "fromBuyer" BOOLEAN NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "rejected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "counter_offers_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_status_history_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "escrow_details" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "escrowAccountId" TEXT,
    "escrowProvider" TEXT,
    "totalAmount" DECIMAL NOT NULL,
    "initialDeposit" DECIMAL,
    "finalPayment" DECIMAL,
    "releaseConditions" TEXT,
    "fundsReceived" BOOLEAN NOT NULL DEFAULT false,
    "fundsReleased" BOOLEAN NOT NULL DEFAULT false,
    "fundingDate" DATETIME,
    "releaseDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "escrow_details_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFER',
    "offerPrice" DECIMAL NOT NULL,
    "agreedPrice" DECIMAL,
    "initialPayment" DECIMAL,
    "cryptoPercentage" INTEGER,
    "fiatPercentage" INTEGER,
    "offerMessage" TEXT,
    "offerTerms" TEXT,
    "proposalDate" DATETIME,
    "acceptanceDate" DATETIME,
    "escrowDate" DATETIME,
    "completionDate" DATETIME,
    "deadlineDate" DATETIME,
    "buyerHasRep" BOOLEAN NOT NULL DEFAULT false,
    "sellerHasRep" BOOLEAN NOT NULL DEFAULT false,
    "mediationSigned" BOOLEAN NOT NULL DEFAULT false,
    "purchaseAgreementSigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("acceptanceDate", "agreedPrice", "buyerHasRep", "buyerId", "completionDate", "createdAt", "cryptoPercentage", "deadlineDate", "escrowDate", "fiatPercentage", "id", "initialPayment", "mediationSigned", "propertyId", "proposalDate", "purchaseAgreementSigned", "sellerHasRep", "sellerId", "status", "updatedAt") SELECT "acceptanceDate", "agreedPrice", "buyerHasRep", "buyerId", "completionDate", "createdAt", "cryptoPercentage", "deadlineDate", "escrowDate", "fiatPercentage", "id", "initialPayment", "mediationSigned", "propertyId", "proposalDate", "purchaseAgreementSigned", "sellerHasRep", "sellerId", "status", "updatedAt" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "escrow_details_transactionId_key" ON "escrow_details"("transactionId");
