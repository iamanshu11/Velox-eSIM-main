-- Migration: Remove foreign key constraint to allow admin assignment without Agent record
-- This allows admins to accept chats without needing an Agent record
-- agentId will now be a simple string that can reference either an Agent.id or a User.id

-- Drop the foreign key constraint
ALTER TABLE "live_chat_sessions" DROP CONSTRAINT "live_chat_sessions_agentId_fkey";

-- optionally: You can add a comment explaining this field now allows user IDs
-- In PostgreSQL, you can use COMMENT to document this
COMMENT ON COLUMN "live_chat_sessions"."agentId" IS 'References either an Agent.id or a User.id (for admin assignments)';
