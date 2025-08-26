-- Performance indexes for Caenhebo Alpha
-- These indexes will significantly speed up common queries

-- User authentication and lookup
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON User(role);
CREATE INDEX IF NOT EXISTS idx_user_kyc_status ON User(kycStatus);
CREATE INDEX IF NOT EXISTS idx_user_striga_user_id ON User(strigaUserId);

-- Session lookups (critical for auth performance)
CREATE INDEX IF NOT EXISTS idx_session_session_token ON Session(sessionToken);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON Session(userId);
CREATE INDEX IF NOT EXISTS idx_session_expires ON Session(expires);

-- Property search and filtering
CREATE INDEX IF NOT EXISTS idx_property_listing_status ON Property(listingStatus);
CREATE INDEX IF NOT EXISTS idx_property_price ON Property(price);
CREATE INDEX IF NOT EXISTS idx_property_seller_id ON Property(sellerId);
CREATE INDEX IF NOT EXISTS idx_property_created_at ON Property(createdAt);
CREATE INDEX IF NOT EXISTS idx_property_property_type ON Property(propertyType);
CREATE INDEX IF NOT EXISTS idx_property_city ON Property(city);

-- Transaction queries
CREATE INDEX IF NOT EXISTS idx_transaction_status ON Transaction(status);
CREATE INDEX IF NOT EXISTS idx_transaction_buyer_id ON Transaction(buyerId);
CREATE INDEX IF NOT EXISTS idx_transaction_seller_id ON Transaction(sellerId);
CREATE INDEX IF NOT EXISTS idx_transaction_property_id ON Transaction(propertyId);
CREATE INDEX IF NOT EXISTS idx_transaction_created_at ON Transaction(createdAt);

-- Notification queries
CREATE INDEX IF NOT EXISTS idx_notification_user_id_read ON Notification(userId, read);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON Notification(createdAt);

-- Wallet lookups
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON Wallet(userId);
CREATE INDEX IF NOT EXISTS idx_wallet_striga_account_id ON Wallet(strigaAccountId);

-- Document searches
CREATE INDEX IF NOT EXISTS idx_document_property_id ON Document(propertyId);
CREATE INDEX IF NOT EXISTS idx_document_transaction_id ON Document(transactionId);
CREATE INDEX IF NOT EXISTS idx_document_document_type ON Document(documentType);
CREATE INDEX IF NOT EXISTS idx_document_uploaded_by_id ON Document(uploadedById);

-- Compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_property_status_price ON Property(listingStatus, price);
CREATE INDEX IF NOT EXISTS idx_transaction_status_created ON Transaction(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON Notification(userId, read, createdAt);

-- Striga integration performance
CREATE INDEX IF NOT EXISTS idx_user_striga_integration ON User(strigaUserId, strigaUserStatus);
CREATE INDEX IF NOT EXISTS idx_wallet_striga_integration ON Wallet(strigaAccountId, strigaAccountStatus);