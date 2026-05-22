import { apiSlice } from './apiSlice';

export const autoEmailSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTemplate: builder.mutation<
      any,
      { title: string; subject: string; contentTemplate: string; aiPrompt?: string }
    >({
      query: (data) => ({ url: '/admin/auto-emails/templates', method: 'POST', body: data }),
      invalidatesTags: ['AutoEmailTemplate'],
    }),

    listTemplates: builder.query<any[], { includeInactive?: boolean }>({
      query: (args) => ({
        url: '/admin/auto-emails/templates',
        params: { includeInactive: args?.includeInactive },
      }),
      transformResponse: (response: any) => response.data ?? [],
      providesTags: ['AutoEmailTemplate'],
    }),

    getTemplate: builder.query<any, string>({
      query: (id) => `/admin/auto-emails/templates/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, id) => [{ type: 'AutoEmailTemplate', id }],
    }),

    updateTemplate: builder.mutation<
      any,
      { id: string; subject?: string; contentTemplate?: string; aiPrompt?: string; isActive?: boolean }
    >({
      query: ({ id, ...data }) => ({
        url: `/admin/auto-emails/templates/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AutoEmailTemplate', id },
        'AutoEmailTemplate',
      ],
    }),

    deleteTemplate: builder.mutation<any, string>({
      query: (id) => ({ url: `/admin/auto-emails/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AutoEmailTemplate'],
    }),

    generateTemplate: builder.mutation<{ title: string; subject: string; contentTemplate: string }, string>({
      query: (prompt) => ({
        url: '/admin/auto-emails/templates/generate',
        method: 'POST',
        body: { prompt },
      }),
      transformResponse: (response: any) => response.data,
    }),

    getScheduleProgress: builder.query<any, void>({
      query: () => '/admin/auto-emails/schedule',
      transformResponse: (response: any) => response.data,
      providesTags: ['AutoEmailSchedule'],
    }),

    getEmailAnalytics: builder.query<any, { days?: number }>({
      query: (args) => ({
        url: '/admin/auto-emails/analytics',
        params: { days: args?.days ?? 30 },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['AutoEmailAnalytics'],
    }),

    getDeliveryReports: builder.query<
      any,
      { page?: number; limit?: number; templateId?: string }
    >({
      query: (args) => ({
        url: '/admin/auto-emails/delivery-reports',
        params: { page: args?.page ?? 1, limit: args?.limit ?? 20, templateId: args?.templateId },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['AutoEmailDeliveryReport'],
    }),

    sendCustomEmail: builder.mutation<
      any,
      { templateId: string; userIds: string[]; customContent?: string; sendImmediately?: boolean }
    >({
      query: (data) => ({ url: '/admin/auto-emails/send-custom', method: 'POST', body: data }),
      invalidatesTags: ['AutoEmailSchedule'],
    }),

    updateUserEmailStatus: builder.mutation<
      any,
      { userId: string; emailStatus: 'new' | 'active' | 'inactive'; emailUnsubscribed?: boolean }
    >({
      query: ({ userId, ...data }) => ({
        url: `/admin/users/${userId}/email-status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    classifyUsers: builder.mutation<any, void>({
      query: () => ({ url: '/admin/auto-emails/classify-users', method: 'POST' }),
      invalidatesTags: ['User'],
    }),

    scheduleEmails: builder.mutation<any, void>({
      query: () => ({ url: '/admin/auto-emails/schedule-emails', method: 'POST' }),
      invalidatesTags: ['AutoEmailSchedule'],
    }),

    processEmailsNow: builder.mutation<any, void>({
      query: () => ({ url: '/admin/auto-emails/process-now', method: 'POST' }),
      invalidatesTags: ['AutoEmailSchedule'],
    }),

    listEmailSchedules: builder.query<any, { page?: number; limit?: number; status?: string }>({
      query: (args) => ({
        url: '/admin/auto-emails/schedules',
        params: { page: args?.page ?? 1, limit: args?.limit ?? 20, status: args?.status },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['AutoEmailSchedule'],
    }),

    cancelEmailSchedule: builder.mutation<any, string>({
      query: (id) => ({ url: `/admin/auto-emails/schedules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AutoEmailSchedule'],
    }),

    searchUsers: builder.query<{ id: string; name: string; email: string }[], string>({
      query: (search) => ({
        url: '/admin/users',
        params: { search, limit: 20 },
      }),
      transformResponse: (response: any) => response.data?.users ?? [],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateTemplateMutation,
  useListTemplatesQuery,
  useGetTemplateQuery,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useGenerateTemplateMutation,
  useGetScheduleProgressQuery,
  useGetEmailAnalyticsQuery,
  useGetDeliveryReportsQuery,
  useSendCustomEmailMutation,
  useUpdateUserEmailStatusMutation,
  useClassifyUsersMutation,
  useScheduleEmailsMutation,
  useProcessEmailsNowMutation,
  useListEmailSchedulesQuery,
  useCancelEmailScheduleMutation,
  useSearchUsersQuery,
} = autoEmailSlice;
