/**
 * Zod validation schemas for API responses
 * Ensures type safety at runtime
 */
import { z } from 'zod';

/**
 * User types enum
 */
export const UserTypeSchema = z.enum(['STUDENT', 'PROFESSOR', 'EXTERNAL', 'ADMIN_BDE', 'ADMIN_PROF']);

/**
 * User schema
 */
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  type: UserTypeSchema,
  studentGroup: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserType = z.infer<typeof UserSchema>;

/**
 * Auth response schema
 */
export const AuthResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: UserSchema,
});

export type AuthResponseType = z.infer<typeof AuthResponseSchema>;

/**
 * Get me response schema
 */
export const GetMeResponseSchema = z.object({
  user: UserSchema,
});

/**
 * Generic message response schema
 */
export const MessageResponseSchema = z.object({
  message: z.string(),
});

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

/**
 * Helper to validate API response
 */
export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn('API response validation failed:', result.error.format());
    // In development, throw; in production, return data as-is (graceful degradation)
    if (import.meta.env.DEV) {
      throw new Error(`API response validation failed: ${result.error.message}`);
    }
  }
  return data as T;
}

/**
 * Safe parse helper that returns undefined on failure
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | undefined {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return undefined;
}
