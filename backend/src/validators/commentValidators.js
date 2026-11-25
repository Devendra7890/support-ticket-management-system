import { z } from 'zod';

export const createCommentSchema = z
  .object({
    message: z
      .string({ error: 'Message is required' })
      .trim()
      .min(1, 'Comment message cannot be empty')
      .max(2000, 'Comment message cannot exceed 2000 characters'),
  })
  .strict();

export const listCommentsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, 'page must be at least 1').default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'limit must be at least 1')
      .max(100, 'limit cannot exceed 100')
      .default(20),
  })
  .strict();
