-- Add payment metadata columns to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS payment_receiver TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS payment_amount REAL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS payment_action TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS transaction_digest TEXT;

-- These columns enable tracking: who received payment, how much, for what action, and Sui tx receipt
-- Enables future queries: SELECT * FROM messages WHERE payment_amount > 0
