import type {
  Analysis,
  AppNotification,
  AuthResult,
  PaymentRequest,
  User,
} from '../api/types';
import { storageGetJSON, storageSetJSON, storageDelete } from '../utils/storage';

const STORAGE_KEY = 'trendpreneur_mock_state';

export interface MockUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // plain text in mock, real app would hash
  emailVerified: boolean;
  capitalBand: string | null;
  businessMode: string | null;
  timeCommitment: string | null;
  experience: string | null;
  isPremium: boolean;
  premiumStartAt: string | null;
  premiumEndsAt: string | null;
  lockedUntil: string | null;
  failedAttempts: number;
  refreshToken: string | null;
}

export interface MockState {
  users: MockUserRecord[];
  currentUserId: string | null;
  accessToken: string | null;
  payments: (PaymentRequest & { userId: string })[];
  analyses: (Analysis & { userId: string })[];
  notifications: (AppNotification & { userId: string })[];
  quotaUsedToday: number;
  quotaDate: string; // YYYY-MM-DD
  proofHashes: string[];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function initState(): MockState {
  const now = new Date();
  const premiumEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString();

  return {
    users: [
      {
        id: 'usr_free_demo',
        name: 'Pengguna Demo Free',
        email: 'free@trendpreneur.id',
        passwordHash: 'Demo12345',
        emailVerified: true,
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
      },
      {
        id: 'usr_premium_demo',
        name: 'Pengguna Demo Premium',
        email: 'premium@trendpreneur.id',
        passwordHash: 'Demo12345',
        emailVerified: true,
        capitalBand: '5_20',
        businessMode: 'online',
        timeCommitment: 'paruh_waktu',
        experience: 'pemula',
        isPremium: true,
        premiumStartAt: now.toISOString(),
        premiumEndsAt: premiumEnd,
        lockedUntil: null,
        failedAttempts: 0,
        refreshToken: null,
      },
    ],
    currentUserId: null,
    accessToken: null,
    payments: [],
    analyses: [],
    notifications: [],
    quotaUsedToday: 0,
    quotaDate: todayStr(),
    proofHashes: [],
  };
}

let state: MockState | null = null;

export async function loadState(): Promise<MockState> {
  if (state) return state;
  const saved = await storageGetJSON<MockState>(STORAGE_KEY);
  if (saved && saved.users) {
    state = saved;
  } else {
    state = initState();
  }
  return state;
}

export async function saveState(): Promise<void> {
  if (state) {
    await storageSetJSON(STORAGE_KEY, state);
  }
}

export async function clearState(): Promise<void> {
  state = null;
  await storageDelete(STORAGE_KEY);
}

export function getState(): MockState {
  if (!state) state = initState();
  return state;
}

export function setState(updater: (s: MockState) => void): void {
  const s = getState();
  updater(s);
  // Save asynchronously
  saveState();
}

export function resetQuotaIfNeeded(): void {
  const s = getState();
  if (s.quotaDate !== todayStr()) {
    s.quotaUsedToday = 0;
    s.quotaDate = todayStr();
  }
}

export function getCurrentUser(): MockUserRecord | null {
  const s = getState();
  return s.users.find((u) => u.id === s.currentUserId) ?? null;
}

export function toUser(rec: MockUserRecord): User {
  const now = new Date();
  const isPremium = rec.isPremium && rec.premiumEndsAt && new Date(rec.premiumEndsAt) > now;
  return {
    id: rec.id,
    name: rec.name,
    email: rec.email,
    capitalBand: rec.capitalBand,
    businessMode: rec.businessMode,
    timeCommitment: rec.timeCommitment,
    experience: rec.experience,
    isPremium: Boolean(isPremium),
    premiumEndsAt: isPremium ? rec.premiumEndsAt : null,
    emailVerified: rec.emailVerified,
  };
}

export function makeAuthResult(rec: MockUserRecord): AuthResult {
  const accessToken = `mock_access_${rec.id}_${Date.now()}`;
  const refreshToken = `mock_refresh_${rec.id}_${Date.now()}`;
  rec.refreshToken = refreshToken;
  return {
    accessToken,
    accessExpiresIn: 900,
    refreshToken,
    refreshExpiresIn: 2592000,
    user: toUser(rec),
  };
}

let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter++;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}
