import db from '@config/database';
import logger from '@utils/logger';
import { AppError } from '@utils/errors';
import utilityService from '@utils/utility';

export interface CreateBlogPostInput {
  title: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  scheduledAt?: Date;
  authorIds: string[];
}

export interface UpdateBlogPostInput {
  title?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string | null;
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  scheduledAt?: Date;
  authorIds?: string[];
}

export interface BlogPostFilters {
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  isAdmin?: boolean;
}

export class BlogService {
async createBlogPost(input: CreateBlogPostInput, createdBy: string) {
    try {
      const slug = utilityService.toSlug(input.title);

      const existing = await db.blogPost.findUnique({ where: { slug } });
      if (existing) {
        throw new AppError(409, 'A post with this title already exists');
      }

      let publishedAt: Date | null = null;
      if (input.status === 'published' && !input.scheduledAt) {
        publishedAt = new Date();
      } else if (input.status === 'published' && input.scheduledAt && input.scheduledAt <= new Date()) {
        publishedAt = new Date();
      }

      const post = await db.blogPost.create({
        data: {
          slug,
          title: input.title,
          excerpt: input.excerpt,
          content: input.content,
          featuredImage: input.featuredImage,
          category: input.category,
          status: input.status || 'draft',
          featured: input.featured || false,
          publishedAt,
          scheduledAt: input.scheduledAt,
          createdBy,
          updatedBy: createdBy,
          authors: {
            create: input.authorIds.map((userId, index) => ({
              userId,
              order: index,
            })),
          },
        },
        include: {
          authors: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          creator: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      logger.info('[BlogService] Blog post created', { postId: post.id, createdBy });
      return post;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('[BlogService] Failed to create blog post', { error });
      throw new AppError(500, 'Failed to create blog post');
    }
  }
async updateBlogPost(postId: string, input: UpdateBlogPostInput, updatedBy: string) {
    try {
      const post = await db.blogPost.findUnique({ where: { id: postId } });
      if (!post) {
        throw new AppError(404, 'Blog post not found');
      }

      let slug = post.slug;
      if (input.title && input.title !== post.title) {
        slug = utilityService.toSlug(input.title);
        const existing = await db.blogPost.findUnique({ where: { slug } });
        if (existing && existing.id !== postId) {
          throw new AppError(409, 'A post with this title already exists');
        }
      }

      let publishedAt = post.publishedAt;
      if (input.status === 'published' && !post.publishedAt && !input.scheduledAt) {
        publishedAt = new Date();
      } else if (input.status === 'published' && input.scheduledAt && input.scheduledAt <= new Date()) {
        publishedAt = new Date();
      } else if (input.status !== 'published') {
        publishedAt = null;
      }

      if (input.authorIds) {
        await db.blogAuthor.deleteMany({ where: { postId } });
        await db.blogAuthor.createMany({
          data: input.authorIds.map((userId, index) => ({
            postId,
            userId,
            order: index,
          })),
        });
      }

      const updated = await db.blogPost.update({
        where: { id: postId },
        data: {
          ...(input.title && { title: input.title, slug }),
          ...(input.excerpt && { excerpt: input.excerpt }),
          ...(input.content && { content: input.content }),
          ...(input.featuredImage !== undefined && { featuredImage: input.featuredImage }),
          ...(input.category && { category: input.category }),
          ...(input.status && { status: input.status, publishedAt }),
          ...(input.featured !== undefined && { featured: input.featured }),
          ...(input.scheduledAt && { scheduledAt: input.scheduledAt }),
          updatedBy,
          updatedAt: new Date(),
        },
        include: {
          authors: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          creator: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      logger.info('[BlogService] Blog post updated', { postId, updatedBy });
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('[BlogService] Failed to update blog post', { error });
      throw new AppError(500, 'Failed to update blog post');
    }
  }
async getBlogPost(identifier: string) {
    try {
      const post = await db.blogPost.findFirst({
        where: {
          OR: [{ id: identifier }, { slug: identifier }],
        },
        include: {
          authors: {
            orderBy: { order: 'asc' },
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          creator: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      if (!post) {
        throw new AppError(404, 'Blog post not found');
      }

      if (post.status === 'published') {
        await db.blogPost.update({
          where: { id: post.id },
          data: { viewCount: { increment: 1 } },
        });
      }

      return post;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('[BlogService] Failed to get blog post', { error });
      throw new AppError(500, 'Failed to retrieve blog post');
    }
  }
async listBlogPosts(filters: BlogPostFilters) {
    try {
      logger.info('[BlogService] Fetching blog posts', { filters });
      
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const skip = (page - 1) * limit;

      const andConditions: any[] = [];
      if (!filters.status) {
        if (!filters.isAdmin) {
          andConditions.push({ status: 'published' });
        }
      } else {
        andConditions.push({ status: filters.status });
      }

      if (filters.category) {
        andConditions.push({ category: filters.category });
      }

      if (filters.featured !== undefined) {
        andConditions.push({ featured: filters.featured });
      }

      if (filters.search) {
        andConditions.push({
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { excerpt: { contains: filters.search, mode: 'insensitive' } },
          ],
        });
      }

      const where = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };

      logger.info('[BlogService] Executing blog posts query', { where, skip, limit });

      const [posts, total] = await Promise.all([
        db.blogPost.findMany({
          where,
          include: {
            authors: {
              orderBy: { order: 'asc' },
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
            creator: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { publishedAt: 'desc' },
          skip,
          take: limit,
        }),
        db.blogPost.count({ where }),
      ]);

      logger.info('[BlogService] Blog posts fetched successfully', { count: posts.length, total });

      return {
        posts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('[BlogService] Failed to list blog posts', { error });
      throw new AppError(500, 'Failed to retrieve blog posts');
    }
  }
async deleteBlogPost(postId: string) {
    try {
      const post = await db.blogPost.findUnique({ where: { id: postId } });
      if (!post) {
        throw new AppError(404, 'Blog post not found');
      }

      if (post.status === 'published') {
        throw new AppError(409, 'Cannot delete published posts. Archive them instead.');
      }

      await db.blogPost.delete({ where: { id: postId } });
      logger.info('[BlogService] Blog post deleted', { postId });
      return { success: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('[BlogService] Failed to delete blog post', { error });
      throw new AppError(500, 'Failed to delete blog post');
    }
  }
async publishScheduledPosts() {
    try {
      const now = new Date();
      const updated = await db.blogPost.updateMany({
        where: {
          status: 'draft',
          scheduledAt: { lte: now },
        },
        data: {
          status: 'published',
          publishedAt: now,
        },
      });

      logger.info('[BlogService] Scheduled posts published', { count: updated.count });
      return { published: updated.count };
    } catch (error) {
      logger.error('[BlogService] Failed to publish scheduled posts', { error });
      throw error;
    }
  }
async getCategories() {
    try {
      const categories = await db.blogPost.findMany({
        where: { status: 'published' },
        distinct: ['category'],
        select: { category: true },
      });

      return categories.map((c) => c.category).sort();
    } catch (error) {
      logger.error('[BlogService] Failed to get categories', { error });
      throw error;
    }
  }
}

export const blogService = new BlogService();
