-- Add transactionId column to orders table
ALTER TABLE "orders" ADD COLUMN "transactionId" TEXT;

-- Add orderId column to transactions table (if it doesn't exist)
ALTER TABLE "transactions" ADD COLUMN "orderId" TEXT;

-- Create indexes for foreign key lookups
CREATE INDEX IF NOT EXISTS "orders_transactionId_idx" ON "orders"("transactionId");
CREATE INDEX IF NOT EXISTS "transactions_orderId_idx" ON "transactions"("orderId");
