export type ChatChannel = "public" | "dashboard" | "admin";

export interface ChatPageContext {
  path: string;
  area: ChatChannel;
}

export interface LunaCitation {
  title: string;
  sourceType: string;
  slug?: string;
  excerpt?: string;
}

export interface LunaAction {
  type: "navigate" | "suggest" | "ticket" | "ticket-preview" | "live-chat";
  label: string;
  payload?: Record<string, unknown>;
}

export interface LunaMessagePayload {
  sessionId?: string;
  message: string;
  pageContext?: ChatPageContext;
}

export interface LunaSessionPayload {
  channel?: ChatChannel;
  title?: string;
  pageContext?: ChatPageContext;
}

export interface LunaResponse {
  sessionId: string;
  answer: string;
  citations: LunaCitation[];
  actions: LunaAction[];
  escalationOffered: boolean;
  model: string;
}

export interface LunaKnowledgeResult {
  title: string;
  slug: string;
  sourceType: string;
  excerpt: string;
  score: number;
}

export interface LunaUserContext {
  summary: string;
  data: Record<string, unknown>;
}