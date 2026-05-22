-- Migration: Remove foreign key constraint on agent_queues.agentId
-- This allows admin assignments to use a direct userId without requiring an Agent record

ALTER TABLE "agent_queues" DROP CONSTRAINT "agent_queues_agentId_fkey";

COMMENT ON COLUMN "agent_queues"."agentId" IS 'References either an Agent.id or a User.id (for admin assignments)';
