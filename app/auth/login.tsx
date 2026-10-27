import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useToast } from '@/src/components/ui/Toast';
import { useSessionStore } from '@/src/stores/session';
import { getService, ApiError } from '@/src/api';
import { emailSchema, passwordSchema } from '@/src/utils/validators';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user, setUser, setTokens } = useSessionStore();

  // useState
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  // useEffect
  useEffect(() => {
    if (user) {
      router.replace(params.returnTo as any || '/');
    }
  }, [user, params.returnTo, router]);

  const handleLogin = async () => {
    const emailErr = emailSchema.safeParse(email).success ? undefined : 'Format email tidak valid';
    const passErr = password ? undefined : 'Password wajib diisi';
    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    setLoading(true);
    try {
      const result = await getService().login({ email, password });
      setUser(result.user);
      setTokens(result.accessToken, result.refreshToken);
      toast.show('Berhasil masuk!', 'success');

      // router.replace
      if (params.returnTo) {
        router.replace(params.returnTo as any);
      } else {
        router.replace('/');
      }
    } catch (e) {
      if (e instanceof ApiError) {
        toast.show(e.indonesianMessage, 'error');
      } else {
        toast.show('Gagal masuk. Coba lagi.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {/* [router.back */}
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Masuk</Text>
        <Text style={styles.subtitle}>Selamat datang kembali di TrendPreneur</Text>
        

        <Card style={styles.formCard}>
          <Input
            label="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: undefined })); }}
            placeholder="email@contoh.com"
            keyboardType="email-address"
            error={errors.email}
            accessibilityLabel="Email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined })); }}
            placeholder="Masukkan password"
            secureTextEntry
            error={errors.password}
            accessibilityLabel="Password"
          />
          {/*router.push*/}
          <Pressable onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotText}>Lupa password?</Text>
          </Pressable>
          <View style={{ height: spacing.md }} />
          <Button label="Masuk" onPress={handleLogin} loading={loading} fullWidth />
        </Card>


        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Akun Demo</Text>
          <Text style={styles.demoText}>Free: free@trendpreneur.id / Demo12345</Text>
          <Text style={styles.demoText}>Premium: premium@trendpreneur.id / Demo12345</Text>
          
        </View>

        {/*router.push*/}
        <Pressable onPress={() => router.push('/auth/register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Belum punya akun? <Text style={styles.registerBold}>Daftar</Text>
          </Text>
        </Pressable>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.sizes.display,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilyMedium,
    color: colors.primary,
    textAlign: 'right',
  },
  demoCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  demoTitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  demoText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.text,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  registerText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  registerBold: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
  },
});
