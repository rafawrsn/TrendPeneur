import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useToast } from '@/src/components/ui/Toast';
import { getService, ApiError } from '@/src/api';
import { emailSchema, passwordSchema, nameSchema } from '@/src/utils/validators';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; consent?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const nameErr = nameSchema.safeParse(trimmedName).success ? undefined : 'Nama minimal 2 karakter';
    const emailErr = emailSchema.safeParse(trimmedEmail).success ? undefined : 'Format email tidak valid';
    const passResult = passwordSchema.safeParse(password);
    const passErr = passResult.success ? undefined : passResult.error.issues[0]?.message;
    const consentErr = consent ? undefined : 'Kamu harus menyetujui Syarat & Ketentuan';

    const newErrors = { name: nameErr, email: emailErr, password: passErr, consent: consentErr };
    setErrors(newErrors);
    if (nameErr || emailErr || passErr || consentErr) return;

    setLoading(true);
    try {
      await getService().register({ name: trimmedName, email: trimmedEmail, password });
      toast.show('Akun dibuat! Verifikasi email kamu.', 'success');
      const target = params.returnTo
        ? `/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}&returnTo=${encodeURIComponent(params.returnTo)}`
        : `/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}`;
      router.push(target as any);
    } catch (e) {
      if (e instanceof ApiError) {
        toast.show(e.indonesianMessage, 'error');
      } else {
        toast.show('Gagal mendaftar. Coba lagi.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Daftar</Text>
        <Text style={styles.subtitle}>Buat akun TrendPreneur untuk mulai</Text>

        <Card style={styles.formCard}>
          <Input
            label="Nama"
            value={name}
            onChangeText={(v) => { setName(v); setErrors((p) => ({ ...p, name: undefined })); }}
            placeholder="Nama lengkap"
            error={errors.name}
            accessibilityLabel="Nama"
          />
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
            placeholder="Min. 8 karakter, huruf + angka"
            secureTextEntry
            error={errors.password}
            accessibilityLabel="Password"
          />

          <Pressable
            style={styles.consentRow}
            onPress={() => { setConsent(!consent); setErrors((p) => ({ ...p, consent: undefined })); }}
            accessibilityLabel="Setujui syarat dan ketentuan"
            accessibilityRole="checkbox"
          >
            <View style={[styles.checkbox, consent && styles.checkboxChecked]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.consentText}>
                Saya menyetujui{' '}
                <Text style={styles.linkText} onPress={() => router.push('/legal/syarat')}>Syarat & Ketentuan</Text>
                {' '}dan{' '}
                <Text style={styles.linkText} onPress={() => router.push('/legal/privasi')}>Kebijakan Privasi</Text>
              </Text>
            </View>
          </Pressable>
          {errors.consent && <Text style={styles.consentError}>{errors.consent}</Text>}

          <View style={{ height: spacing.md }} />
          <Button label="Daftar" onPress={handleRegister} loading={loading} fullWidth />
        </Card>

        <Pressable
          onPress={() =>
            router.push(
              params.returnTo
                ? `/auth/login?returnTo=${encodeURIComponent(params.returnTo)}`
                : '/auth/login'
            )
          }
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Sudah punya akun? <Text style={styles.loginBold}>Masuk</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
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
  formCard: { marginBottom: spacing.lg },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  consentText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    fontFamily: typography.fontFamilySemiBold,
  },
  consentError: {
    fontSize: typography.sizes.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  loginLink: { alignItems: 'center', paddingVertical: spacing.md },
  loginText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  loginBold: {
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
  },
});
