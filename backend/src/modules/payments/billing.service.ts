import prisma from "@config/database";
import logger from "@utils/logger";
import { Transaction } from "@prisma/client";

export interface BillingStatementData {
  userId: string;
  month: Date;
  totalCharges: number;
  totalCredits: number;
  balance: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    date: Date;
  }>;
}

export interface GenerateStatementInput {
  userId: string;
  startDate: Date;
  endDate: Date;
  format?: "JSON" | "PDF";
}

export class BillingService {
static async generateStatement(input: GenerateStatementInput): Promise<BillingStatementData> {
    try {
      const { userId, startDate, endDate } = input;

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: "asc" },
      });

      let totalCharges = 0;
      let totalCredits = 0;

      const formattedTransactions = transactions.map((t: Transaction) => {
        if (t.transactionType === "DEBIT" || t.transactionType === "PURCHASE") {
          totalCharges += t.amount;
        } else if (t.transactionType === "CREDIT" || t.transactionType === "REFUND") {
          totalCredits += t.amount;
        }

        return {
          id: t.id,
          type: t.transactionType,
          amount: t.amount,
          description: t.reference || "Transaction",
          date: t.createdAt,
        };
      });

      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      const balance = wallet?.balance || 0;

      logger.info(
        `[Billing] Generated statement for user ${userId} from ${startDate} to ${endDate}`,
      );

      return {
        userId,
        month: startDate,
        totalCharges,
        totalCredits,
        balance,
        transactions: formattedTransactions,
      };
    } catch (error) {
      logger.error("[Billing] Error generating statement:", error);
      throw error;
    }
  }
static async getMonthlyStatement(userId: string, month: Date) {
    try {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      return await this.generateStatement({
        userId,
        startDate,
        endDate,
      });
    } catch (error) {
      logger.error("[Billing] Error fetching monthly statement:", error);
      throw error;
    }
  }
static async getUserStatements(
    userId: string,
    options: { skip?: number; take?: number } = {},
  ) {
    try {
      const { skip = 0, take = 12 } = options;

      const statements = [];
      for (let i = 0; i < take; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const statement = await this.getMonthlyStatement(userId, date);
        statements.push(statement);
      }

      logger.info(`[Billing] Fetched ${statements.length} statements for user ${userId}`);

      return {
        statements,
        total: statements.length,
        page: Math.floor(skip / take) + 1,
      };
    } catch (error) {
      logger.error("[Billing] Error fetching user statements:", error);
      throw error;
    }
  }
static async createBillingStatement(input: GenerateStatementInput) {
    try {
      const statement = await this.generateStatement(input);

      logger.info(
        `[Billing] Created billing statement for user ${input.userId}`,
      );

      return statement;
    } catch (error) {
      logger.error("[Billing] Error creating billing statement:", error);
      throw error;
    }
  }
static async exportStatementAsCSV(input: GenerateStatementInput): Promise<string> {
    try {
      const statement = await this.generateStatement(input);

      let csv = "Billing Statement\n";
      csv += `User ID,${statement.userId}\n`;
      csv += `Period,${statement.month.toISOString()}\n`;
      csv += `Total Charges,$${statement.totalCharges.toFixed(2)}\n`;
      csv += `Total Credits,$${statement.totalCredits.toFixed(2)}\n`;
      csv += `Balance,$${statement.balance.toFixed(2)}\n\n`;

      csv += "Date,Type,Amount,Description\n";
      for (const transaction of statement.transactions) {
        csv += `${transaction.date.toISOString()},"${transaction.type}","$${transaction.amount.toFixed(2)}","${transaction.description}"\n`;
      }

      logger.info(`[Billing] Exported statement as CSV for user ${input.userId}`);
      return csv;
    } catch (error) {
      logger.error("[Billing] Error exporting statement:", error);
      throw error;
    }
  }
static async getBillingSummary(userId: string) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyTransactions = transactions.filter(
        (t: Transaction) => t.createdAt >= monthStart,
      );

      let monthlySpending = 0;
      let monthlyCredits = 0;

      for (const t of monthlyTransactions) {
        if (t.transactionType === "DEBIT" || t.transactionType === "PURCHASE") {
          monthlySpending += t.amount;
        } else if (t.transactionType === "CREDIT" || t.transactionType === "REFUND") {
          monthlyCredits += t.amount;
        }
      }

      logger.info(`[Billing] Fetched billing summary for user ${userId}`);

      return {
        currentBalance: wallet?.balance || 0,
        monthlySpending,
        monthlyCredits,
        recentTransactions: transactions.slice(0, 10),
      };
    } catch (error) {
      logger.error("[Billing] Error fetching billing summary:", error);
      throw error;
    }
  }
static async getAnnualReport(userId: string, year: number) {
    try {
      const statements = [];
      let totalCharges = 0;
      let totalCredits = 0;

      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const statement = await this.generateStatement({
          userId,
          startDate,
          endDate,
        });

        totalCharges += statement.totalCharges;
        totalCredits += statement.totalCredits;

        statements.push({
          month: month + 1,
          charges: statement.totalCharges,
          credits: statement.totalCredits,
          balance: statement.balance,
        });
      }

      logger.info(`[Billing] Generated annual report for user ${userId} for year ${year}`);

      return {
        year,
        userId,
        months: statements,
        totalCharges,
        totalCredits,
        averageMonthlySpending: totalCharges / 12,
      };
    } catch (error) {
      logger.error("[Billing] Error generating annual report:", error);
      throw error;
    }
  }
static async getBillingAlerts(userId: string) {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      const alerts = [];

      if (wallet && wallet.balance < 10) {
        alerts.push({
          type: "LOW_BALANCE",
          severity: "WARNING",
          message: `Your wallet balance is low: $${wallet.balance.toFixed(2)}`,
        });
      }

      const pendingPayments = await prisma.payment.findMany({
        where: {
          userId,
          status: "PENDING",
        },
      });

      if (pendingPayments.length > 0) {
        alerts.push({
          type: "PENDING_CHARGES",
          severity: "INFO",
          message: `You have ${pendingPayments.length} pending charges`,
        });
      }

      logger.info(`[Billing] Fetched billing alerts for user ${userId}`);
      return alerts;
    } catch (error) {
      logger.error("[Billing] Error fetching billing alerts:", error);
      throw error;
    }
  }
}

