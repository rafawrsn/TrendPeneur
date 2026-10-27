import type { TrendPreneurService } from './service';
import {
  type Analysis,
  type AnalysisQuota,
  type AnalysisResult,
  type AppNotification,
  type AuthResult,
  type Category,
  type PaymentRequest,
  type Product,
  type Subscription,
  type TrendRange,
  type TrendSeries,
  type TrendingProduct,
  type User,
  AnalysisResultSchema,
} from './types';
import { ApiError } from './errors';
import {
  CATEGORIES,
} from '../mock/categories';
import { getProductSeeds, TREND_SOURCE_MAP } from '../mock/products';
import {
  generateSeries,
  computeSummary,
  sliceByRange,
  computeMomentum,
  computeSparkline,
  computeSignals,
} from '../mock/seriesGenerator';
import { MockAnalysisProvider } from '../mock/analyzer';
import {
  loadState,
  getState,
  setState,
  resetQuotaIfNeeded,
  getCurrentUser,
  toUser,
  makeAuthResult,
  generateId,
  type MockUserRecord,
} from '../mock/store';
import { PLAN, AI_DAILY_QUOTA, PAYMENT_EXPIRY_HOURS, MAX_REUPLOADS, PROOF_MAX_BYTES } from '../config/plan';
import { getCapitalBandLabel } from '../config/constants';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 400));
}

function allProducts(): Product[] {
  return getProductSeeds();
}

function findProduct(slug: string): Product {
  const p = allProducts().find((p) => p.slug === slug);
  if (!p) throw new ApiError('NOT_FOUND', 'Produk tidak ditemukan.');
  return p;
}

export class MockTrendPreneurService implements TrendPreneurService {
  private analyzer = new MockAnalysisProvider();

  constructor() {
    loadState();
  }

  // ---------- Public ----------
  async getCategories(): Promise<Category[]> {
    await delay(200);
    return CATEGORIES;
  }

  async getTrendingProducts(category?: string, limit = 10): Promise<TrendingProduct[]> {
    await delay(400);
    let products = allProducts();
    if (category && category !== 'semua') {
      products = products.filter((p) => p.category === category);
    }
    const trending = products.map((p) => {
      const points = generateSeries(p.slug, p.archetype as any, 120);
      const momentum = computeMomentum(points);
      const summary = computeSummary(points);
      const sparkline = computeSparkline(points);
      return {
        product: p,
        sparkline,
        momentum,
        direction: summary.direction,
        dataUpdatedAt: new Date().toISOString(),
      };
    });
    trending.sort((a, b) => b.momentum - a.momentum);
    return trending.slice(0, limit);
  }

  async searchProducts(q: string, category?: string): Promise<Product[]> {
    await delay(300);
    const ql = q.toLowerCase();
    let results = allProducts().filter((p) => p.name.toLowerCase().includes(ql));
    if (category && category !== 'semua') {
      results = results.filter((p) => p.category === category);
    }
    return results;
  }

  async suggestProducts(q: string): Promise<Product[]> {
    await delay(200);
    if (q.length < 2) return [];
    const ql = q.toLowerCase();
    return allProducts()
      .filter((p) => p.name.toLowerCase().includes(ql))
      .slice(0, 8);
  }

  async getProduct(slug: string): Promise<Product> {
    await delay(200);
    return findProduct(slug);
  }

  async getTrend(slug: string, range: TrendRange): Promise<TrendSeries> {
    await delay(400);
    const product = findProduct(slug);
    const allPoints = generateSeries(slug, product.archetype as any, 120);
    const points = sliceByRange(allPoints, range);
    const summary = computeSummary(points);
    const sources = product.sources.map((code) => ({
      code,
      name: TREND_SOURCE_MAP[code] ?? code,
    }));
    return {
      product,
      range,
      points,
      summary,
      sources,
      partial: product.partial,
      dataUpdatedAt: new Date().toISOString(),
    };
  }

  async submitProductSuggestion(name: string): Promise<void> {
    await delay(300);
    // Just accept it
  }

