import { Router, Request, Response } from 'express';
import { crmApiKeyAuth } from '@middleware/crmApiKey';
import { asyncHandler } from '@utils/errors';
import { sendSuccess } from '@utils/response';
import db from '@config/database';
import logger from '@utils/logger';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Helper: determine plan type from order metadata
// "GLOBAL" or missing countryCode = regional (e.g. All Asian)
// specific code like "JP", "IN"    = country-specific
// ─────────────────────────────────────────────────────────────
function resolvePlanType(metadata: Record<string, unknown>) {
  const countryCode = metadata?.countryCode as string | undefined;
  const packageCode = metadata?.packageCode as string | undefined;
  const packageName = metadata?.packageName as string | undefined;

  const isRegional =
    !countryCode || countryCode === 'GLOBAL' || countryCode === 'global';

  return {
    planCode: packageCode || null,
    planName: packageName || packageCode || 'Unknown Plan',
    planType: isRegional ? 'regional' : 'country_specific',
    countryCode: isRegional ? null : countryCode,
    region: isRegional ? (metadata?.region as string) || 'Global' : null,
  };
}

// ─────────────────────────────────────────────────────────────
// GET /api/crm/customers
// Returns all customers with name, email, phone, and
// their full eSIM purchase history — shaped for CRM ingestion
// Query params: page, limit, search
// ─────────────────────────────────────────────────────────────
router.get(
  '/customers',
  crmApiKeyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit as string) || 50);
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    // Search only on email/name — phone search requires DB column to exist
    const where = search
      ? {
          role: 'CUSTOMER' as const,
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name:  { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : { role: 'CUSTOMER' as const };

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: {
          id:          true,
          name:        true,
          email:       true,
          phone:       true,
          isActive:    true,
          countryName: true,
          createdAt:   true,
        },
        orderBy: { createdAt: 'desc' },
        take:  limit,
        skip,
      }),
    ]);

    // Fetch orders for all returned users in one query
    const userIds = users.map((u) => u.id);

    const orders = await db.order.findMany({
      where: {
        userId:        { in: userIds },
        paymentStatus: 'paid',
      },
      select: {
        id:        true,
        orderNo:   true,
        userId:    true,
        totalAmount: true,
        currency:  true,
        status:    true,
        metadata:  true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group orders by userId
    const ordersByUser: Record<string, typeof orders> = {};
    for (const order of orders) {
      if (!ordersByUser[order.userId]) ordersByUser[order.userId] = [];
      ordersByUser[order.userId].push(order);
    }

    // Shape the final CRM payload
    const customers = users.map((user) => {
      const userOrders = ordersByUser[user.id] || [];

      const purchases = userOrders.map((order) => {
        const meta = (order.metadata as Record<string, unknown>) || {};
        const plan = resolvePlanType(meta);

        return {
          orderId:     order.id,
          orderNo:     order.orderNo,
          planCode:    plan.planCode,
          planName:    plan.planName,
          planType:    plan.planType,        // "country_specific" | "regional"
          countryCode: plan.countryCode,     // e.g. "JP" — null if regional
          region:      plan.region,          // e.g. "Asia" — null if country-specific
          amountPaid:  order.totalAmount,
          currency:    order.currency,
          status:      order.status,
          purchasedAt: order.createdAt,
        };
      });

      const totalSpent = userOrders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0,
      );

      return {
        id:           user.id,
        name:         user.name  || '',
        email:        user.email,
        phone:        user.phone || null,
        country:      user.countryName || null,
        isActive:     user.isActive,
        registeredAt: user.createdAt,
        totalOrders:  purchases.length,
        totalSpent:   parseFloat(totalSpent.toFixed(2)),
        lastPurchaseAt: purchases[0]?.purchasedAt || null,
        purchases,
      };
    });

    return sendSuccess(res, 'CRM customers retrieved', {
      customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('[CRM] GET /customers failed:', message);
      return res.status(500).json({
        success: false,
        message: 'CRM query failed',
        detail: message,
      });
    }
  }),
);

// ─────────────────────────────────────────────────────────────
// GET /api/crm/customers/:id
// Single customer full CRM profile
// ─────────────────────────────────────────────────────────────
router.get(
  '/customers/:id',
  crmApiKeyAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id:          true,
        name:        true,
        email:       true,
        phone:       true,
        isActive:    true,
        countryName: true,
        countryCode: true,
        createdAt:   true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await db.order.findMany({
      where: { userId: id, paymentStatus: 'paid' },
      select: {
        id:          true,
        orderNo:     true,
        totalAmount: true,
        currency:    true,
        status:      true,
        metadata:    true,
        createdAt:   true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const purchases = orders.map((order) => {
      const meta = (order.metadata as Record<string, unknown>) || {};
      const plan = resolvePlanType(meta);

      return {
        orderId:     order.id,
        orderNo:     order.orderNo,
        planCode:    plan.planCode,
        planName:    plan.planName,
        planType:    plan.planType,
        countryCode: plan.countryCode,
        region:      plan.region,
        amountPaid:  order.totalAmount,
        currency:    order.currency,
        status:      order.status,
        purchasedAt: order.createdAt,
      };
    });

    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return sendSuccess(res, 'CRM customer retrieved', {
      customer: {
        id:            user.id,
        name:          user.name  || '',
        email:         user.email,
        phone:         user.phone || null,
        country:       user.countryName || null,
        countryCode:   user.countryCode || null,
        isActive:      user.isActive,
        registeredAt:  user.createdAt,
        totalOrders:   purchases.length,
        totalSpent:    parseFloat(totalSpent.toFixed(2)),
        lastPurchaseAt: purchases[0]?.purchasedAt || null,
        purchases,
      },
    });
  }),
);

export default router;
