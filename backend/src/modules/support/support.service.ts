import prisma from "@config/database";
import { Prisma } from "@prisma/client";
import logger from "@utils/logger";

export interface CreateTicketInput {
  userId: string;
  subject: string;
  message: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category?: string;
}

export interface AddReplyInput {
  ticketId: string;
  userId: string;
  message: string;
  isStaff?: boolean;
}

export interface UpdateTicketStatusInput {
  ticketId: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  notes?: string;
}

export class SupportService {
static async createTicket(input: CreateTicketInput) {
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          userId: input.userId,
          subject: input.subject,
          message: input.message,
          status: "OPEN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info(`[Support] Ticket created: ${ticket.id}`);
      return ticket;
    } catch (error) {
      logger.error("[Support] Error creating ticket:", error);
      throw error;
    }
  }
static async getUserTickets(
    userId: string,
    options: { skip?: number; take?: number } = {},
  ) {
    try {
      const { skip = 0, take = 20 } = options;

      const tickets = await prisma.supportTicket.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });

      const total = await prisma.supportTicket.count({
        where: { userId },
      });

      logger.info(`[Support] Fetched ${tickets.length} tickets for user ${userId}`);
      return { tickets, total, page: Math.floor(skip / take) + 1 };
    } catch (error) {
      logger.error("[Support] Error fetching user tickets:", error);
      throw error;
    }
  }
static async getTicket(ticketId: string, userId?: string) {
    try {
      const where: Prisma.SupportTicketWhereInput = { id: ticketId };
      if (userId) {
        where.userId = userId;
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      if (userId && ticket.userId !== userId) {
        throw new Error("Unauthorized to view this ticket");
      }

      logger.info(`[Support] Fetched ticket: ${ticketId}`);
      return ticket;
    } catch (error) {
      logger.error(`[Support] Error fetching ticket ${ticketId}:`, error);
      throw error;
    }
  }
static async addCommunication(input: AddReplyInput) {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: input.ticketId },
      });

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      if (!input.isStaff && ticket.userId !== input.userId) {
        throw new Error("Unauthorized to reply to this ticket");
      }

      const updated = await prisma.supportTicket.update({
        where: { id: input.ticketId },
        data: {
          message: `${ticket.message}\n\n---\n${input.isStaff ? "[Staff]" : "[User]"} ${new Date().toISOString()}\n${input.message}`,
          updatedAt: new Date(),
        },
      });

      logger.info(`[Support] Communication added to ticket ${input.ticketId}`);
      return updated;
    } catch (error) {
      logger.error("[Support] Error adding communication:", error);
      throw error;
    }
  }
static async updateTicketStatus(input: UpdateTicketStatusInput) {
    try {
      const ticket = await prisma.supportTicket.update({
        where: { id: input.ticketId },
        data: {
          status: input.status,
          updatedAt: new Date(),
        },
      });

      logger.info(`[Support] Ticket ${input.ticketId} status updated to ${input.status}`);
      return ticket;
    } catch (error) {
      logger.error("[Support] Error updating ticket status:", error);
      throw error;
    }
  }
static async getAllOpenTickets(options: { skip?: number; take?: number } = {}) {
    try {
      const { skip = 0, take = 20 } = options;

      const tickets = await prisma.supportTicket.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
      });

      const total = await prisma.supportTicket.count({});

      logger.info(`[Support] Fetched ${tickets.length} tickets`);
      return { tickets, total, page: Math.floor(skip / take) + 1 };
    } catch (error) {
      logger.error("[Support] Error fetching tickets:", error);
      throw error;
    }
  }
static async deleteTicket(ticketId: string) {
    try {
      const ticket = await prisma.supportTicket.delete({
        where: { id: ticketId },
      });

      logger.info(`[Support] Ticket ${ticketId} deleted`);
      return ticket;
    } catch (error) {
      logger.error("[Support] Error deleting ticket:", error);
      throw error;
    }
  }
static async getStatistics() {
    try {
      const stats = await Promise.all([
        prisma.supportTicket.count({
          where: { status: "OPEN" },
        }),
        prisma.supportTicket.count({
          where: { status: "IN_PROGRESS" },
        }),
        prisma.supportTicket.count({
          where: { status: "RESOLVED" },
        }),
        prisma.supportTicket.count({
          where: { status: "CLOSED" },
        }),
        prisma.supportTicket.count(),
      ]);

      return {
        open: stats[0],
        inProgress: stats[1],
        resolved: stats[2],
        closed: stats[3],
        total: stats[4],
      };
    } catch (error) {
      logger.error("[Support] Error fetching statistics:", error);
      throw error;
    }
  }
}