  // ---------- Auth ----------
  async register(input: { name: string; email: string; password: string }): Promise<{ needsVerification: true; email: string }> {
    await delay(400);
    const s = getState();
    const existing = s.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) throw new ApiError('CONFLICT', 'Email sudah terdaftar.');
    const rec: MockUserRecord = {
      id: generateId('usr'),
      name: input.name,
      email: input.email,
      passwordHash: input.password,
      emailVerified: false,
      capitalBand: null,
      businessMode: null,
      timeCommitment: null,
      experience: null,
      isPremium: false,
      premiumStartAt: null,
      premiumEndsAt: null,
      lockedUntil: null,
      failedAttempts: 0,
      refreshToken: null,
    };
    s.users.push(rec);
    setState(() => {});
    return { needsVerification: true, email: input.email };
  }

  async verifyEmail(email: string, code: string): Promise<AuthResult> {
    await delay(400);
    if (code !== '123456') throw new ApiError('VALIDATION_ERROR', 'Kode OTP salah. Kode demo: 123456');
    const s = getState();
    const rec = s.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!rec) throw new ApiError('NOT_FOUND', 'Akun tidak ditemukan.');
    rec.emailVerified = true;
    s.currentUserId = rec.id;
    const result = makeAuthResult(rec);
    setState(() => {});
    return result;
  }

  async resendVerification(_email: string): Promise<void> {
    await delay(300);
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    await delay(400);
    const s = getState();
    const rec = s.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (!rec) throw new ApiError('UNAUTHENTICATED', 'Email atau password salah.');
    if (rec.lockedUntil && new Date(rec.lockedUntil) > new Date()) {
      throw new ApiError('ACCOUNT_LOCKED');
    }
    if (rec.passwordHash !== input.password) {
      rec.failedAttempts++;
      if (rec.failedAttempts >= 5) {
        rec.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        rec.failedAttempts = 0;
        setState(() => {});
        throw new ApiError('ACCOUNT_LOCKED');
      }
      setState(() => {});
      throw new ApiError('UNAUTHENTICATED', 'Email atau password salah.');
    }
    rec.failedAttempts = 0;
    rec.lockedUntil = null;
    if (!rec.emailVerified) throw new ApiError('UNAUTHENTICATED', 'Email belum diverifikasi.');
    s.currentUserId = rec.id;
    const result = makeAuthResult(rec);
    setState(() => {});
    return result;
  }

  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    await delay(200);
    const s = getState();
    const rec = s.users.find((u) => u.refreshToken === refreshToken);
    if (!rec) throw new ApiError('TOKEN_EXPIRED');
    s.currentUserId = rec.id;
    const result = makeAuthResult(rec);
    setState(() => {});
    return result;
  }

  async logout(): Promise<void> {
    await delay(100);
    const s = getState();
    const rec = s.users.find((u) => u.id === s.currentUserId);
    if (rec) rec.refreshToken = null;
    s.currentUserId = null;
    s.accessToken = null;
    setState(() => {});
  }

  async forgotPassword(_email: string): Promise<void> {
    await delay(300);
    // Always neutral
  }

  // ---------- Account ----------
  async getMe(): Promise<User> {
    await delay(200);
    const rec = getCurrentUser();
    if (!rec) throw new ApiError('UNAUTHENTICATED');
    return toUser(rec);
  }

  async updateCapital(input: {
    capitalBand: string;
    businessMode?: string;
    timeCommitment?: string;
    experience?: string;
  }): Promise<User> {
    await delay(300);
    const rec = getCurrentUser();
    if (!rec) throw new ApiError('UNAUTHENTICATED');
    rec.capitalBand = input.capitalBand;
    rec.businessMode = input.businessMode ?? null;
    rec.timeCommitment = input.timeCommitment ?? null;
    rec.experience = input.experience ?? null;
    setState(() => {});
    return toUser(rec);
  }

  async deleteAccount(): Promise<void> {
    await delay(300);
    const s = getState();
    const rec = getCurrentUser();
    if (!rec) throw new ApiError('UNAUTHENTICATED');
    s.users = s.users.filter((u) => u.id !== rec.id);
    s.currentUserId = null;
    s.accessToken = null;
    s.payments = s.payments.filter((p) => p.userId !== rec.id);
    s.analyses = s.analyses.filter((a) => a.userId !== rec.id);
    s.notifications = s.notifications.filter((n) => n.userId !== rec.id);
    setState(() => {});
  }

  async getNotifications(): Promise<AppNotification[]> {
    await delay(200);
    const rec = getCurrentUser();
    if (!rec) return [];
    const s = getState();
    return s.notifications
      .filter((n) => n.userId === rec.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationRead(id: string): Promise<void> {
    await delay(100);
    const s = getState();
    const n = s.notifications.find((n) => n.id === id);
    if (n) n.read = true;
    setState(() => {});
  }

  // ---------- Subscription ----------
  async getSubscription(): Promise<Subscription> {
    await delay(200);
    const rec = getCurrentUser();
    if (!rec) return { status: 'none', startAt: null, endAt: null, planCode: null };
    const now = new Date();
    if (rec.isPremium && rec.premiumEndsAt && new Date(rec.premiumEndsAt) > now) {
      return { status: 'active', startAt: rec.premiumStartAt, endAt: rec.premiumEndsAt, planCode: PLAN.code };
    }
    if (rec.isPremium && rec.premiumEndsAt && new Date(rec.premiumEndsAt) <= now) {
      return { status: 'expired', startAt: rec.premiumStartAt, endAt: rec.premiumEndsAt, planCode: PLAN.code };
    }
    return { status: 'none', startAt: null, endAt: null, planCode: null };
  }

  async getAiQuota(): Promise<AnalysisQuota> {
    await delay(200);
    resetQuotaIfNeeded();
    const s = getState();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return {
      remaining: Math.max(0, AI_DAILY_QUOTA - s.quotaUsedToday),
      resetAt: tomorrow.toISOString(),
    };
  }

  // ---------- Payments ----------
  async createPayment(input: { planCode: string }): Promise<PaymentRequest> {
    await delay(400);
    const rec = getCurrentUser();
    if (!rec) throw new ApiError('UNAUTHENTICATED');

    const s = getState();
    // Check for existing active request
    const activeStatuss = ['PENDING_PAYMENT', 'PENDING_VERIFICATION'];
    const existing = s.payments.find(
      (p) => p.userId === rec.id && activeStatuss.includes(p.status),
    );
    if (existing) {
      // Check expiry
      if (existing.status === 'PENDING_PAYMENT' && new Date(existing.expiresAt) < new Date()) {
        existing.status = 'EXPIRED';
      } else {
        return existing;
      }
    }

    const activeRequests = s.payments.filter((p) =>
      ['PENDING_PAYMENT', 'PENDING_VERIFICATION'].includes(p.status) && p.amountBase === PLAN.priceIdr
    );
    const usedCodes = new Set(activeRequests.map((p) => p.uniqueCode));
    let uniqueCode = Math.floor(Math.random() * 900) + 100;
    while (usedCodes.has(uniqueCode) && usedCodes.size < 900) {
      uniqueCode = Math.floor(Math.random() * 900) + 100;
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);

    const payment: PaymentRequest & { userId: string } = {
      id: generateId('pay'),
      userId: rec.id,
      status: 'PENDING_PAYMENT',
      planCode: input.planCode,
      amountBase: PLAN.priceIdr,
      uniqueCode,
      amountTotal: PLAN.priceIdr + uniqueCode,
      expiresAt: expiresAt.toISOString(),
      qrisImageUrl: 'mock://qris-placeholder',
      proofUrl: null,
      proofNote: null,
      rejectReasonCode: null,
      rejectReasonText: null,
      createdAt: now.toISOString(),
      decidedAt: null,
      reuploadCount: 0,
    };
    s.payments.push(payment);
    setState(() => {});
    return payment;
  }

  async getActivePayment(): Promise<PaymentRequest | null> {
    await delay(200);
    const rec = getCurrentUser();
    if (!rec) return null;
    const s = getState();
    const active = s.payments.find(
      (p) => p.userId === rec.id && ['PENDING_PAYMENT', 'PENDING_VERIFICATION'].includes(p.status),
    );
    if (!active) return null;
    if (active.status === 'PENDING_PAYMENT' && new Date(active.expiresAt) < new Date()) {
      active.status = 'EXPIRED';
      setState(() => {});
      return null;
    }
    return active;
  }

  async getPayments(): Promise<PaymentRequest[]> {
    await delay(200);
    const rec = getCurrentUser();
    if (!rec) return [];
    const s = getState();
    return s.payments
      .filter((p) => p.userId === rec.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(({ userId, ...p }) => p);
  }

  async getPayment(id: string): Promise<PaymentRequest> {
    await delay(200);
    const s = getState();
    const p = s.payments.find((p) => p.id === id);
    if (!p) throw new ApiError('NOT_FOUND', 'Pembayaran tidak ditemukan.');
    const { userId, ...rest } = p;
    return rest;
  }

  async uploadProof(input: {
    paymentId: string;
    fileUri: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    note?: string;
  }): Promise<PaymentRequest> {
    await delay(600);
    const rec = getCurrentUser();
    if (!rec) throw new ApiError('UNAUTHENTICATED');
    const s = getState();
    const p = s.payments.find((p) => p.id === input.paymentId && p.userId === rec.id);
    if (!p) throw new ApiError('NOT_FOUND', 'Pembayaran tidak ditemukan.');

    if (p.status !== 'PENDING_PAYMENT' && p.status !== 'REJECTED') {
      throw new ApiError('INVALID_STATE_TRANSITION', 'Bukti hanya bisa diunggah untuk pembayaran yang masih menunggu.');
    }
    if (p.status === 'REJECTED' && p.reuploadCount >= MAX_REUPLOADS) {
      throw new ApiError('INVALID_STATE_TRANSITION', 'Maksimal unggah ulang telah tercapai. Buat permintaan baru.');
    }

    if (input.fileSize > PROOF_MAX_BYTES) throw new ApiError('FILE_TOO_LARGE');
    const ext = input.fileName.split('.').pop()?.toLowerCase() ?? '';
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) throw new ApiError('UNSUPPORTED_MEDIA');

    // Check duplicate hash (mock: use fileUri as hash)
    const hash = input.fileUri;
    if (s.proofHashes.includes(hash)) throw new ApiError('PROOF_DUPLICATE');
    s.proofHashes.push(hash);

    p.proofUrl = input.fileUri;
    p.proofNote = input.note ?? null;
    p.status = 'PENDING_VERIFICATION';
    if (p.rejectReasonCode) {
      p.reuploadCount++;
    }
    p.rejectReasonCode = null;
    p.rejectReasonText = null;
    setState(() => {});

    // Auto-generate notification
    this.addNotification(rec.id, 'payment_pending', 'Bukti Pembayaran Diterima', 'Bukti pembayaran kamu sedang diverifikasi. Estimasi proses 1×24 jam kerja.');

    return p;
  }

  async cancelPayment(id: string): Promise<void> {
    await delay(300);
    const rec = getCurrentUser();
    if (!rec) throw new ApiError('UNAUTHENTICATED');
    const s = getState();
    const p = s.payments.find((p) => p.id === id && p.userId === rec.id);
    if (!p) throw new ApiError('NOT_FOUND', 'Pembayaran tidak ditemukan.');
    if (!['PENDING_PAYMENT', 'PENDING_VERIFICATION'].includes(p.status)) {
      throw new ApiError('INVALID_STATE_TRANSITION', 'Pembayaran ini tidak dapat dibatalkan.');
    }
    p.status = 'CANCELLED';
    setState(() => {});
  }

  // ---------- Dev Admin ----------
  async devApprovePayment(id: string): Promise<PaymentRequest> {
    await delay(300);
    const s = getState();
    const p = s.payments.find((p) => p.id === id);
    if (!p) throw new ApiError('NOT_FOUND', 'Pembayaran tidak ditemukan.');
    if (p.status !== 'PENDING_VERIFICATION') {
      throw new ApiError('INVALID_STATE_TRANSITION', 'Hanya pembayaran menunggu verifikasi yang bisa disetujui.');
    }
    p.status = 'APPROVED';
    p.decidedAt = new Date().toISOString();

    // Activate premium
    const rec = s.users.find((u) => u.id === p.userId);
    if (rec) {
      const now = new Date();
      const currentEnd = rec.premiumEndsAt && new Date(rec.premiumEndsAt) > now ? new Date(rec.premiumEndsAt) : now;
      const newEnd = new Date(currentEnd.getTime() + PLAN.durationDays * 24 * 60 * 60 * 1000);
      rec.isPremium = true;
      rec.premiumStartAt = now.toISOString();
      rec.premiumEndsAt = newEnd.toISOString();
    }
    setState(() => {});

    this.addNotification(p.userId, 'payment_approved', 'Premium Aktif!', 'Pembayaran kamu telah diverifikasi. Premium aktif sekarang.');

    const { userId, ...rest } = p;
    return rest;
  }

  async devRejectPayment(id: string, reasonCode: string, reasonText?: string): Promise<PaymentRequest> {
    await delay(300);
    const s = getState();
    const p = s.payments.find((p) => p.id === id);
    if (!p) throw new ApiError('NOT_FOUND', 'Pembayaran tidak ditemukan.');
    if (p.status !== 'PENDING_VERIFICATION') {
      throw new ApiError('INVALID_STATE_TRANSITION', 'Hanya pembayaran menunggu verifikasi yang bisa ditolak.');
    }
    p.status = 'REJECTED';
    p.decidedAt = new Date().toISOString();
    p.rejectReasonCode = reasonCode;
    p.rejectReasonText = reasonText ?? null;
    setState(() => {});

    const reasonMessages: Record<string, string> = {
      NOMINAL_TIDAK_SESUAI: 'Nominal pembayaran tidak sesuai dengan tagihan.',
      BUKTI_TIDAK_JELAS: 'Bukti pembayaran tidak jelas atau tidak terbaca.',
      BUKTI_DUPLIKAT: 'Bukti pembayaran sudah pernah digunakan.',
      LAINNYA: reasonText ?? 'Pembayaran ditolak.',
    };
    this.addNotification(p.userId, 'payment_rejected', 'Pembayaran Ditolak', reasonMessages[reasonCode] ?? 'Pembayaran ditolak.');

    const { userId, ...rest } = p;
    return rest;
  }

  // ---------- Analyses ----------
  async createAnalysis(productSlug: string): Promise<{
    id: string;
    status: string;
    pollAfterMs: number;
    quotaRemaining: number;
    quotaResetAt: string;
  }> {
    await delay(300);
    const rec = getCurrentUser();
    if (!rec) throw new ApiError('UNAUTHENTICATED');
    const product = findProduct(productSlug);

    const now = new Date();
    if (!rec.isPremium || !rec.premiumEndsAt || new Date(rec.premiumEndsAt) <= now) {
      throw new ApiError('PREMIUM_REQUIRED');
    }
    if (!rec.capitalBand) throw new ApiError('CAPITAL_REQUIRED');

    resetQuotaIfNeeded();
    const s = getState();
    if (s.quotaUsedToday >= AI_DAILY_QUOTA) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      throw new ApiError('QUOTA_EXCEEDED', undefined, { resetAt: tomorrow.toISOString() });
    }

    // Check cache
    const cached = s.analyses.find(
      (a) => a.userId === rec.id && a.productSlug === productSlug && a.capitalBand === rec.capitalBand && a.status === 'COMPLETED',
    );
    if (cached) {
      cached.servedFromCache = true;
      setState(() => {});
      const quota = await this.getAiQuota();
      return {
        id: cached.id,
        status: 'COMPLETED',
        pollAfterMs: 0,
        quotaRemaining: quota.remaining,
        quotaResetAt: quota.resetAt,
      };
    }

    const id = generateId('ana');
    const analysis: Analysis & { userId: string } = {
      id,
      userId: rec.id,
      productId: product.slug,
      productSlug: product.slug,
      productName: product.name,
      status: 'QUEUED',
      result: null,
      capitalBand: rec.capitalBand,
      capitalLabel: getCapitalBandLabel(rec.capitalBand),
      error: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      servedFromCache: false,
      rating: null,
      ratingComment: null,
    };
    s.analyses.push(analysis);
    setState(() => {});

    // Simulate async processing
    this.processAnalysis(id, product, rec);

    const quota = await this.getAiQuota();
    return {
      id,
      status: 'QUEUED',
      pollAfterMs: 2000,
      quotaRemaining: quota.remaining,
      quotaResetAt: quota.resetAt,
    };
  }

  private async processAnalysis(id: string, product: Product, rec: MockUserRecord): Promise<void> {
    // Simulate processing time 6-10 seconds
    const processingTime = 6000 + Math.random() * 4000;

    setTimeout(async () => {
      const s = getState();
      const analysis = s.analyses.find((a) => a.id === id);
      if (!analysis) return;

      // Check dev toggle for simulated failure
      const simFail = await import('../stores/ui').then((m) => m.useUiStore.getState().simulateAiFailure).catch(() => false);

      analysis.status = 'RUNNING';
      setState(() => {});

      setTimeout(async () => {
        const s2 = getState();
        const a2 = s2.analyses.find((a) => a.id === id);
        if (!a2) return;

        if (simFail) {
          a2.status = 'FAILED';
          a2.error = 'Analisis belum berhasil. Kuotamu tidak terpotong.';
          a2.completedAt = new Date().toISOString();
          setState(() => {});
          return;
        }

        try {
          const points = generateSeries(product.slug, product.archetype as any, 120);
          const signals = computeSignals(points);
          const rawResult = await this.analyzer.analyze({
            product,
            signals,
            capitalBand: rec.capitalBand,
            businessMode: rec.businessMode,
            timeCommitment: rec.timeCommitment,
            experience: rec.experience,
          });
          const result = AnalysisResultSchema.parse(rawResult);
          a2.status = 'COMPLETED';
          a2.result = result;
          a2.completedAt = new Date().toISOString();
          resetQuotaIfNeeded();
          s2.quotaUsedToday++;
          setState(() => {});
        } catch {
          a2.status = 'FAILED';
          a2.error = 'Analisis belum berhasil. Kuotamu tidak terpotong.';
          a2.completedAt = new Date().toISOString();
          setState(() => {});
        }
      }, processingTime);
    }, 500);
  }

  async getAnalysis(id: string): Promise<Analysis> {
    await delay(200);
    const s = getState();
    const a = s.analyses.find((a) => a.id === id);
    if (!a) throw new ApiError('NOT_FOUND', 'Analisis tidak ditemukan.');
    const { userId, ...rest } = a;
    return rest;
  }

  async getAnalyses(): Promise<Analysis[]> {
    await delay(200);
    const rec = getCurrentUser();
    if (!rec) return [];
    const s = getState();
    return s.analyses
      .filter((a) => a.userId === rec.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(({ userId, ...rest }) => rest);
  }

  async deleteAnalysis(id: string): Promise<void> {
    await delay(200);
    const rec = getCurrentUser();
    if (!rec) throw new ApiError('UNAUTHENTICATED');
    const s = getState();
    s.analyses = s.analyses.filter((a) => a.id !== id || a.userId !== rec.id);
    setState(() => {});
  }

  async rateAnalysis(id: string, input: { rating: number; comment?: string }): Promise<Analysis> {
    await delay(200);
    const s = getState();
    const a = s.analyses.find((a) => a.id === id);
    if (!a) throw new ApiError('NOT_FOUND', 'Analisis tidak ditemukan.');
    a.rating = input.rating;
    a.ratingComment = input.comment ?? null;
    setState(() => {});
    const { userId, ...rest } = a;
    return rest;
  }

  // ---------- Helper ----------
  private addNotification(userId: string, type: string, title: string, body: string): void {
    const s = getState();
    s.notifications.push({
      id: generateId('ntf'),
      userId,
      type,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    });
    setState(() => {});
  }
}
