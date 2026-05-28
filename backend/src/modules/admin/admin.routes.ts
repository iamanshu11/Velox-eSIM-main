import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import statusCode from 'http-status-codes';
import { sendSuccess, sendError } from '@utils/response';
import { settingsService } from '@modules/settings/settings.service';
import { esimAccessService, esimService } from '@modules/esim/esim.service';
import { walletService } from '@modules/wallet/wallet.service';
import { invoiceService } from '@modules/payments/invoice.service';
import { asyncHandler } from '@utils/errors';
import logger from '@utils/logger';
import db from '@config/database';
import bcrypt from 'bcryptjs';
import { supportsUserCountryFields } from '@utils/userCountryFields';
import emailService from '@utils/email';
import { generateInvoicePdfBuffer } from '@utils/invoicePdf';

const router = Router();
router.get(
  '/credentials/status',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingsService.getSettings();
    
    const isConfigured = !!(
      settings.esimAccessCode && 
      settings.esimSecretKey &&
      settings.esimAccessCode.trim() !== '' &&
      settings.esimSecretKey.trim() !== ''
    );

    return sendSuccess(res, 'Credentials status retrieved', {
      isConfigured,
      message: isConfigured 
        ? 'eSIMaccess API credentials are configured and ready' 
        : 'Please configure eSIMaccess API credentials',
    });
  })
);
router.post(
  '/credentials',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { accessCode, secretKey } = req.body;

    if (!accessCode || !secretKey) {
      return sendError(
        res,
        'Access code and secret key are required',
        undefined,
        statusCode.BAD_REQUEST
      );
    }

    const _settings = await settingsService.updateSettings({
      esimAccessCode: accessCode,
      esimSecretKey: secretKey,
    });

    process.env.ESIM_ACCESS_CODE = accessCode;
    process.env.ESIM_SECRET_KEY = secretKey;

    esimAccessService.resetClient();

    logger.success('[Credentials] Credentials stored successfully');

    return sendSuccess(res, 'Credentials set successfully', {
      isConfigured: true,
      message: 'API credentials have been configured and are ready to use',
    });
  })
);
const verifyCredentialsHandler = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();

    if (!settings.esimAccessCode || !settings.esimSecretKey) {
      return sendSuccess(res, 'Credentials not configured', {
        valid: false,
        message: 'No credentials configured. Please set credentials first.',
      });
    }

    try {
      logger.info('[Verify] Testing credentials with eSIMaccess API...');
      const balance = await esimAccessService.getAccountBalance();

      logger.success('[Verify] Credentials verified successfully', { balance: balance.balance / 10000 });
      return sendSuccess(res, 'Credentials are valid', {
        valid: true,
        message: 'Successfully connected to eSIMaccess API',
        balance: balance.balance / 10000,
      });
    } catch (apiError: unknown) {
      const error = apiError instanceof Error ? apiError : new Error(String(apiError));
      logger.error('[Verify] API validation failed', error);
      return sendSuccess(res, 'Credentials are invalid', {
        valid: false,
        message: `Failed to validate with eSIMaccess API: ${error.message}`,
      });
    }
  } catch (error) {
    return sendError(
      res,
      'Failed to verify credentials',
      error instanceof Error ? error.message : 'Unknown error',
      statusCode.INTERNAL_SERVER_ERROR
    );
  }
});

// Accept both GET (direct browser/curl access) and POST (frontend SDK call)
router.get('/credentials/verify', authenticate, authorize('ADMIN'), verifyCredentialsHandler);
router.post('/credentials/verify', authenticate, authorize('ADMIN'), verifyCredentialsHandler);
router.delete(
  '/credentials',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    await settingsService.updateSettings({
      esimAccessCode: '',
      esimSecretKey: '',
    });

    delete process.env.ESIM_ACCESS_CODE;
    delete process.env.ESIM_SECRET_KEY;

    esimAccessService.resetClient();

    logger.success('[Credentials] Credentials cleared successfully');

    return sendSuccess(res, 'Credentials cleared successfully', {
      success: true,
      message: 'API credentials have been removed',
    });
  })
);
router.get(
  '/users/stats',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    const totalUsers = await db.user.count();
    const activeUsers = await db.user.count({
      where: { isActive: true },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await db.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const usersByRole = await db.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const roleDistribution = usersByRole.map((item: Record<string, unknown>) => ({
      role: item.role,
      count: item._count,
    }));

    logger.info('[Users Stats] Retrieved user statistics', {
      totalUsers,
      activeUsers,
      newUsers,
    });

    return sendSuccess(res, 'User statistics retrieved', {
      totalUsers,
      activeUsers,
      newUsers,
      roleDistribution,
    });
  })
);

