import { z } from 'zod';
import mongoose from 'mongoose';
import {
  TICKET_PRIORITY_VALUES,
  TICKET_STATUS_VALUES,
} from '../constants/ticket.js';
import { emptyToUndefined } from '../utils/queryNormalize.js';

const objectIdSchema = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: 'createdBy must be a valid MongoDB ObjectId',
  });

const prioritySchema = z.enum(TICKET_PRIORITY_VALUES, {
  error: 'Priority must be LOW, MEDIUM, HIGH, or URGENT',
});

const statusSchema = z.enum(TICKET_STATUS_VALUES, {
  error: 'Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED',
});

export const adminListTicketsQuerySchema = z
  .object({
    status: z.preprocess(emptyToUndefined, statusSchema.optional()),
    priority: z.preprocess(emptyToUndefined, prioritySchema.optional()),
    category: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .min(1, 'category cannot be empty')
        .max(100, 'category cannot exceed 100 characters')
        .optional()
    ),
    createdBy: z.preprocess(emptyToUndefined, objectIdSchema.optional()),
    search: z.preprocess(
      emptyToUndefined,
      z.string().trim().max(200, 'Search query is too long').optional()
    ),
    page: z.coerce.number().int().min(1, 'page must be at least 1').default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'limit must be at least 1')
      .max(100, 'limit cannot exceed 100')
      .default(10),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'priority', 'status'], {
        error: 'sortBy must be createdAt, updatedAt, priority, or status',
      })
      .default('createdAt'),
    sortOrder: z
      .enum(['asc', 'desc'], {
        error: 'sortOrder must be asc or desc',
      })
      .default('desc'),
  })
  .strict();

export const adminUpdateStatusSchema = z
  .object({
    status: statusSchema,
  })
  .strict();

export const adminUpdatePrioritySchema = z
  .object({
    priority: prioritySchema,
  })
  .strict();
