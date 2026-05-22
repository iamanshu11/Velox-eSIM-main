import { Router, Request, Response } from 'express';
import statusCode from 'http-status-codes';
import { authenticate } from '@middleware/auth';
import { sendError, sendSuccess } from '@utils/response';
import { asyncHandler } from '@utils/errors';
import { invoiceService } from './invoice.service';
import { generateInvoicePdfBuffer } from '@utils/invoicePdf';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return sendError(res, 'Unauthorized', 'User ID not found', statusCode.UNAUTHORIZED);
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const invoices = await invoiceService.getUserInvoices(userId, { page, limit });
    return sendSuccess(res, 'Invoices fetched successfully', invoices, statusCode.OK);
  }),
);

router.get(
  '/download',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const paymentId = req.query.paymentId as string;
    const invoiceId = req.query.invoiceId as string;

    if (!userId) {
      return sendError(res, 'Unauthorized', 'User ID not found', statusCode.UNAUTHORIZED);
    }

    if (!paymentId && !invoiceId) {
      return sendError(
        res,
        'Missing invoice identifier',
        'paymentId or invoiceId is required',
        statusCode.BAD_REQUEST,
      );
    }

    const invoice = invoiceId
      ? await invoiceService.getInvoiceById(userId, invoiceId)
      : await invoiceService.getInvoiceByPaymentId(userId, paymentId);

    if (!invoice) {
      return sendError(res, 'Invoice not found', 'No invoice matches the provided identifier', statusCode.NOT_FOUND);
    }

    const meta = invoice.metadata as Record<string, unknown> | null;
    const activationCode = meta?.activationCode as string | undefined;

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      description: invoice.description,
      issuedAt: invoice.issuedAt,
      orderReference: invoice.orderId ?? undefined,
      activationCode,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    return res.send(pdfBuffer);
  }),
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const invoiceId = req.params.id;

    if (!userId) {
      return sendError(res, 'Unauthorized', 'User ID not found', statusCode.UNAUTHORIZED);
    }

    const invoice = await invoiceService.getInvoiceById(userId, invoiceId);
    if (!invoice) {
      return sendError(res, 'Invoice not found', 'No invoice found', statusCode.NOT_FOUND);
    }

    return sendSuccess(res, 'Invoice fetched successfully', invoice, statusCode.OK);
  }),
);

export default router;
