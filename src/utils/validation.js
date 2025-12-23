/**
 * Input validation utilities
 * Uses Zod (already in your dependencies)
 */
import { z } from 'zod';

// Schemas for different forms
export const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Select a category'),
  description: z.string().optional()
});

export const habitSchema = z.object({
  name: z.string().min(3, 'Habit name must be at least 3 characters'),
  category: z.string().min(1, 'Select a category'),
  frequency: z.string().min(1, 'Select a frequency')
});

export const goalSchema = z.object({
  title: z.string().min(3, 'Goal title must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Select a category'),
  targetValue: z.number().positive('Target must be positive'),
  deadline: z.string().optional()
});

export const moodSchema = z.object({
  mood: z.number().min(1).max(10),
  factors: z.array(z.string()).optional(),
  journal: z.string().optional()
});

/**
 * Validate form data against schema
 */
export const validateFormData = (data, schema) => {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.reduce((acc, err) => {
        const field = err.path[0];
        acc[field] = err.message;
        return acc;
      }, {});
      return { valid: false, data: null, error: fieldErrors };
    }
    return { valid: false, data: null, error: { general: error.message } };
  }
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 500); // Limit length
};