import nodemailer from 'nodemailer';
import db from '@config/database';
import logger from '@utils/logger';
import crypto from 'crypto';
import { config } from '@config/env';

let transporter: nodemailer.Transporter | null = null;
const initializeTransporter = async (): Promise<
  nodemailer.Transporter | null
> => {
  if (transporter) return transporter;

  try {
    const settings = await db.settings.findFirst();

    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
      logger.error('[EmailSender] SMTP settings not configured');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    });

    logger.info('[EmailSender] SMTP transporter initialized', {
      host: settings.smtpHost,
      port: settings.smtpPort,
    });

    return transporter;
  } catch (error) {
    logger.error('[EmailSender] Error initializing transporter', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
const generateUnsubscribeToken = (userId: string, emailLogId: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${emailLogId}:${Date.now()}`)
    .digest('hex');
};
const generateTrackingPixel = (emailLogId: string): string => {
  return `${config.api_url}/api/email/track/pixel/${emailLogId}`;
};
export const sendEmail = async (
  userId: string,
  templateId: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; logId?: string; error?: string }> => {
  try {
    const transporter = await initializeTransporter();
    if (!transporter) {
      return {
        success: false,
        error: 'SMTP not configured',
      };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const purchaseCount = await db.transaction.count({
      where: { userId, transactionType: 'ESIM_PURCHASE', status: 'completed' },
    });
    const lastPurchase = await db.transaction.findFirst({
      where: { userId, transactionType: 'ESIM_PURCHASE', status: 'completed' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    const dateFormatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const variables: Record<string, string> = {
      userName: user.name || user.email.split('@')[0],
      userEmail: user.email,
      purchaseCount: String(purchaseCount),
      lastPurchaseDate: lastPurchase
        ? new Date(lastPurchase.createdAt).toLocaleDateString('en-US', dateFormatOptions)
        : 'N/A',
      currentDate: new Date().toLocaleDateString('en-US', dateFormatOptions),
    };
    const applyVars = (tpl: string): string =>
      Object.entries(variables).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
        tpl
      );
    const processedSubject = applyVars(subject);
    const processedContent = applyVars(htmlContent);

    const settings = await db.settings.findFirst();
    if (!settings) {
      return {
        success: false,
        error: 'Settings not found',
      };
    }

    const unsubscribeToken = generateUnsubscribeToken(userId, 'temp');

    const emailLog = await db.emailLog.create({
      data: {
        userId,
        templateId,
        subject: processedSubject,
        content: processedContent,
        unsubscribeToken,
      },
    });

    const updatedTrackingPixel = generateTrackingPixel(emailLog.id);

    const unsubscribeLink = `${config.api_url}/api/email/unsubscribe?token=${unsubscribeToken}`;

    const emailHtml = `
      ${processedContent}
      <br/><br/>
      <hr style="border: none; border-top: 1px solid #ccc; margin-top: 40px;" />
      <p style="font-size: 12px; color: #999; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #999;">Unsubscribe from emails</a>
      </p>
      <img src="${updatedTrackingPixel}" width="1" height="1" alt="" style="display:none;" />
    `;

    const mailOptions = {
      from: `${settings.smtpFromName} <${settings.smtpFromEmail}>`,
      to: user.email,
      subject: processedSubject,
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    await db.emailLog.update({
      where: { id: emailLog.id },
      data: {
        sentAt: new Date(),
        unsubscribeToken,
      },
    });

    logger.info('[EmailSender] Email sent successfully', {
      emailLogId: emailLog.id,
      userId,
      templateId,
      to: user.email,
      messageId: result.messageId,
    });

    return {
      success: true,
      logId: emailLog.id,
    };
  } catch (error) {
    logger.error('[EmailSender] Error sending email', {
      userId,
      templateId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to send email',
    };
  }
};
export const batchSendEmails = async (
  emails: Array<{
    userId: string;
    templateId: string;
    subject: string;
    content: string;
  }>
): Promise<{
  total: number;
  successful: number;
  failed: number;
}> => {
  let successful = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(
      email.userId,
      email.templateId,
      email.subject,
      email.content
    );

    if (result.success) {
      successful++;
    } else {
      failed++;
      logger.warn('[EmailSender] Email send failed', {
        userId: email.userId,
        templateId: email.templateId,
        error: result.error,
      });
    }
  }

  logger.info('[EmailSender] Batch send completed', {
    total: emails.length,
    successful,
    failed,
  });

  return {
    total: emails.length,
    successful,
    failed,
  };
};
export const trackEmailOpen = async (emailLogId: string): Promise<void> => {
  try {
    const emailLog = await db.emailLog.findUnique({
      where: { id: emailLogId },
    });

    if (!emailLog || emailLog.openedAt) {
      return;
    }

    await db.emailLog.update({
      where: { id: emailLogId },
      data: {
        openedAt: new Date(),
      },
    });

    logger.info('[EmailSender] Email open tracked', { emailLogId });
  } catch (error) {
    logger.error('[EmailSender] Error tracking open', {
      emailLogId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const trackEmailClick = async (emailLogId: string): Promise<void> => {
  try {
    await db.emailLog.update({
      where: { id: emailLogId },
      data: {
        clickedAt: new Date(),
      },
    });

    logger.info('[EmailSender] Email click tracked', { emailLogId });
  } catch (error) {
    logger.error('[EmailSender] Error tracking click', {
      emailLogId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const unsubscribeUser = async (token: string): Promise<boolean> => {
  try {
    const emailLog = await db.emailLog.findFirst({
      where: {
        unsubscribeToken: token,
      },
    });

    if (!emailLog) {
      logger.warn('[EmailSender] Invalid unsubscribe token', { token });
      return false;
    }

    await db.emailLog.update({
      where: { id: emailLog.id },
      data: {
        unsubscribedAt: new Date(),
      },
    });

    await db.user.update({
      where: { id: emailLog.userId },
      data: {
        emailUnsubscribed: true,
      },
    });

    logger.info('[EmailSender] User unsubscribed', { userId: emailLog.userId });
    return true;
  } catch (error) {
    logger.error('[EmailSender] Error unsubscribing user', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};
export const handleSoftBounce = async (emailLogId: string): Promise<void> => {
  try {
    await db.emailLog.update({
      where: { id: emailLogId },
      data: {
        bounced: true,
        bouncedAt: new Date(),
      },
    });

    logger.info('[EmailSender] Soft bounce recorded', { emailLogId });
  } catch (error) {
    logger.error('[EmailSender] Error handling bounce', {
      emailLogId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
export const handleHardBounce = async (
  emailLogId: string
): Promise<void> => {
  try {
    const emailLog = await db.emailLog.findUnique({
      where: { id: emailLogId },
    });

    if (emailLog) {
      await db.emailLog.update({
        where: { id: emailLogId },
        data: {
          bounced: true,
          bouncedAt: new Date(),
        },
      });
      await db.user.update({
        where: { id: emailLog.userId },
        data: {
          emailUnsubscribed: true,
        },
      });

      logger.info('[EmailSender] Hard bounce handled, user disabled', {
        emailLogId,
        userId: emailLog.userId,
      });
    }
  } catch (error) {
    logger.error('[EmailSender] Error handling hard bounce', {
      emailLogId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
