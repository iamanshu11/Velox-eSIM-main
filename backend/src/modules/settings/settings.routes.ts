import { Router } from 'express';
import { authenticate, authorize } from '@middleware/auth';
import {
  getSettings,
  getProfitMargin,
  updateSettings,
  updateProfitMargin,
  testSMTP,
  testEmail,
} from './settings.controller';

const router = Router();
router.get('/', getSettings);
router.get('/profit-margin', getProfitMargin);
router.put('/', authenticate, authorize('ADMIN'), updateSettings);
router.put('/profit-margin', authenticate, authorize('ADMIN'), updateProfitMargin);
router.post('/test-smtp', authenticate, authorize('ADMIN'), testSMTP);
router.post('/test-email', authenticate, authorize('ADMIN'), testEmail);

export default router;
