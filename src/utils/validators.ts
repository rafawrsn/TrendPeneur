import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
  .regex(/[0-9]/, 'Password harus mengandung angka');

export const emailSchema = z.string().email('Format email tidak valid');

export const nameSchema = z.string().min(2, 'Nama minimal 2 karakter');

export const otpSchema = z
  .string()
  .length(6, 'Kode OTP harus 6 digit')
  .regex(/^\d{6}$/, 'Kode OTP harus berupa angka');

export const noteSchema = z.string().max(300, 'Catatan maksimal 300 karakter');

export const commentSchema = z.string().max(500, 'Komentar maksimal 500 karakter');
