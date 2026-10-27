import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useToast } from '@/src/components/ui/Toast';
import { useSessionStore } from '@/src/stores/session';
import { getService, ApiError, IS_MOCK } from '@/src/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, returnTo } = useLocalSearchParams<{ email: string; returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { setUser, setTokens } = useSessionStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.show('Masukkan 6 digit kode OTP.', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await getService().verifyEmail(email ?? '', fullCode);
      setUser(result.user);
      setTokens(result.accessToken, result.refreshToken);
      toast.show('Email berhasil diverifikasi!', 'success');
      if (returnTo) {
        router.replace(returnTo as any);
      } else {
        router.replace('/');
      }
    } catch (e) {
      if (e instanceof ApiError) {
        toast.show(e.indonesianMessage, 'error');
      } else {
        toast.show('Kode OTP salah.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await getService().resendVerification(email ?? '');
      toast.show('Kode verifikasi telah dikirim ulang.', 'info');
    } catch {
      toast.show('Gagal mengirim ulang. Coba lagi.', 'error');
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
        <Text style={styles.title}>Verifikasi Email</Text>
        <Text style={styles.subtitle}>
          Masukkan 6 digit kode yang dikirim ke {email ?? 'email kamu'}
        </Text>

        {IS_MOCK && (
          <View style={styles.devHint}>
            <Text style={styles.devHintText}>Kode demo: 123456</Text>
          </View>
        )}

        <View style={styles.otpContainer}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { refs.current[i] = ref; }}
              style={styles.otpInput}
              value={digit}
              onChangeText={(v) => handleCodeChange(i, v)}
              keyboardType="numeric"
              maxLength={1}
              accessibilityLabel={`Digit ${i + 1}`}
            />
          ))}
        </View>

        <View style={{ height: spacing.lg }} />
        <Button label="Verifikasi" onPress={handleVerify} loading={loading} fullWidth />

        <Pressable onPress={handleResend} style={styles.resendLink}>
          <Text style={styles.resendText}>Tidak menerima kode? Kirim ulang</Text>
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
    lineHeight: 22,
  },
  devHint: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.small,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  devHintText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  otpInput: {
    flex: 1,
    aspectRatio: 0.7,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    textAlign: 'center',
    maxHeight: 56,
  },
  resendLink: { alignItems: 'center', paddingVertical: spacing.lg },
  resendText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilyMedium,
    color: colors.primary,
  },
});
