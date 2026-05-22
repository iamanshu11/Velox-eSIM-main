export interface CreateTemplateRequest {
  title: string;
  subject: string;
  contentTemplate: string;
  aiPrompt?: string;
}

export interface UpdateTemplateRequest {
  subject?: string;
  contentTemplate?: string;
  aiPrompt?: string;
  isActive?: boolean;
}

export interface SendCustomEmailRequest {
  templateId: string;
  userIds: string[];
  customContent?: string;
  sendImmediately?: boolean;
}

export interface UpdateUserEmailStatusRequest {
  emailStatus: 'new' | 'active' | 'inactive';
  emailUnsubscribed?: boolean;
}

export interface CreateAbTestRequest {
  name: string;
  templateAId: string;
  templateBId: string;
  splitRatio?: number;
}

export interface ScheduleAbTestRequest {
  testId: string;
  userIds: string[];
}

export interface CompleteAbTestRequest {
  winnerVariant: 'A' | 'B' | null;
}

export type SegmentRuleOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'contains'
  | 'exists';

export interface SegmentRule {
  field: string;
  operator: SegmentRuleOperator;
  value: string | number | boolean | string[];
}

export interface CreateSegmentRequest {
  name: string;
  description?: string;
  rules: SegmentRule[];
}

export interface UpdateSegmentRequest {
  name?: string;
  description?: string;
  rules?: SegmentRule[];
  isActive?: boolean;
}

