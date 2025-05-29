-- Fix missing indexes from schema creation
-- Run this file if the main schema creation failed on these indexes

-- Create the missing indexes for price_history table
CREATE INDEX IF NOT EXISTS idx_crypto_timestamp ON price_history(cryptocurrency_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_timestamp ON price_history(timestamp); 