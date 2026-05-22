import { Router } from 'express';
import {
  registerController,
  loginController,
  getProfileController,
  updateProfileController,
  refreshTokenController,
  logoutController,
  logoutAllController,
  changePasswordController,
} from './auth.controller';
import { authenticate } from '@middleware/auth';
import { authLimiter, createAccountLimiter } from '@middleware/rateLimiter';

const router = Router();

router.post('/register', createAccountLimiter, registerController);
router.post('/login', authLimiter, loginController);
router.post('/refresh', refreshTokenController);
router.post('/logout', logoutController);
router.post('/logout-all', authenticate, logoutAllController);
router.get('/profile', authenticate, getProfileController);
router.put('/profile', authenticate, updateProfileController);
router.post('/change-password', authenticate, changePasswordController);

export default router;
