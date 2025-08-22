-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'BUYER',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "dateOfBirth" DATETIME,
    "addressLine1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "paymentPreference" TEXT NOT NULL DEFAULT 'FIAT',
    "strigaUserId" TEXT,
    "kycStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "kycSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("addressLine1", "city", "country", "createdAt", "dateOfBirth", "email", "emailVerified", "firstName", "id", "kycSessionId", "kycStatus", "lastName", "password", "paymentPreference", "phone", "phoneNumber", "postalCode", "role", "state", "strigaUserId", "updatedAt") SELECT "addressLine1", "city", "country", "createdAt", "dateOfBirth", "email", "emailVerified", "firstName", "id", "kycSessionId", "kycStatus", "lastName", "password", "paymentPreference", "phone", "phoneNumber", "postalCode", "role", "state", "strigaUserId", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_strigaUserId_key" ON "users"("strigaUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
