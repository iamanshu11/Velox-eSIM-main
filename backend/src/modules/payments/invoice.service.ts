import { Prisma } from '@prisma/client';
import prisma from '@config/database';
import logger from '@utils/logger';

export interface CreateInvoiceInput {
  userId: string;
  amount: number;
  description: string;
  currency?: string;
  paymentId?: string;
  orderId?: string;
  transactionId?: string;
  dueDays?: number;
  metadata?: Prisma.InputJsonValue | null;
}

export interface InvoiceListOptions {
  page?: number;
  limit?: number;
}

export class InvoiceService {
  static generateInvoiceNumber() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `INV-${datePart}-${randomPart}`;
  }

  async createInvoice(input: CreateInvoiceInput) {
    try {
      if (input.paymentId) {
        const existingInvoice = await prisma.invoice.findUnique({
          where: { paymentId: input.paymentId },
        });

        if (existingInvoice) {
          return existingInvoice;
        }
      }

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: InvoiceService.generateInvoiceNumber(),
          userId: input.userId,
          amount: input.amount,
          currency: input.currency || 'USD',
          description: input.description,
          dueDate: input.dueDays ? new Date(Date.now() + input.dueDays * 24 * 60 * 60 * 1000) : undefined,
          paymentId: input.paymentId,
          orderId: input.orderId,
          transactionId: input.transactionId,
          metadata: input.metadata as Prisma.InputJsonValue,
        },
      });

      logger.info(`[InvoiceService] Created invoice ${invoice.invoiceNumber} for user ${input.userId}`);

      return invoice;
    } catch (error) {
      logger.error('[InvoiceService] Error creating invoice', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getUserInvoices(userId: string, options: InvoiceListOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where: { userId } }),
    ]);

    return {
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: skip + invoices.length < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getInvoiceById(userId: string, invoiceId: string) {
    return prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });
  }

  async getAdminInvoiceById(invoiceId: string) {
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
  }

  async getInvoiceByPaymentId(userId: string, paymentId: string) {
    return prisma.invoice.findFirst({
      where: { userId, paymentId },
    });
  }

  async getAdminInvoices(options: InvoiceListOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      prisma.invoice.count(),
    ]);

    return {
      invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: skip + invoices.length < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async formatInvoiceAsCSV(invoice: Awaited<ReturnType<typeof prisma.invoice.findUnique>>) {
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const lines = [
      ['Invoice Number', invoice.invoiceNumber],
      ['Issued At', invoice.issuedAt.toISOString()],
      ['Status', invoice.status],
      ['Description', invoice.description],
      ['Amount', `$${invoice.amount.toFixed(2)}`],
      ['Currency', invoice.currency],
      ['Payment ID', invoice.paymentId || ''],
      ['Order ID', invoice.orderId || ''],
      ['Transaction ID', invoice.transactionId || ''],
      ['Due Date', invoice.dueDate ? invoice.dueDate.toISOString() : ''],
    ];

    return lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  async getInvoiceDownloadDataByPayment(userId: string, paymentId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { userId, paymentId },
    });
    if (!invoice) {
      return null;
    }
    return invoice;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
