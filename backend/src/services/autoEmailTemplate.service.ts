import db from '@config/database';
import logger from '@utils/logger';
import type { AutoEmailTemplate } from '@prisma/client';

export interface CreateTemplateDTO {
  title: string;
  subject: string;
  contentTemplate: string;
  aiPrompt?: string;
  createdBy: string;
}

export interface UpdateTemplateDTO {
  subject?: string;
  contentTemplate?: string;
  aiPrompt?: string;
  isActive?: boolean;
}
export const createTemplate = async (
  data: CreateTemplateDTO
): Promise<AutoEmailTemplate> => {
  try {
    const template = await db.autoEmailTemplate.create({
      data: {
        title: data.title,
        subject: data.subject,
        contentTemplate: data.contentTemplate,
        aiPrompt: data.aiPrompt,
        createdBy: data.createdBy,
      },
    });

    logger.info('[EmailTemplate] Template created', {
      templateId: template.id,
      title: template.title,
    });

    return template;
  } catch (error) {
    logger.error('[EmailTemplate] Error creating template', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
export const getTemplate = async (
  templateId: string
): Promise<AutoEmailTemplate | null> => {
  try {
    return await db.autoEmailTemplate.findUnique({
      where: { id: templateId },
    });
  } catch (error) {
    logger.error('[EmailTemplate] Error fetching template', {
      templateId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
export const listTemplates = async (
  includeInactive: boolean = false
): Promise<AutoEmailTemplate[]> => {
  try {
    return await db.autoEmailTemplate.findMany({
      where: includeInactive
        ? {}
        : {
            isActive: true,
          },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    logger.error('[EmailTemplate] Error listing templates', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};
export const updateTemplate = async (
  templateId: string,
  data: UpdateTemplateDTO
): Promise<AutoEmailTemplate | null> => {
  try {
    const template = await db.autoEmailTemplate.update({
      where: { id: templateId },
      data: {
        subject: data.subject,
        contentTemplate: data.contentTemplate,
        aiPrompt: data.aiPrompt,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    });

    logger.info('[EmailTemplate] Template updated', {
      templateId: template.id,
      title: template.title,
    });

    return template;
  } catch (error) {
    logger.error('[EmailTemplate] Error updating template', {
      templateId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
export const deleteTemplate = async (templateId: string): Promise<boolean> => {
  try {
    await db.autoEmailTemplate.delete({
      where: { id: templateId },
    });
    logger.info('[EmailTemplate] Template deleted', { templateId });
    return true;
  } catch (error) {
    logger.error('[EmailTemplate] Error deleting template', {
      templateId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
export const renderTemplate = (
  template: string,
  variables: Record<string, string>
): string => {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value || '');
  }

  return rendered;
};
