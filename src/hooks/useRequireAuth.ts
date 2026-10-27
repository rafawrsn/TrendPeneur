import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../stores/session';

interface RequireAuthOptions {
  requirePremium?: boolean;
  redirectTo?: string;
  returnTo?: string;
}

export function useRequireAuth(options: RequireAuthOptions = {}) {
  const { requirePremium = false, redirectTo = '/auth/login', returnTo } = options;
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const isInitialized = useSessionStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      const target = returnTo ? `${redirectTo}?returnTo=${encodeURIComponent(returnTo)}` : redirectTo;
      router.replace(target as any);
      return;
    }
    if (requirePremium && !user.isPremium) {
      router.replace('/premium/paywall');
    }
  }, [user, isInitialized, router, redirectTo, returnTo, requirePremium]);

  return {
    isAuthenticated: !!user,
    isPremium: user?.isPremium ?? false,
    user,
    isReady: isInitialized,
  };
}
