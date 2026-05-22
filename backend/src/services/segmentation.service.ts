import db from '@config/database';
import logger from '@utils/logger';

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

export interface CreateSegmentDTO {
  name: string;
  description?: string;
  rules: SegmentRule[];
  createdBy: string;
}

const ALLOWED_FIELDS = new Set([
  'emailStatus',
  'countryCode',
  'emailUnsubscribed',
  'role',
  'emailsSentCount',
  'isActive',
]);
export const validateRules = (rules: SegmentRule[]): void => {
  if (!Array.isArray(rules) || rules.length === 0) {
    throw new Error('Rules must be a non-empty array');
  }

  for (const rule of rules) {
    if (!ALLOWED_FIELDS.has(rule.field)) {
      throw new Error(
        `Field "${rule.field}" is not allowed. Allowed: ${[...ALLOWED_FIELDS].join(', ')}`
      );
    }
    if (!rule.operator || rule.value === undefined) {
      throw new Error('Each rule must have operator and value');
    }
  }
};
const ruleToWhereClause = (rule: SegmentRule): Record<string, unknown> => {
  const { field, operator, value } = rule;

  switch (operator) {
    case 'eq':
      return { [field]: { equals: value } };
    case 'neq':
      return { [field]: { not: value } };
    case 'gt':
      return { [field]: { gt: value } };
    case 'gte':
      return { [field]: { gte: value } };
    case 'lt':
      return { [field]: { lt: value } };
    case 'lte':
      return { [field]: { lte: value } };
    case 'in':
      return { [field]: { in: value as string[] } };
    case 'nin':
      return { [field]: { notIn: value as string[] } };
    case 'contains':
      return { [field]: { contains: String(value) } };
    case 'exists':
      return value
        ? { [field]: { not: null } }
        : { [field]: null };
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};
export const createSegment = async (dto: CreateSegmentDTO) => {
  validateRules(dto.rules);

  return db.emailSegment.create({
    data: {
      name: dto.name,
      description: dto.description || null,
      rules: dto.rules as unknown as import('@prisma/client').Prisma.InputJsonValue,
      createdBy: dto.createdBy,
    },
  });
};
export const listSegments = async (includeInactive = false) => {
  return db.emailSegment.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
};
export const getSegment = async (id: string) => {
  return db.emailSegment.findUnique({ where: { id } });
};
export const updateSegment = async (
  id: string,
  data: Partial<CreateSegmentDTO> & { isActive?: boolean }
) => {
  if (data.rules) {
    validateRules(data.rules);
  }

  return db.emailSegment.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      rules: data.rules as unknown as import('@prisma/client').Prisma.InputJsonValue | undefined,
      isActive: data.isActive,
    },
  });
};
export const deleteSegment = async (id: string) => {
  return db.emailSegment.delete({ where: { id } });
};
export const evaluateSegment = async (id: string): Promise<string[]> => {
  const segment = await db.emailSegment.findUnique({ where: { id } });

  if (!segment) throw new Error('Segment not found');

  const rules = segment.rules as unknown as SegmentRule[];

  validateRules(rules);

  const whereClauses = rules.map(ruleToWhereClause);
  const where = { AND: whereClauses, emailUnsubscribed: false };

  const users = await db.user.findMany({
    where,
    select: { id: true },
  });

  logger.info('[SegmentationService] Segment evaluated', {
    segmentId: id,
    matchedUsers: users.length,
  });

  return users.map((u) => u.id);
};
export const previewSegment = async (rules: SegmentRule[]): Promise<number> => {
  validateRules(rules);

  const whereClauses = rules.map(ruleToWhereClause);
  const where = { AND: whereClauses, emailUnsubscribed: false };

  return db.user.count({ where });
};
