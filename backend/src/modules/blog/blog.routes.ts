import { Router } from 'express';
import * as controller from './blog.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { validateBody } from '@/middleware/validation';

const router = Router();

router.get('/public', controller.listBlogPosts);

router.get('/public/:identifier', controller.getBlogPost);

router.get('/categories', controller.getCategories);

router.post(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  controller.createBlogPost
);

router.put(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  controller.updateBlogPost
);

router.delete(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  controller.deleteBlogPost
);

router.get(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  controller.listBlogPosts
);

router.get(
  '/admin/:identifier',
  authenticate,
  authorize('ADMIN'),
  controller.getBlogPost
);

router.post(
  '/admin/generate',
  authenticate,
  authorize('ADMIN'),
  controller.generateBlogPostWithAI
);

export default router;
