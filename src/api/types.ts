import { z } from 'zod';

// ---------- Categories ----------
export const CategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  icon: z.string().optional(),
});
export type Category = z.infer<typeof CategorySchema>;

// ---------- Products ----------
export const ProductSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  archetype: z.string(),
  sources: z.array(z.string()),
  partial: z.boolean().default(false),
  typicalCapitalMin: z.number(),
  typicalCapitalMax: z.number(),
});
export type Product = z.infer<typeof ProductSchema>;

// ---------- Trend ----------
export const TrendRangeSchema = z.enum(['1y', '3y', '5y', 'max']);
export type TrendRange = z.infer<typeof TrendRangeSchema>;

export const TrendPointSchema = z.object({
  period: z.string(),
  value: z.number(),
});
export type TrendPoint = z.infer<typeof TrendPointSchema>;

export const TrendSummarySchema = z.object({
  direction: z.enum(['naik', 'stabil', 'turun']),
  peak: z.object({ period: z.string(), value: z.number() }),
  low: z.object({ period: z.string(), value: z.number() }),
  seasonal: z.boolean(),
});
export type TrendSummary = z.infer<typeof TrendSummarySchema>;

export const TrendSourceSchema = z.object({
  code: z.string(),
  name: z.string(),
});
export type TrendSource = z.infer<typeof TrendSourceSchema>;

export const TrendSeriesSchema = z.object({
  product: ProductSchema,
  range: z.string(),
  points: z.array(TrendPointSchema),
  summary: TrendSummarySchema,
  sources: z.array(TrendSourceSchema),
  partial: z.boolean(),
  dataUpdatedAt: z.string(),
});
export type TrendSeries = z.infer<typeof TrendSeriesSchema>;

// ---------- User ----------
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  capitalBand: z.string().nullable(),
  businessMode: z.string().nullable().optional(),
  timeCommitment: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  isPremium: z.boolean(),
  premiumEndsAt: z.string().nullable(),
  emailVerified: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const AuthResultSchema = z.object({
  accessToken: z.string(),
  accessExpiresIn: z.number(),
  refreshToken: z.string(),
  refreshExpiresIn: z.number(),
  user: UserSchema,
});
export type AuthResult = z.infer<typeof AuthResultSchema>;

// ---------- Subscription ----------
export const SubscriptionSchema = z.object({
  status: z.enum(['none', 'active', 'expired']),
  startAt: z.string().nullable(),
  endAt: z.string().nullable(),
  planCode: z.string().nullable(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

// ---------- Payments ----------
export const PaymentStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'PENDING_VERIFICATION',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentRequestSchema = z.object({
  id: z.string(),
  status: PaymentStatusSchema,
  planCode: z.string(),
  amountBase: z.number(),
  uniqueCode: z.number(),
  amountTotal: z.number(),
  expiresAt: z.string(),
  qrisImageUrl: z.string(),
  proofUrl: z.string().nullable(),
  proofNote: z.string().nullable(),
  rejectReasonCode: z.string().nullable(),
  rejectReasonText: z.string().nullable(),
  createdAt: z.string(),
  decidedAt: z.string().nullable(),
  reuploadCount: z.number().default(0),
});
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;

// ---------- Analysis ----------
export const OutlookItemSchema = z.object({
  horizonYears: z.number(),
  direction: z.enum(['naik', 'stabil', 'turun']),
  rationale: z.string(),
});
export type OutlookItem = z.infer<typeof OutlookItemSchema>;

export const CapitalFitSchema = z.object({
  level: z.enum(['sesuai', 'perlu_penyesuaian', 'kurang_sesuai']),
  estimatedStartCapitalIdr: z.object({ min: z.number(), max: z.number() }),
  assumptions: z.array(z.string()),
});
export type CapitalFit = z.infer<typeof CapitalFitSchema>;

export const AnalysisResultSchema = z.object({
  resilienceScore: z.number().int().min(0).max(100),
  resilienceLabel: z.enum(['rendah', 'sedang', 'tinggi', 'sangat_tinggi']),
  confidence: z.enum(['rendah', 'sedang', 'tinggi']),
  oneLineSummary: z.string(),
  outlook: z.array(OutlookItemSchema).length(4),
  drivers: z.array(z.string()),
  risks: z.array(z.string()),
  capitalFit: CapitalFitSchema,
  starterSteps: z.array(z.string()),
  dataLimitations: z.array(z.string()),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const AnalysisStatusSchema = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED']);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const AnalysisSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productSlug: z.string(),
  productName: z.string(),
  status: AnalysisStatusSchema,
  result: AnalysisResultSchema.nullable(),
  capitalBand: z.string(),
  capitalLabel: z.string(),
  error: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  servedFromCache: z.boolean().default(false),
  rating: z.number().min(0).max(5).nullable(),
  ratingComment: z.string().nullable(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const AnalysisQuotaSchema = z.object({
  remaining: z.number(),
  resetAt: z.string(),
});
export type AnalysisQuota = z.infer<typeof AnalysisQuotaSchema>;

// ---------- Notifications ----------
export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});
export type AppNotification = z.infer<typeof NotificationSchema>;

// ---------- Trending ----------
export const TrendingProductSchema = z.object({
  product: ProductSchema,
  sparkline: z.array(z.number()),
  momentum: z.number(),
  direction: z.enum(['naik', 'stabil', 'turun']),
  dataUpdatedAt: z.string(),
});
export type TrendingProduct = z.infer<typeof TrendingProductSchema>;
