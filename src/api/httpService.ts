import type { TrendPreneurService } from './service';
import type {
  Analysis,
  AnalysisQuota,
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
import { ApiError } from './errors';
import { API_URL } from '../config/env';

// HTTP service that calls the real backend.
// Token management is handled via the session store.
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (isAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // 401 → try refresh once
  if (res.status === 401 && isAuth && refreshToken) {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      accessToken = refreshData.data.access_token;
      refreshToken = refreshData.data.refresh_token;
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  const json = await res.json();
  if (!json.success) {
    const code = json.error?.code ?? 'INTERNAL_ERROR';
    throw new ApiError(code, json.error?.message, json.error?.details, res.status);
  }
  return json.data as T;
}

export class HttpTrendPreneurService implements TrendPreneurService {
  async getCategories(): Promise<Category[]> {
    return request('/categories', {}, false);
  }

  async getTrendingProducts(category?: string, limit?: number): Promise<TrendingProduct[]> {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (limit) params.set('limit', String(limit));
    return request(`/products/trending?${params}`, {}, false);
  }

  async searchProducts(q: string, category?: string): Promise<Product[]> {
    const params = new URLSearchParams({ q });
    if (category) params.set('category', category);
    return request(`/products/search?${params}`, {}, false);
  }

  async suggestProducts(q: string): Promise<Product[]> {
    return request(`/products/suggest?q=${encodeURIComponent(q)}`, {}, false);
  }

  async getProduct(slug: string): Promise<Product> {
    return request(`/products/${slug}`, {}, false);
  }

  async getTrend(slug: string, range: TrendRange): Promise<TrendSeries> {
    return request(`/products/${slug}/trend?range=${range}`, {}, false);
  }

  async submitProductSuggestion(name: string): Promise<void> {
    await request('/product-suggestions', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }, false);
  }

  async register(input: { name: string; email: string; password: string }): Promise<{ needsVerification: true; email: string }> {
    const data = await request<{ needs_verification: boolean; email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: input.name, email: input.email, password: input.password }),
    }, false);
    return { needsVerification: true, email: data.email };
  }

  async verifyEmail(email: string, code: string): Promise<AuthResult> {
    return request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }, false);
  }

  async resendVerification(email: string): Promise<void> {
    await request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const data = await request<{ access_token: string; access_expires_in: number; refresh_token: string; refresh_expires_in: number; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: input.email, password: input.password }),
    }, false);
    setTokens(data.access_token, data.refresh_token);
    return {
      accessToken: data.access_token,
      accessExpiresIn: data.access_expires_in,
      refreshToken: data.refresh_token,
      refreshExpiresIn: data.refresh_expires_in,
      user: data.user,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    return request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }, false);
  }

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' });
    setTokens(null, null);
  }

  async forgotPassword(email: string): Promise<void> {
    await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, false);
  }

  async getMe(): Promise<User> {
    return request('/me');
  }

  async updateCapital(input: { capitalBand: string; businessMode?: string; timeCommitment?: string; experience?: string }): Promise<User> {
    return request('/me/capital', {
      method: 'PUT',
      body: JSON.stringify({
        capital_band: input.capitalBand,
        business_mode: input.businessMode,
        time_commitment: input.timeCommitment,
        experience: input.experience,
      }),
    });
  }

  async deleteAccount(): Promise<void> {
    await request('/me', { method: 'DELETE' });
    setTokens(null, null);
  }

  async getNotifications(): Promise<AppNotification[]> {
    return request('/me/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    await request(`/me/notifications/${id}/read`, { method: 'PATCH' });
  }

  async getSubscription(): Promise<Subscription> {
    return request('/me/subscription');
  }

  async getAiQuota(): Promise<AnalysisQuota> {
    return request('/me/ai-quota');
  }

  async createPayment(input: { planCode: string }): Promise<PaymentRequest> {
    return request('/payments', {
      method: 'POST',
      body: JSON.stringify({ plan_id: input.planCode }),
    });
  }

  async getActivePayment(): Promise<PaymentRequest | null> {
    return request('/payments/active');
  }

  async getPayments(): Promise<PaymentRequest[]> {
    return request('/payments');
  }

  async getPayment(id: string): Promise<PaymentRequest> {
    return request(`/payments/${id}`);
  }

  async uploadProof(input: { paymentId: string; fileUri: string; fileName: string; fileSize: number; fileType: string; note?: string }): Promise<PaymentRequest> {
    const formData = new FormData();
    formData.append('file', {
      uri: input.fileUri,
      name: input.fileName,
      type: input.fileType,
    } as any);
    if (input.note) formData.append('note', input.note);

    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`${API_URL}/payments/${input.paymentId}/proof`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!json.success) {
      throw new ApiError(json.error?.code ?? 'INTERNAL_ERROR', json.error?.message, json.error?.details, res.status);
    }
    return json.data;
  }

  async cancelPayment(id: string): Promise<void> {
    await request(`/payments/${id}/cancel`, { method: 'POST' });
  }

  async devApprovePayment(id: string): Promise<PaymentRequest> {
    return request(`/dev-admin/payments/${id}/approve`, { method: 'POST' });
  }

  async devRejectPayment(id: string, reasonCode: string, reasonText?: string): Promise<PaymentRequest> {
    return request(`/dev-admin/payments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason_code: reasonCode, reason_text: reasonText }),
    });
  }

  async createAnalysis(productSlug: string): Promise<{ id: string; status: string; pollAfterMs: number; quotaRemaining: number; quotaResetAt: string }> {
    const data = await request<{ id: string; status: string; poll_after_ms: number; quota_remaining: number; quota_reset_at: string }>('/analyses', {
      method: 'POST',
      body: JSON.stringify({ product_id: productSlug }),
    });
    return {
      id: data.id,
      status: data.status,
      pollAfterMs: data.poll_after_ms,
      quotaRemaining: data.quota_remaining,
      quotaResetAt: data.quota_reset_at,
    };
  }

  async getAnalysis(id: string): Promise<Analysis> {
    return request(`/analyses/${id}`);
  }

  async getAnalyses(): Promise<Analysis[]> {
    return request('/analyses');
  }

  async deleteAnalysis(id: string): Promise<void> {
    await request(`/analyses/${id}`, { method: 'DELETE' });
  }

  async rateAnalysis(id: string, input: { rating: number; comment?: string }): Promise<Analysis> {
    return request(`/analyses/${id}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating: input.rating, comment: input.comment }),
    });
  }
}
