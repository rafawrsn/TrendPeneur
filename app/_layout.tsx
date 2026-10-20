import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/src/components/ui/Toast';
import { ErrorBoundary } from '@/src/components/ui/ErrorBoundary';
import { useSessionStore } from '@/src/stores/session';
import { useUiStore } from '@/src/stores/ui';
import { colors } from '@/src/theme/tokens';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const initializeSession = useSessionStore((s) => s.initialize);
  const isSessionInitialized = useSessionStore((s) => s.isInitialized);
  const initializeUi = useUiStore((s) => s.initialize);

  useEffect(() => {
    initializeSession();
    initializeUi();
  }, [initializeSession, initializeUi]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isSessionInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isSessionInitialized]);

  if ((!fontsLoaded && !fontError) || !isSessionInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <ToastProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="dark" />
            </ToastProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