router.get(
  '/users',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10', offset = '0', search = '', role, sort = 'createdAt', order = 'desc' } = req.query;

    const pageSize = Math.min(parseInt(limit as string) || 10, 100);
    const pageOffset = parseInt(offset as string) || 0;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const totalUsers = await db.user.count({ where });

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        [sort as string]: order === 'asc' ? 'asc' : 'desc',
      },
      take: pageSize,
      skip: pageOffset,
    });

    logger.info('[Users List] Retrieved users', {
      count: users.length,
      total: totalUsers,
      page: Math.floor(pageOffset / pageSize) + 1,
    });

    return sendSuccess(res, 'Users retrieved successfully', {
      users,
      pagination: {
        total: totalUsers,
        limit: pageSize,
        offset: pageOffset,
        pages: Math.ceil(totalUsers / pageSize),
      },
    });
  })
);
router.post(
  '/users',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password, role = 'CUSTOMER' } = req.body;

    if (!email || !password) {
      return sendError(
        res,
        'Email and password are required',
        undefined,
        statusCode.BAD_REQUEST
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError(
        res,
        'User with this email already exists',
        undefined,
        statusCode.CONFLICT
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        role,
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    logger.success('[User Created] New user created by admin', {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return sendSuccess(
      res,
      'User created successfully',
      newUser,
      statusCode.CREATED
    );
  })
);
router.get(
  '/users/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canStoreCountry = await supportsUserCountryFields();

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatar: true,
        ...(canStoreCountry
          ? {
              countryCode: true,
              countryName: true,
              countrySource: true,
              lastSeenCountryCode: true,
              lastSeenCountryName: true,
              lastSeenAt: true,
            }
          : {}),
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(
        res,
        'User not found',
        undefined,
        statusCode.NOT_FOUND
      );
    }

    logger.info('[User Details] Retrieved user details', { userId: id });

    return sendSuccess(res, 'User details retrieved', user);
  })
);
router.get(
  '/users/:id/overview',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const canStoreCountry = await supportsUserCountryFields();

    const loadWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string, fallback: T): Promise<T> => {
      let timeoutHandle: NodeJS.Timeout | null = null;
      const guardedPromise = promise.catch((error) => {
        logger.warn(`[User Overview] ${label} failed`, {
          userId: id,
          error: error instanceof Error ? error.message : String(error),
        });
        return fallback;
      });

      try {
        return await Promise.race([
          guardedPromise,
          new Promise<T>((resolve) => {
            timeoutHandle = setTimeout(() => {
              logger.warn(`[User Overview] ${label} timed out`, { userId: id, timeoutMs });
              resolve(fallback);
            }, timeoutMs);
          }),
        ]);
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      }
    };

    const user = await loadWithTimeout(
      db.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          avatar: true,
          ...(canStoreCountry
            ? {
                countryCode: true,
                countryName: true,
                countrySource: true,
                lastSeenCountryCode: true,
                lastSeenCountryName: true,
                lastSeenAt: true,
              }
            : {}),
          createdAt: true,
          updatedAt: true,
        },
      }),
      2000,
      'user profile load',
      null,
    );

    if (!user) {
      return sendError(res, 'User not found', undefined, statusCode.NOT_FOUND);
    }

    const [wallet, transactions, payments, devices, notifications, supportTickets, autoRenewals, referralCodes, activityLogs, orders] = await Promise.all([
      loadWithTimeout(
        db.wallet.findUnique({ where: { userId: id } }),
        2000,
        'wallet load',
        null,
      ),
      loadWithTimeout(
        walletService.getTransactionHistory(id, 1, 100),
        4000,
        'transaction history load',
        { transactions: [], total: 0, pages: 0 },
      ),
      loadWithTimeout(
        db.payment.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        3000,
        'payment history load',
        [],
      ),
      loadWithTimeout(
        db.device.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        3000,
        'device history load',
        [],
      ),
      loadWithTimeout(
        db.notification.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        3000,
        'notification history load',
        [],
      ),
      loadWithTimeout(
        db.supportTicket.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        3000,
        'support ticket history load',
        [],
      ),
      loadWithTimeout(
        db.autoRenewal.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        3000,
        'auto renewal history load',
        [],
      ),
      loadWithTimeout(
        db.referralCode.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        3000,
        'referral history load',
        [],
      ),
      loadWithTimeout(
        db.activityLog.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        3000,
        'activity history load',
        [],
      ),
      loadWithTimeout(
        db.order.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNo: true,
            userId: true,
            transactionId: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            currency: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        3000,
        'order history load',
        [],
      ),
    ]);

    let esimHistory: Awaited<ReturnType<typeof esimService.getUserMyESIMs>> | null = null;
    try {
      esimHistory = await loadWithTimeout(
        esimService.getUserMyESIMs(id, 1, 20),
        5000,
        'eSIM history load',
        null,
      );
    } catch (error) {
      logger.warn('[User Overview] Failed to load eSIM history', {
        userId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const overviewOrders = (esimHistory?.orders || orders) as Array<{
      status?: string;
      profileStatus?: string;
    }>;

    const latestCompletedTransaction = transactions.transactions.find((transaction) => transaction.status === 'completed');
    const walletSnapshot = latestCompletedTransaction
      ? {
          balance: latestCompletedTransaction.balanceAfter,
          currency: wallet?.currency ?? 'USD',
          updatedAt: latestCompletedTransaction.createdAt ?? wallet?.updatedAt ?? null,
        }
      : wallet
        ? {
            balance: wallet.balance,
            currency: wallet.currency ?? 'USD',
            updatedAt: wallet.updatedAt ?? null,
          }
        : {
            balance: 0,
            currency: 'USD',
            updatedAt: null,
          };

    const activeESIMs = overviewOrders.filter((item) => {
      const status = String(item.status || item.profileStatus || '').toLowerCase();
      return status.includes('active') || status.includes('in_use') || status.includes('enabled');
    }).length;

    const completedOrders = orders.filter((order) => String(order.status || '').toLowerCase().includes('complete')).length;
    const pendingOrders = orders.filter((order) => String(order.status || '').toLowerCase().includes('pending')).length;
    const unreadNotifications = notifications.filter((notification) => !notification.isRead).length;
    const activeAutoRenewals = autoRenewals.filter((renewal) => renewal.enabled).length;
    const totalSpent = transactions.transactions.reduce((sum, transaction) => {
      const direction = String((transaction.metadata as { direction?: string } | null)?.direction || '').toLowerCase();

      if (transaction.transactionType === 'ESIM_PURCHASE' && transaction.status === 'completed') {
        return sum + transaction.amount;
      }

      if (transaction.transactionType === 'ADMIN_ADJUSTMENT' && direction === 'decrease') {
        return sum + transaction.amount;
      }

      return sum;
    }, 0);
    const totalCredits = transactions.transactions.reduce((sum, transaction) => {
      const direction = String((transaction.metadata as { direction?: string } | null)?.direction || '').toLowerCase();

      if (transaction.transactionType === 'REFUND' || transaction.transactionType === 'CREDIT') {
        return sum + transaction.amount;
      }

      if (transaction.transactionType === 'ADMIN_ADJUSTMENT' && direction === 'increase') {
        return sum + transaction.amount;
      }

      return sum;
    }, 0);

    return sendSuccess(res, 'User overview retrieved', {
      user,
      wallet: walletSnapshot,
      summary: {
        totalOrders: orders.length,
        totalESIMOrders: esimHistory?.pagination.total ?? orders.length,
        activeESIMs,
        completedOrders,
        pendingOrders,
        totalTransactions: transactions.total,
        totalPayments: payments.length,
        totalDevices: devices.length,
        totalSupportTickets: supportTickets.length,
        unreadNotifications,
        activeAutoRenewals,
        totalReferralCodes: referralCodes.length,
        monthlySpending: totalSpent,
        monthlyCredits: totalCredits,
      },
      history: {
        orders: orders,
        esims: esimHistory?.orders || [],
        transactions: transactions.transactions,
        payments,
        devices,
        notifications,
        supportTickets,
        autoRenewals,
        referralCodes,
        activityLogs,
      },
    });
  })
);
router.get(
  '/invoices',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const invoiceResult = await invoiceService.getAdminInvoices({ page, limit });
    return sendSuccess(res, 'Invoices retrieved successfully', invoiceResult, statusCode.OK);
  }),
);
router.get(
  '/invoices/:id/download',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const invoice = await invoiceService.getAdminInvoiceById(id);
    if (!invoice) {
      return sendError(res, 'Invoice not found', 'No invoice matches the provided id', statusCode.NOT_FOUND);
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
router.post(
  '/users/:id/wallet-adjustment',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, direction, reason } = req.body;

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
      return sendError(
        res,
        'Invalid amount',
        'Amount must be a positive number',
        statusCode.BAD_REQUEST
      );
    }

    if (direction !== 'increase' && direction !== 'decrease') {
      return sendError(
        res,
        'Invalid direction',
        "Direction must be either 'increase' or 'decrease'",
        statusCode.BAD_REQUEST
      );
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', undefined, statusCode.NOT_FOUND);
    }

    const adjustedWallet = await walletService.adjustBalance(
      id,
      amount,
      direction,
      `ADMIN-${Date.now()}`,
      {
        reason: reason || null,
        adjustedBy: req.user?.userId || null,
        adjustedByRole: req.user?.role || null,
        targetUserId: id,
      }
    );

    logger.info('[Admin Wallet Adjustment] Wallet updated', {
      targetUserId: id,
      adjustedBy: req.user?.userId,
      direction,
      amount,
      reason: reason || null,
      balanceAfter: adjustedWallet.balance,
    });

    return sendSuccess(res, 'Wallet adjusted successfully', {
      user,
      wallet: {
        balance: adjustedWallet.balance,
        currency: adjustedWallet.currency,
        updatedAt: adjustedWallet.updatedAt,
      },
      adjustment: {
        amount,
        direction,
        reason: reason || null,
      },
    });
  })
);
router.post(
  '/users/:id/send-email',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const html = typeof req.body?.html === 'string' ? req.body.html.trim() : '';

    if (!subject) {
      return sendError(res, 'Invalid subject', 'Subject is required', statusCode.BAD_REQUEST);
    }

    if (subject.length > 180) {
      return sendError(res, 'Invalid subject', 'Subject must be 180 characters or less', statusCode.BAD_REQUEST);
    }

    if (!message && !html) {
      return sendError(
        res,
        'Invalid body',
        'Provide message or html content',
        statusCode.BAD_REQUEST
      );
    }

    if (message.length > 10000) {
      return sendError(res, 'Invalid body', 'Message must be 10000 characters or less', statusCode.BAD_REQUEST);
    }

    if (html.length > 30000) {
      return sendError(res, 'Invalid body', 'HTML content must be 30000 characters or less', statusCode.BAD_REQUEST);
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', undefined, statusCode.NOT_FOUND);
    }

    const safeHtml = html || `<div style="font-family: Arial, sans-serif; white-space: pre-wrap; line-height: 1.6;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    const safeText = message || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    const sent = await emailService.sendEmail(user.email, subject, safeHtml, safeText);

    if (!sent) {
      return sendError(
        res,
        'Failed to send email',
        'Email could not be delivered. Verify SMTP settings in admin settings.',
        statusCode.INTERNAL_SERVER_ERROR
      );
    }

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'ADMIN_CUSTOM_EMAIL_SENT',
        resource: 'user',
        module: 'admin',
        details: `Subject: ${subject.slice(0, 120)} | Sent by: ${req.user?.userId || 'unknown'}`,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    logger.success('[Admin Email] Custom email sent', {
      targetUserId: user.id,
      targetEmail: user.email,
      sentBy: req.user?.userId,
      subject,
    });

    return sendSuccess(res, 'Email sent successfully', {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      email: {
        subject,
        sentAt: new Date().toISOString(),
      },
    });
  })
);
router.put(
  '/users/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, role, isActive, emailVerified } = req.body;

    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return sendError(
        res,
        'User not found',
        undefined,
        statusCode.NOT_FOUND
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.success('[User Updated] User updated by admin', {
      userId: id,
      changes: updateData,
    });

    return sendSuccess(res, 'User updated successfully', updatedUser);
  })
);
router.delete(
  '/users/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return sendError(
        res,
        'User not found',
        undefined,
        statusCode.NOT_FOUND
      );
    }

    const deletedUser = await db.user.update({
      where: { id },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.success('[User Deleted] User deactivated by admin', {
      userId: id,
      email: deletedUser.email,
    });

    return sendSuccess(
      res,
      'User deleted successfully',
      deletedUser,
      statusCode.OK
    );
  })
);
router.post(
  '/users/bulk/delete',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return sendError(
        res,
        'Invalid user IDs',
        undefined,
        statusCode.BAD_REQUEST
      );
    }

    const result = await db.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        isActive: false,
      },
    });

    logger.success('[Bulk Delete] Multiple users deactivated', {
      count: result.count,
      userIds,
    });

    return sendSuccess(res, 'Users deleted successfully', {
      deletedCount: result.count,
    });
  })
);
router.post(
  '/users/bulk/update',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return sendError(
        res,
        'Invalid user IDs',
        undefined,
        statusCode.BAD_REQUEST
      );
    }

    const result = await db.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: updates,
    });

    logger.success('[Bulk Update] Multiple users updated', {
      count: result.count,
      updates,
    });

    return sendSuccess(res, 'Users updated successfully', {
      updatedCount: result.count,
    });
  })
);
export default router;
