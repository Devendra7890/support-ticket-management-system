import { z } from 'zod';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_VALUES,
  TICKET_STATUS_VALUES,
} from '../constants/ticket.js';
import { emptyToUndefined } from '../utils/queryNormalize.js';

const titleSchema = z
  .string({ error: 'Title is required' })
  .trim()
  .min(3, 'Title must be at least 3 characters')
  .max(200, 'Title cannot exceed 200 characters');

const descriptionSchema = z
  .string({ error: 'Description is required' })
  .trim()
  .min(10, 'Description must be at least 10 characters')
  .max(5000, 'Description cannot exceed 5000 characters');

const categorySchema = z
  .string({ error: 'Category is required' })
  .trim()
  .min(1, 'Category is required')
  .max(100, 'Category cannot exceed 100 characters');

const prioritySchema = z.enum(TICKET_PRIORITY_VALUES, {
  error: 'Priority must be LOW, MEDIUM, HIGH, or URGENT',
});

export const createTicketSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    category: categorySchema,
    priority: prioritySchema.optional().default(TICKET_PRIORITIES.MEDIUM),
  })
  .strict();

export const updateTicketSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    category: categorySchema.optional(),
    priority: prioritySchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one valid field (title, description, category, priority) must be provided.',
  });

export const listTicketsQuerySchema = z
  .object({
    status: z.preprocess(
      emptyToUndefined,
      z
        .enum(TICKET_STATUS_VALUES, {
          error: 'Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED',
        })
        .optional()
    ),
    priority: z.preprocess(emptyToUndefined, prioritySchema.optional()),
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
    sortBy: z.enum(['createdAt', 'updatedAt'], {
      error: 'sortBy must be createdAt or updatedAt',
    }).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc'], {
      error: 'sortOrder must be asc or desc',
    }).default('desc'),
  })
  .strict();
