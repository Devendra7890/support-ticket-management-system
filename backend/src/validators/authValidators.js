import { z } from 'zod';

const passwordSchema = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z
  .object({
    name: z
      .string({ error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .max(255, 'Email cannot exceed 255 characters')
      .transform((value) => value.toLowerCase()),
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string({ error: 'Email is required' })
      .trim()
      .email('Please provide a valid email address')
      .transform((value) => value.toLowerCase()),
    password: z
      .string({ error: 'Password is required' })
      .min(1, 'Password is required'),
  })
  .strict();
