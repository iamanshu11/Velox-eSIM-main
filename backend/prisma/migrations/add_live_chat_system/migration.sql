-- CreateTable agents
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "department" TEXT NOT NULL DEFAULT 'support',
    "maxConcurrentChats" INTEGER NOT NULL DEFAULT 5,
    "currentChatCount" INTEGER NOT NULL DEFAULT 0,
    "businessHoursFrom" TEXT,
    "businessHoursTo" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalChats" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable live_chat_sessions
CREATE TABLE "live_chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "simiSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "reason" TEXT,
    "waitStartedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable live_chat_messages
CREATE TABLE "live_chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable agent_queues
CREATE TABLE "agent_queues" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "agentId" TEXT,
    "positionInQueue" INTEGER NOT NULL,
    "waitingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedWaitTimeMs" INTEGER,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable canned_responses
CREATE TABLE "canned_responses" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "shortcut" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canned_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable live_chat_feedback
CREATE TABLE "live_chat_feedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "categories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_chat_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable typing_indicators
CREATE TABLE "typing_indicators" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "typing_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex agents_userId_key
CREATE UNIQUE INDEX "agents_userId_key" ON "agents"("userId");

-- CreateIndex agents_email_key
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex agents_status_idx
CREATE INDEX "agents_status_idx" ON "agents"("status");

-- CreateIndex agents_isActive_idx
CREATE INDEX "agents_isActive_idx" ON "agents"("isActive");

-- CreateIndex agents_department_idx
CREATE INDEX "agents_department_idx" ON "agents"("department");

-- CreateIndex agents_currentChatCount_idx
CREATE INDEX "agents_currentChatCount_idx" ON "agents"("currentChatCount");

-- CreateIndex live_chat_sessions_userId_idx
CREATE INDEX "live_chat_sessions_userId_idx" ON "live_chat_sessions"("userId");

-- CreateIndex live_chat_sessions_agentId_idx
CREATE INDEX "live_chat_sessions_agentId_idx" ON "live_chat_sessions"("agentId");

-- CreateIndex live_chat_sessions_status_idx
CREATE INDEX "live_chat_sessions_status_idx" ON "live_chat_sessions"("status");

-- CreateIndex live_chat_sessions_createdAt_idx
CREATE INDEX "live_chat_sessions_createdAt_idx" ON "live_chat_sessions"("createdAt");

-- CreateIndex live_chat_sessions_userId_createdAt_idx
CREATE INDEX "live_chat_sessions_userId_createdAt_idx" ON "live_chat_sessions"("userId", "createdAt");

-- CreateIndex live_chat_messages_sessionId_idx
CREATE INDEX "live_chat_messages_sessionId_idx" ON "live_chat_messages"("sessionId");

-- CreateIndex live_chat_messages_createdAt_idx
CREATE INDEX "live_chat_messages_createdAt_idx" ON "live_chat_messages"("createdAt");

-- CreateIndex live_chat_messages_readAt_idx
CREATE INDEX "live_chat_messages_readAt_idx" ON "live_chat_messages"("readAt");

-- CreateIndex agent_queues_sessionId_key
CREATE UNIQUE INDEX "agent_queues_sessionId_key" ON "agent_queues"("sessionId");

-- CreateIndex agent_queues_positionInQueue_idx
CREATE INDEX "agent_queues_positionInQueue_idx" ON "agent_queues"("positionInQueue");

-- CreateIndex agent_queues_agentId_idx
CREATE INDEX "agent_queues_agentId_idx" ON "agent_queues"("agentId");

-- CreateIndex agent_queues_waitingSince_idx
CREATE INDEX "agent_queues_waitingSince_idx" ON "agent_queues"("waitingSince");

-- CreateIndex canned_responses_agentId_idx
CREATE INDEX "canned_responses_agentId_idx" ON "canned_responses"("agentId");

-- CreateIndex canned_responses_category_idx
CREATE INDEX "canned_responses_category_idx" ON "canned_responses"("category");

-- CreateIndex canned_responses_shortcut_idx
CREATE INDEX "canned_responses_shortcut_idx" ON "canned_responses"("shortcut");

-- CreateIndex live_chat_feedback_sessionId_key
CREATE UNIQUE INDEX "live_chat_feedback_sessionId_key" ON "live_chat_feedback"("sessionId");

-- CreateIndex live_chat_feedback_userId_idx
CREATE INDEX "live_chat_feedback_userId_idx" ON "live_chat_feedback"("userId");

-- CreateIndex live_chat_feedback_rating_idx
CREATE INDEX "live_chat_feedback_rating_idx" ON "live_chat_feedback"("rating");

-- CreateIndex live_chat_feedback_createdAt_idx
CREATE INDEX "live_chat_feedback_createdAt_idx" ON "live_chat_feedback"("createdAt");

-- CreateIndex typing_indicators_sessionId_idx
CREATE INDEX "typing_indicators_sessionId_idx" ON "typing_indicators"("sessionId");

-- CreateIndex typing_indicators_expiresAt_idx
CREATE INDEX "typing_indicators_expiresAt_idx" ON "typing_indicators"("expiresAt");

-- AddForeignKey live_chat_sessions
ALTER TABLE "live_chat_sessions" ADD CONSTRAINT "live_chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey live_chat_sessions
ALTER TABLE "live_chat_sessions" ADD CONSTRAINT "live_chat_sessions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey live_chat_messages
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey agent_queues
ALTER TABLE "agent_queues" ADD CONSTRAINT "agent_queues_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey agent_queues
ALTER TABLE "agent_queues" ADD CONSTRAINT "agent_queues_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey canned_responses
ALTER TABLE "canned_responses" ADD CONSTRAINT "canned_responses_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey live_chat_feedback
ALTER TABLE "live_chat_feedback" ADD CONSTRAINT "live_chat_feedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey typing_indicators
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
