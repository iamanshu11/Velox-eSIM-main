import { apiSlice } from './apiSlice';

export const blogSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listPublicBlogPosts: builder.query<
      any,
      { category?: string; featured?: boolean; search?: string; page?: number; limit?: number }
    >({
      query: (args) => ({
        url: '/blog/public',
        params: {
          category: args?.category,
          featured: args?.featured,
          search: args?.search,
          page: args?.page ?? 1,
          limit: args?.limit ?? 20,
          status: 'published',
        },
      }),
      transformResponse: (response: any) => ({
        posts: response.data?.posts ?? [],
        pagination: response.data?.pagination,
      }),
      providesTags: ['BlogPost'],
    }),

    getPublicBlogPost: builder.query<any, string>({
      query: (identifier) => `/blog/public/${identifier}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, identifier) => [{ type: 'BlogPost', id: identifier }],
    }),

    getBlogCategories: builder.query<string[], void>({
      query: () => '/blog/categories',
      transformResponse: (response: any) => response.data?.categories ?? [],
      providesTags: ['BlogCategory'],
    }),

    listAdminBlogPosts: builder.query<
      any,
      { category?: string; status?: string; search?: string; page?: number; limit?: number }
    >({
      query: (args) => ({
        url: '/blog/admin',
        params: {
          category: args?.category,
          status: args?.status,
          search: args?.search,
          page: args?.page ?? 1,
          limit: args?.limit ?? 20,
        },
      }),
      transformResponse: (response: any) => ({
        posts: response.data?.posts ?? [],
        pagination: response.data?.pagination,
      }),
      providesTags: ['BlogPost'],
    }),

    getAdminBlogPost: builder.query<any, string>({
      query: (identifier) => `/blog/admin/${identifier}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, identifier) => [{ type: 'BlogPost', id: identifier }],
    }),

    createBlogPost: builder.mutation<
      any,
      {
        title: string;
        excerpt: string;
        content: string;
        featuredImage?: string;
        category: string;
        status?: 'draft' | 'published' | 'archived';
        featured?: boolean;
        scheduledAt?: string;
        authorIds: string[];
      }
    >({
      query: (data) => ({
        url: '/blog/admin',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BlogPost'],
    }),

    updateBlogPost: builder.mutation<
      any,
      {
        id: string;
        title?: string;
        excerpt?: string;
        content?: string;
        featuredImage?: string | null;
        category?: string;
        status?: 'draft' | 'published' | 'archived';
        featured?: boolean;
        scheduledAt?: string | null;
        authorIds?: string[];
      }
    >({
      query: ({ id, ...data }) => ({
        url: `/blog/admin/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'BlogPost', id },
        'BlogPost',
      ],
    }),

    deleteBlogPost: builder.mutation<any, string>({
      query: (id) => ({
        url: `/blog/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BlogPost'],
    }),

    generateBlogPost: builder.mutation<
      { title: string; excerpt: string; content: string },
      { prompt: string; category?: string }
    >({
      query: (data) => ({
        url: '/blog/admin/generate',
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: any) => response.data,
    }),

    uploadBlogFeaturedImage: builder.mutation<
      { url: string; publicId: string },
      FormData
    >({
      query: (formData) => ({
        url: '/upload/blog-featured-image',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: any) => response.data,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPublicBlogPostsQuery,
  useGetPublicBlogPostQuery,
  useGetBlogCategoriesQuery,
  useListAdminBlogPostsQuery,
  useGetAdminBlogPostQuery,
  useCreateBlogPostMutation,
  useUpdateBlogPostMutation,
  useDeleteBlogPostMutation,
  useGenerateBlogPostMutation,
  useUploadBlogFeaturedImageMutation,
} = blogSlice;
