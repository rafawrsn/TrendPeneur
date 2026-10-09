import type {
  Analysis,
  AnalysisQuota,
  AnalysisResult,
  AppNotification,
  AuthResult,
  Category,
  PaymentRequest,
  Product,
  Subscription,
  TrendRange,
  TrendSeries,
  TrendingProduct,
  User,
} from './types';

export interface CreatePaymentInput {
  planCode: string;
}

export interface UploadProofInput {
  paymentId: string;
  fileUri: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  note?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CapitalInput {
  capitalBand: string;
  businessMode?: string;
  timeCommitment?: string;
  experience?: string;
}

export interface RatingInput {
  rating: number;
  comment?: string;
}

export interface TrendPreneurService {
  // Public
  getCategories(): Promise<Category[]>;
  getTrendingProducts(category?: string, limit?: number): Promise<TrendingProduct[]>;
  searchProducts(q: string, category?: string): Promise<Product[]>;
  suggestProducts(q: string): Promise<Product[]>;
  getProduct(slug: string): Promise<Product>;
  getTrend(slug: string, range: TrendRange): Promise<TrendSeries>;
  submitProductSuggestion(name: string): Promise<void>;

  // Auth
  register(input: RegisterInput): Promise<{ needsVerification: true; email: string }>;
  verifyEmail(email: string, code: string): Promise<AuthResult>;
  resendVerification(email: string): Promise<void>;
  login(input: LoginInput): Promise<AuthResult>;
  refreshTokens(refreshToken: string): Promise<AuthResult>;
  logout(): Promise<void>;
  forgotPassword(email: string): Promise<void>;

  // Account
  getMe(): Promise<User>;
  updateCapital(input: CapitalInput): Promise<User>;
  deleteAccount(): Promise<void>;
  getNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string): Promise<void>;

  // Subscription
  getSubscription(): Promise<Subscription>;
  getAiQuota(): Promise<AnalysisQuota>;

  // Payments
  createPayment(input: CreatePaymentInput): Promise<PaymentRequest>;
  getActivePayment(): Promise<PaymentRequest | null>;
  getPayments(): Promise<PaymentRequest[]>;
  getPayment(id: string): Promise<PaymentRequest>;
  uploadProof(input: UploadProofInput): Promise<PaymentRequest>;
  cancelPayment(id: string): Promise<void>;

  // Dev admin (mock mode)
  devApprovePayment(id: string): Promise<PaymentRequest>;
  devRejectPayment(id: string, reasonCode: string, reasonText?: string): Promise<PaymentRequest>;

  // Analyses
  createAnalysis(productSlug: string): Promise<{
    id: string;
    status: string;
    pollAfterMs: number;
    quotaRemaining: number;
    quotaResetAt: string;
  }>;
  getAnalysis(id: string): Promise<Analysis>;
  getAnalyses(): Promise<Analysis[]>;
  deleteAnalysis(id: string): Promise<void>;
  rateAnalysis(id: string, input: RatingInput): Promise<Analysis>;
}
