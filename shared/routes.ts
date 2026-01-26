
import { z } from 'zod';
import { insertFormSchema, insertJobSchema, forms, jobs, jobRows } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  forms: {
    analyze: {
      method: 'POST' as const,
      path: '/api/forms/analyze',
      input: z.object({ url: z.string().url() }),
      responses: {
        200: z.custom<typeof forms.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/forms',
      responses: {
        200: z.array(z.custom<typeof forms.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/forms/:id',
      responses: {
        200: z.custom<typeof forms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  jobs: {
    create: {
      method: 'POST' as const,
      path: '/api/jobs',
      input: z.object({
        formId: z.number(),
        filename: z.string(),
        rows: z.array(z.record(z.any()))
      }),
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/jobs',
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/jobs/:id',
      responses: {
        200: z.object({
          job: z.custom<typeof jobs.$inferSelect>(),
          rows: z.array(z.custom<typeof jobRows.$inferSelect>())
        }),
        404: errorSchemas.notFound,
      },
    },
    process: {
      method: 'POST' as const,
      path: '/api/jobs/:id/process',
      input: z.object({ batchSize: z.number().default(5) }),
      responses: {
        200: z.object({
          processed: z.number(),
          remaining: z.number(),
          jobStatus: z.string()
        }),
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
