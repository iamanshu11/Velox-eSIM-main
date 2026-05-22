import prisma from "@config/database";
import logger from "@utils/logger";
import { ReferralCode } from "@prisma/client";

export interface CreateReferralCodeInput {
  userId: string;
  discount: number;
  maxUses?: number;
  expiresAt?: Date;
}

export interface RedeemReferralInput {
  referralCodeId: string;
  newUserId: string;
}

export class ReferralService {
static async createReferralCode(input: CreateReferralCodeInput) {
    try {
      const code = this.generateCode();

      const referralCode = await prisma.referralCode.create({
        data: {
          userId: input.userId,
          code,
          discount: input.discount,
          maxUses: input.maxUses || 0,
          usedCount: 0,
          active: true,
          expiresAt: input.expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(`[Referral] Created referral code: ${code} for user ${input.userId}`);
      return referralCode;
    } catch (error) {
      logger.error("[Referral] Error creating referral code:", error);
      throw error;
    }
  }
static async getUserReferralCodes(userId: string) {
    try {
      const codes = await prisma.referralCode.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      logger.info(`[Referral] Fetched ${codes.length} referral codes for user ${userId}`);
      return codes;
    } catch (error) {
      logger.error("[Referral] Error fetching referral codes:", error);
      throw error;
    }
  }
static async validateReferralCode(code: string) {
    try {
      const referralCode = await prisma.referralCode.findUnique({
        where: { code },
      });

      if (!referralCode) {
        throw new Error("Referral code not found");
      }

      if (!referralCode.active) {
        throw new Error("Referral code is inactive");
      }

      if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
        throw new Error("Referral code has expired");
      }

      if (referralCode.maxUses > 0 && referralCode.usedCount >= referralCode.maxUses) {
        throw new Error("Referral code has reached maximum uses");
      }

      return {
        code: referralCode.code,
        discount: referralCode.discount,
        referrerUserId: referralCode.userId,
      };
    } catch (error) {
      logger.error("[Referral] Error validating referral code:", error);
      throw error;
    }
  }
static async redeemReferralCode(referralCodeId: string, newUserId: string) {
    try {
      const referralCode = await prisma.referralCode.findUnique({
        where: { id: referralCodeId },
      });

      if (!referralCode) {
        throw new Error("Referral code not found");
      }

      await prisma.referralCode.update({
        where: { id: referralCodeId },
        data: {
          usedCount: referralCode.usedCount + 1,
          updatedAt: new Date(),
        },
      });

      logger.info(
        `[Referral] Referral code ${referralCode.code} redeemed by user ${newUserId}`,
      );

      return {
        discount: referralCode.discount,
        referrerUserId: referralCode.userId,
      };
    } catch (error) {
      logger.error("[Referral] Error redeeming referral code:", error);
      throw error;
    }
  }
static async getReferralStats(userId: string) {
    try {
      const codes = await prisma.referralCode.findMany({
        where: { userId },
      });

      const totalCodes = codes.length;
      const activeCodes = codes.filter((c: ReferralCode) => c.active).length;
      const totalRedeemed = codes.reduce((sum: number, c: ReferralCode) => sum + c.usedCount, 0);

      logger.info(`[Referral] Fetched stats for user ${userId}`);

      return {
        totalCodes,
        activeCodes,
        inactiveCodes: totalCodes - activeCodes,
        totalRedeemed,
      };
    } catch (error) {
      logger.error("[Referral] Error fetching referral stats:", error);
      throw error;
    }
  }
static async deactivateReferralCode(codeId: string, userId?: string) {
    try {
      const code = await prisma.referralCode.findUnique({
        where: { id: codeId },
      });

      if (!code) {
        throw new Error("Referral code not found");
      }

      if (userId && code.userId !== userId) {
        throw new Error("Unauthorized");
      }

      const updated = await prisma.referralCode.update({
        where: { id: codeId },
        data: {
          active: false,
          updatedAt: new Date(),
        },
      });

      logger.info(`[Referral] Deactivated referral code: ${code.code}`);
      return updated;
    } catch (error) {
      logger.error("[Referral] Error deactivating referral code:", error);
      throw error;
    }
  }
static async activateReferralCode(codeId: string, userId?: string) {
    try {
      const code = await prisma.referralCode.findUnique({
        where: { id: codeId },
      });

      if (!code) {
        throw new Error("Referral code not found");
      }

      if (userId && code.userId !== userId) {
        throw new Error("Unauthorized");
      }

      const updated = await prisma.referralCode.update({
        where: { id: codeId },
        data: {
          active: true,
          updatedAt: new Date(),
        },
      });

      logger.info(`[Referral] Activated referral code: ${code.code}`);
      return updated;
    } catch (error) {
      logger.error("[Referral] Error activating referral code:", error);
      throw error;
    }
  }
static async deleteReferralCode(codeId: string, userId?: string) {
    try {
      const code = await prisma.referralCode.findUnique({
        where: { id: codeId },
      });

      if (!code) {
        throw new Error("Referral code not found");
      }

      if (userId && code.userId !== userId) {
        throw new Error("Unauthorized");
      }

      await prisma.referralCode.delete({
        where: { id: codeId },
      });

      logger.info(`[Referral] Deleted referral code: ${code.code}`);
      return { success: true };
    } catch (error) {
      logger.error("[Referral] Error deleting referral code:", error);
      throw error;
    }
  }
static async getTopReferrers(limit: number = 10) {
    try {
      const referrers = await prisma.referralCode.groupBy({
        by: ["userId"],
        _sum: {
          usedCount: true,
        },
        orderBy: {
          _sum: {
            usedCount: "desc",
          },
        },
        take: limit,
      });

      logger.info(`[Referral] Fetched top ${limit} referrers`);
      return referrers;
    } catch (error) {
      logger.error("[Referral] Error fetching top referrers:", error);
      throw error;
    }
  }
private static generateCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const codeLength = 8;
    let code = "";

    for (let i = 0; i < codeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }
}

