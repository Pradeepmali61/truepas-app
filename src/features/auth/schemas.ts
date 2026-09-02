import { z } from 'zod';

/** Input validation at the trust boundary (OWASP A03 — injection defense in depth). */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Enter your email or mobile number')
    .max(254, 'Too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Too long'),
});

export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[0-9()\-\s+]{7,17}$/, 'Enter a valid phone number'),
});

export const accountDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your full name')
    .max(100, 'Too long')
    .regex(/^[\p{L}\s.'-]+$/u, 'Name contains invalid characters'),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\s*\/\s*(0[1-9]|[12][0-9]|3[01])\s*\/\s*(19|20)\d{2}$/, 'Use MM / DD / YYYY'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .max(254, 'Too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Too long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginForm = z.infer<typeof loginSchema>;
export type PhoneForm = z.infer<typeof phoneSchema>;
export type AccountDetailsForm = z.infer<typeof accountDetailsSchema>;
