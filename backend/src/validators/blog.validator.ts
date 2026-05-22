import { z } from 'zod';

export const CreateBlogPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters').max(300),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  featuredImage: z.string().url().optional(),
  category: z.string().min(1, 'Category is required').max(50),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional(),
  authorIds: z.array(z.string().uuid()).min(1, 'At least one author is required'),
});

export const UpdateBlogPostSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  excerpt: z.string().min(10).max(300).optional(),
  content: z.string().min(50).optional(),
  featuredImage: z.string().url().optional().nullable(),
  category: z.string().min(1).max(50).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  authorIds: z.array(z.string().uuid()).optional(),
});

export const GenerateBlogPostSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(1000),
  category: z.string().max(50).optional(),
});

export const ListBlogPostsSchema = z.object({
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateBlogPostInput = z.infer<typeof CreateBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostSchema>;
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostSchema>;
export type ListBlogPostsInput = z.infer<typeof ListBlogPostsSchema>;
