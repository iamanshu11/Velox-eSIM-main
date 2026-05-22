import { Request, Response } from 'express';
import statusCode from 'http-status-codes';
import logger from '@utils/logger';
import { sendSuccess, sendError } from '@utils/response';
import { asyncHandler } from '@utils/errors';
import { AuthRequest } from '@/types';
import axios from 'axios';
import { config, secrets } from '@config/env';
import * as blogService from '@/services/blog.service';
import type {
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  ListBlogPostsRequest,
} from './blog.types';

export const createBlogPost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { title, excerpt, content, featuredImage, category, status, featured, scheduledAt, authorIds } =
      req.body as unknown as CreateBlogPostRequest;

    if (!title?.trim() || !excerpt?.trim() || !content?.trim() || !category?.trim()) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Missing required fields: title, excerpt, content, category',
        statusCode.BAD_REQUEST
      );
    }

    if (!authorIds || authorIds.length === 0) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'At least one author must be assigned',
        statusCode.BAD_REQUEST
      );
    }

    try {
      const post = await blogService.blogService.createBlogPost(
        {
          title,
          excerpt,
          content,
          featuredImage,
          category,
          status,
          featured,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          authorIds,
        },
        req.user!.userId
      );

      logger.info('[BlogController] Post created', { postId: post.id });
      return sendSuccess(res, 'Blog post created', post, statusCode.CREATED);
    } catch (error: any) {
      const message = error.message || 'Failed to create blog post';
      const code = error.statusCode || statusCode.INTERNAL_SERVER_ERROR;
      return sendError(res, error.code || 'CREATE_FAILED', message, code);
    }
  }
);

export const updateBlogPost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, excerpt, content, featuredImage, category, status, featured, scheduledAt, authorIds } =
      req.body as unknown as UpdateBlogPostRequest;

    if (!id) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Post ID is required',
        statusCode.BAD_REQUEST
      );
    }

    try {
      const post = await blogService.blogService.updateBlogPost(
        id,
        {
          title,
          excerpt,
          content,
          featuredImage,
          category,
          status,
          featured,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          authorIds,
        },
        req.user!.userId
      );

      logger.info('[BlogController] Post updated', { postId: id });
      return sendSuccess(res, 'Blog post updated', post);
    } catch (error: any) {
      const message = error.message || 'Failed to update blog post';
      const code = error.statusCode || statusCode.INTERNAL_SERVER_ERROR;
      return sendError(res, error.code || 'UPDATE_FAILED', message, code);
    }
  }
);

export const getBlogPost = asyncHandler(
  async (_req: Request, res: Response) => {
    const { identifier } = _req.params;

    if (!identifier) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Post ID or slug is required',
        statusCode.BAD_REQUEST
      );
    }

    try {
      const post = await blogService.blogService.getBlogPost(identifier);
      return sendSuccess(res, 'Blog post retrieved', post);
    } catch (error: any) {
      const code = error.statusCode || statusCode.INTERNAL_SERVER_ERROR;
      return sendError(res, error.code || 'GET_FAILED', error.message, code);
    }
  }
);

export const listBlogPosts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { category, status, featured, search, page, limit } = req.query as unknown as ListBlogPostsRequest;

    const isAdmin = req.user?.role === 'ADMIN';

    try {
      const result = await blogService.blogService.listBlogPosts({
        category: category as string | undefined,
        status: status as 'draft' | 'published' | 'archived' | undefined,
        featured: featured === 'true',
        search: search as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        isAdmin,
      });

      return sendSuccess(res, 'Blog posts retrieved', result);
    } catch (error: any) {
      const code = error.statusCode || statusCode.INTERNAL_SERVER_ERROR;
      return sendError(res, error.code || 'LIST_FAILED', error.message, code);
    }
  }
);

export const deleteBlogPost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'Post ID is required',
        statusCode.BAD_REQUEST
      );
    }

    try {
      const result = await blogService.blogService.deleteBlogPost(id);
      logger.info('[BlogController] Post deleted', { postId: id });
      return sendSuccess(res, 'Blog post deleted', result);
    } catch (error: any) {
      const code = error.statusCode || statusCode.INTERNAL_SERVER_ERROR;
      return sendError(res, error.code || 'DELETE_FAILED', error.message, code);
    }
  }
);

export const getCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    try {
      const categories = await blogService.blogService.getCategories();
      return sendSuccess(res, 'Categories retrieved', { categories });
    } catch (error: any) {
      return sendError(res, 'GET_FAILED', 'Failed to retrieve categories', statusCode.INTERNAL_SERVER_ERROR);
    }
  }
);

export const generateBlogPostWithAI = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { prompt, category } = req.body as { prompt: string; category?: string };

    if (!prompt || prompt.trim().length < 10) {
      return sendError(
        res,
        'VALIDATION_ERROR',
        'A prompt of at least 10 characters is required',
        statusCode.BAD_REQUEST
      );
    }

    if (!secrets.ai_api_key) {
      return sendError(
        res,
        'SERVICE_UNAVAILABLE',
        'AI service is not configured',
        statusCode.SERVICE_UNAVAILABLE
      );
    }

    const systemPrompt = `You are an expert blog writer specializing in eSIM technology, travel, and connectivity solutions. Generate a professional, engaging blog post for "Velox eSIM" eSIM service.

Rules:
- Return ONLY valid JSON — no markdown, no code fences, no explanation
- The "title" must be a compelling headline (8-15 words)
- The "excerpt" must be 1-2 sentences summarizing the post (max 150 chars)
- The "content" must be valid HTML using: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <li>, <a href="...">
- Use clear section headings with <h2> tags
- Include 2-3 subsections with <h3> tags
- Keep paragraphs concise and scannable
- Include a call-to-action at the end
- Make it SEO-friendly and informative
- Length: 1200-1500 words of content

Return this exact JSON shape:
{
  "title": "...",
  "excerpt": "...",
  "content": "..."
}`;

    try {
      const response = await axios.post(
        `${config.ai_base_url}/chat/completions`,
        {
          model: config.ai_model,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Write a blog post about: ${prompt}${category ? ` (Category: ${category})` : ''}`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${secrets.ai_api_key}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      const raw = response.data?.choices?.[0]?.message?.content?.trim();
      if (!raw) {
        return sendError(res, 'AI_ERROR', 'AI returned an empty response', statusCode.INTERNAL_SERVER_ERROR);
      }

      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned) as { title: string; excerpt: string; content: string };

      if (!parsed.title || !parsed.excerpt || !parsed.content) {
        return sendError(res, 'AI_ERROR', 'AI response was missing required fields', statusCode.INTERNAL_SERVER_ERROR);
      }

      logger.info('[BlogController] AI blog post generated', { createdBy: req.user?.userId });
      return sendSuccess(res, 'Blog post generated', {
        title: parsed.title,
        excerpt: parsed.excerpt,
        content: parsed.content,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'AI generation failed';
      logger.error('[BlogController] AI generation error', { error: msg });
      return sendError(
        res,
        'AI_ERROR',
        'Failed to generate blog post. Try a different prompt.',
        statusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
);
