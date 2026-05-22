export interface LiveChatSession {
  id: string;
  userId: string;
  agentId: string | null;
  lunaSessionId: string | null;
  status: 'queued' | 'active' | 'closed' | 'transferred';
  reason: string | null;
  waitStartedAt: Date | null;
  assignedAt: Date | null;
  startedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderRole: 'user' | 'agent';
  content: string;
  attachments?: unknown[];
  readAt: Date | null;
  createdAt: Date;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  department: string;
  maxConcurrentChats: number;
  currentChatCount: number;
  businessHoursFrom: string | null;
  businessHoursTo: string | null;
  timezone: string;
  avatar: string | null;
  isActive: boolean;
  totalChats: number;
  avgResponseTime: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CannedResponse {
  id: string;
  agentId: string | null;
  title: string;
  content: string;
  category: string;
  shortcut: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveChatFeedback {
  id: string;
  sessionId: string;
  userId: string;
  rating: number;
  comment: string | null;
  categories: string[];
  createdAt: Date;
}

export interface AgentQueue {
  id: string;
  sessionId: string;
  agentId: string | null;
  positionInQueue: number;
  waitingSince: Date;
  estimatedWaitTimeMs: number | null;
  assignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLiveChatSessionDTO {
  lunaSessionId?: string;
  reason?: string;
}

export interface SendLiveChatMessageDTO {
  content: string;
  attachments?: unknown[];
}

export interface AssignAgentDTO {
  sessionId: string;
  agentId: string;
}

export interface SubmitLiveChatFeedbackDTO {
  rating: number;
  comment?: string;
  categories?: string[];
}

export interface UpdateAgentStatusDTO {
  status: 'online' | 'offline' | 'busy' | 'away';
}

export interface CreateCannedResponseDTO {
  title: string;
  content: string;
  category?: string;
  shortcut?: string;
}

export type LiveChatSocketEvent = 
  | 'connect'
  | 'disconnect'
  | 'message:send'
  | 'message:receive'
  | 'agent:assigned'
  | 'typing:start'
  | 'typing:stop'
  | 'session:closed'
  | 'status:updated'
  | 'queue:position-updated';
