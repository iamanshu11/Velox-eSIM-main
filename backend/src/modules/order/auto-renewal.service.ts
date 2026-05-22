import prisma from "@config/database";
import logger from "@utils/logger";

export interface CreateAutoRenewalInput {
  userId: string;
  esimId: string;
  renewalDaysBefore?: number;
  autoPayFromWallet?: boolean;
  maxAutoRenewals?: number;
}

export interface UpdateAutoRenewalInput {
  autoRenewalId: string;
  enabled?: boolean;
  renewalDaysBefore?: number;
  autoPayFromWallet?: boolean;
  maxAutoRenewals?: number;
}

export class AutoRenewalService {
static async createAutoRenewal(input: CreateAutoRenewalInput) {
    try {
      const autoRenewal = await prisma.autoRenewal.create({
        data: {
          userId: input.userId,
          esimId: input.esimId,
          enabled: true,
          renewalDaysBefore: input.renewalDaysBefore || 5,
          autoPayFromWallet: input.autoPayFromWallet ?? true,
          maxAutoRenewals: input.maxAutoRenewals || 12,
          renewalCount: 0,
        },
      });

      logger.info(`[AutoRenewal] Created for user ${input.userId}: ${autoRenewal.id}`);
      return autoRenewal;
    } catch (error) {
      logger.error("[AutoRenewal] Error creating auto-renewal:", error);
      throw error;
    }
  }
static async getUserAutoRenewals(userId: string) {
    try {
      const renewals = await prisma.autoRenewal.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      logger.info(`[AutoRenewal] Fetched ${renewals.length} renewals for user ${userId}`);
      return renewals;
    } catch (error) {
      logger.error("[AutoRenewal] Error fetching user renewals:", error);
      throw error;
    }
  }
static async getAutoRenewal(autoRenewalId: string, userId?: string) {
    try {
      const renewal = await prisma.autoRenewal.findUnique({
        where: { id: autoRenewalId },
      });

      if (!renewal) {
        throw new Error("Auto-renewal not found");
      }

      if (userId && renewal.userId !== userId) {
        throw new Error("Unauthorized");
      }

      return renewal;
    } catch (error) {
      logger.error(`[AutoRenewal] Error fetching renewal ${autoRenewalId}:`, error);
      throw error;
    }
  }
static async updateAutoRenewal(input: UpdateAutoRenewalInput) {
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.enabled !== undefined) {
        updateData.enabled = input.enabled;
      }

      if (input.renewalDaysBefore !== undefined) {
        updateData.renewalDaysBefore = input.renewalDaysBefore;
      }

      if (input.autoPayFromWallet !== undefined) {
        updateData.autoPayFromWallet = input.autoPayFromWallet;
      }

      if (input.maxAutoRenewals !== undefined) {
        updateData.maxAutoRenewals = input.maxAutoRenewals;
      }

      const renewal = await prisma.autoRenewal.update({
        where: { id: input.autoRenewalId },
        data: updateData,
      });

      logger.info(`[AutoRenewal] Updated renewal ${input.autoRenewalId}`);
      return renewal;
    } catch (error) {
      logger.error("[AutoRenewal] Error updating renewal:", error);
      throw error;
    }
  }
static async enableAutoRenewal(autoRenewalId: string) {
    try {
      const renewal = await prisma.autoRenewal.update({
        where: { id: autoRenewalId },
        data: {
          enabled: true,
          updatedAt: new Date(),
        },
      });

      logger.info(`[AutoRenewal] Enabled renewal ${autoRenewalId}`);
      return renewal;
    } catch (error) {
      logger.error("[AutoRenewal] Error enabling renewal:", error);
      throw error;
    }
  }
static async disableAutoRenewal(autoRenewalId: string) {
    try {
      const renewal = await prisma.autoRenewal.update({
        where: { id: autoRenewalId },
        data: {
          enabled: false,
          updatedAt: new Date(),
        },
      });

      logger.info(`[AutoRenewal] Disabled renewal ${autoRenewalId}`);
      return renewal;
    } catch (error) {
      logger.error("[AutoRenewal] Error disabling renewal:", error);
      throw error;
    }
  }
static async deleteAutoRenewal(autoRenewalId: string) {
    try {
      const renewal = await prisma.autoRenewal.delete({
        where: { id: autoRenewalId },
      });

      logger.info(`[AutoRenewal] Deleted renewal ${autoRenewalId}`);
      return renewal;
    } catch (error) {
      logger.error("[AutoRenewal] Error deleting renewal:", error);
      throw error;
    }
  }
static async getUpcomingRenewals(daysAhead: number = 7) {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const renewals = await prisma.autoRenewal.findMany({
        where: {
          enabled: true,
          nextScheduledRenewal: {
            gte: now,
            lte: futureDate,
          },
        },
        orderBy: { nextScheduledRenewal: "asc" },
      });

      logger.info(`[AutoRenewal] Found ${renewals.length} upcoming renewals`);
      return renewals;
    } catch (error) {
      logger.error("[AutoRenewal] Error fetching upcoming renewals:", error);
      throw error;
    }
  }
}

