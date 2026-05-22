import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { getDashboardMetrics, getRevenueAnalytics, getUserGrowth, getPlanPopularity, getOrderStats, getPaymentStats, getPurchaseOverview, getActiveESIMOverview, getNewESIMPurchasedTop10, getTopPackages, getRecentPurchases, getPackageAnalytics } from './analytics.controller';

const router = Router();

router.get('/metrics', authenticate, getDashboardMetrics);
router.get('/dashboard', authenticate, getDashboardMetrics);
router.get('/revenue', authenticate, getRevenueAnalytics);
router.get('/growth', authenticate, getUserGrowth);
router.get('/popularity', getPlanPopularity);
router.get('/orders', authenticate, getOrderStats);
router.get('/payments', authenticate, getPaymentStats);

router.get('/overview/purchase', authenticate, getPurchaseOverview);
router.get('/overview/esim', authenticate, getActiveESIMOverview);
router.get('/overview/new-esim-top10', authenticate, getNewESIMPurchasedTop10);
router.get('/overview/packages', authenticate, getTopPackages);
router.get('/overview/recent-purchases', authenticate, getRecentPurchases);
router.get('/overview/package-analytics', authenticate, getPackageAnalytics);

export default router;
