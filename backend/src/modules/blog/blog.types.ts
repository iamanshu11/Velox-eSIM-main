export interface CreateBlogPostRequest {
  title: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  category: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  scheduledAt?: string | Date;
  authorIds: string[];
}

export interface UpdateBlogPostRequest {
  title?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string | null;
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  scheduledAt?: string | Date | null;
  authorIds?: string[];
}

export interface ListBlogPostsRequest {
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: string;
  search?: string;
  page?: string;
  limit?: string;
}
