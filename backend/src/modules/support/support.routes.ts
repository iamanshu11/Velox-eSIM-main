import { Router, Request, Response } from "express";
import { authenticate } from "@middleware/auth";
import statusCode from "http-status-codes";
import { sendError, sendSuccess } from "@/utils/response";
import { asyncHandler } from "@utils/errors";
import { SupportService } from "./support.service";
import { supportTicketSchema, ticketReplySchema } from "@validators/support.validator";

const router = Router();
router.get(
  "/admin/tickets",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const isAdmin = req.user?.role === "ADMIN";

      if (!isAdmin) {
        return sendError(res, "Forbidden", "Only admins can view all tickets", statusCode.FORBIDDEN);
      }

      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const result = await SupportService.getAllOpenTickets({ skip, take });

      return sendSuccess(res, "Open tickets fetched", result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch tickets";
      return sendError(res, "Failed to fetch tickets", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  }),
);
router.get(
  "/admin/statistics",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const isAdmin = req.user?.role === "ADMIN";

      if (!isAdmin) {
        return sendError(res, "Forbidden", "Only admins can view statistics", statusCode.FORBIDDEN);
      }

      const stats = await SupportService.getStatistics();

      return sendSuccess(res, "Support statistics fetched", stats);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to fetch statistics";
      return sendError(res, "Failed to fetch statistics", errorMsg, statusCode.INTERNAL_SERVER_ERROR);
    }
  }),
);
router.get(
  "/user/tickets",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(
          res,
          "Unauthorized",
          "User ID not found",
          statusCode.UNAUTHORIZED,
        );
      }

      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 20;

      const result = await SupportService.getUserTickets(userId, { skip, take });

      return sendSuccess(res, "User tickets fetched successfully", result);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch tickets";
      return sendError(
        res,
        "Failed to fetch tickets",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.post(
  "/create",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedData = supportTicketSchema.parse(req.body);
      const userId = req.user?.userId;

      if (!userId) {
        return sendError(
          res,
          "Unauthorized",
          "User ID not found",
          statusCode.UNAUTHORIZED,
        );
      }

      const ticket = await SupportService.createTicket({
        userId,
        subject: validatedData.subject,
        message: validatedData.message,
        priority: validatedData.priority,
        category: validatedData.category,
      });

      return sendSuccess(res, "Ticket created successfully", ticket, statusCode.CREATED);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to create ticket";
      return sendError(
        res,
        "Failed to create ticket",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.get(
  "/:ticketId",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const userId = req.user?.userId;
      const isAdmin = req.user?.role === "ADMIN";

      const ticket = await SupportService.getTicket(ticketId, isAdmin ? undefined : userId);

      return sendSuccess(res, "Ticket fetched successfully", ticket);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch ticket";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Ticket not found",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      if (errorMsg.includes("Unauthorized")) {
        return sendError(
          res,
          "Unauthorized",
          errorMsg,
          statusCode.FORBIDDEN,
        );
      }

      return sendError(
        res,
        "Failed to fetch ticket",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.post(
  "/:ticketId/reply",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const validatedData = ticketReplySchema.parse(req.body);
      const userId = req.user?.userId;
      const isAdmin = req.user?.role === "ADMIN";

      if (!userId) {
        return sendError(
          res,
          "Unauthorized",
          "User ID not found",
          statusCode.UNAUTHORIZED,
        );
      }

      const communication = await SupportService.addCommunication({
        ticketId,
        userId,
        message: validatedData.message,
        isStaff: isAdmin,
      });

      return sendSuccess(res, "Reply added successfully", communication, statusCode.CREATED);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to add reply";

      if (errorMsg.includes("not found")) {
        return sendError(
          res,
          "Ticket not found",
          errorMsg,
          statusCode.NOT_FOUND,
        );
      }

      if (errorMsg.includes("Unauthorized")) {
        return sendError(
          res,
          "Unauthorized",
          errorMsg,
          statusCode.FORBIDDEN,
        );
      }

      return sendError(
        res,
        "Failed to add reply",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);
router.patch(
  "/:ticketId/status",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;
      const isAdmin = req.user?.role === "ADMIN";

      if (!isAdmin) {
        return sendError(
          res,
          "Forbidden",
          "Only admins can update ticket status",
          statusCode.FORBIDDEN,
        );
      }

      if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
        return sendError(
          res,
          "Invalid status",
          "Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED",
          statusCode.BAD_REQUEST,
        );
      }

      const ticket = await SupportService.updateTicketStatus({
        ticketId,
        status,
      });

      return sendSuccess(res, "Ticket status updated", ticket);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update ticket";
      return sendError(
        res,
        "Failed to update ticket",
        errorMsg,
        statusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }),
);

export default router;
