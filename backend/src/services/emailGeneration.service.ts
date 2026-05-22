import db from '@config/database';
import logger from '@utils/logger';
import { renderTemplate, getTemplate } from './autoEmailTemplate.service';
import type { User } from '@prisma/client';
export const generatePersonalizedContent = async (
  template: {
    aiPrompt: string | null;
    contentTemplate: string;
    subject: string;
  },
  user: User,
  templateId: string
): Promise<{ subject: string; content: string }> => {
  try {
    const purchaseCount = await db.transaction.count({
      where: {
        userId: user.id,
        transactionType: 'ESIM_PURCHASE',
        status: 'completed',
      },
    });

    const lastPurchase = await db.transaction.findFirst({
      where: {
        userId: user.id,
        transactionType: 'ESIM_PURCHASE',
        status: 'completed',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const variables = {
      userName: user.name || user.email.split('@')[0],
      userEmail: user.email,
      purchaseCount: purchaseCount.toString(),
      lastPurchaseDate: lastPurchase
        ? new Date(lastPurchase.createdAt).toLocaleDateString()
        : 'N/A',
      currentDate: new Date().toLocaleDateString(),
    };

    let subject = renderTemplate(template.subject, variables);
    let content = renderTemplate(template.contentTemplate, variables);

    if (template.aiPrompt) {
      try {
        const aiEnhancedContent = await enhanceContentWithAI(
          template.aiPrompt,
          variables,
          content
        );
        if (aiEnhancedContent) {
          content = aiEnhancedContent;
        }
      } catch (aiError) {
        logger.warn('[EmailGeneration] AI enhancement failed, using template', {
          templateId,
          error: aiError instanceof Error ? aiError.message : String(aiError),
        });
      }
    }

    return { subject, content };
  } catch (error) {
    logger.error('[EmailGeneration] Error generating content', {
      templateId,
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
const enhanceContentWithAI = async (
  aiPrompt: string,
  variables: Record<string, string>,
  templateContent: string
): Promise<string | null> => {
  try {
    logger.info('[EmailGeneration] AI enhancement called', {
      promptLength: aiPrompt.length,
    });

    return null;
  } catch (error) {
    logger.error('[EmailGeneration] AI service error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
export const createDraft = async (
  userId: string,
  templateId: string,
  scheduledFor: Date
): Promise<{ draftId: string; draftContent: string } | null> => {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      logger.warn('[EmailGeneration] User not found for draft', { userId });
      return null;
    }

    const template = await getTemplate(templateId);
    if (!template) {
      logger.warn('[EmailGeneration] Template not found for draft', {
        templateId,
      });
      return null;
    }

    const { subject, content } = await generatePersonalizedContent(
      template,
      user,
      templateId
    );

    const schedule = await db.autoEmailSchedule.create({
      data: {
        userId,
        templateId,
        scheduledFor,
        status: 'pending',
        draftContent: content,
      },
    });

    logger.info('[EmailGeneration] Draft created for review', {
      draftId: schedule.id,
      userId,
      templateId,
    });

    return {
      draftId: schedule.id,
      draftContent: content,
    };
  } catch (error) {
    logger.error('[EmailGeneration] Error creating draft', {
      userId,
      templateId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
export const approveDraft = async (
  draftId: string,
  approvedContent?: string,
  approvedBy?: string
): Promise<boolean> => {
  try {
    const schedule = await db.autoEmailSchedule.findUnique({
      where: { id: draftId },
    });

    if (!schedule || schedule.status !== 'pending') {
      logger.warn('[EmailGeneration] Invalid draft for approval', { draftId });
      return false;
    }

    await db.autoEmailSchedule.update({
      where: { id: draftId },
      data: {
        draftContent: approvedContent || schedule.draftContent,
        draftReviewedAt: new Date(),
        draftReviewedBy: approvedBy,
      },
    });

    logger.info('[EmailGeneration] Draft approved', {
      draftId,
      approvedBy,
    });

    return true;
  } catch (error) {
    logger.error('[EmailGeneration] Error approving draft', {
      draftId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
export const rejectDraft = async (draftId: string): Promise<boolean> => {
  try {
    await db.autoEmailSchedule.delete({
      where: { id: draftId },
    });

    logger.info('[EmailGeneration] Draft rejected and deleted', { draftId });
    return true;
  } catch (error) {
    logger.error('[EmailGeneration] Error rejecting draft', {
      draftId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
