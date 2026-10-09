import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing } from '@/src/theme/tokens';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { useToast } from '@/src/components/ui/Toast';
import { getService } from '@/src/api';
import { emailSchema } from '@/src/utils/validators';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const err = emailSchema.safeParse(email).success ? undefined : 'Format email tidak valid';
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      await getService().forgotPassword(email);
      setSent(true);
      toast.show('Tautan reset telah dikirim (jika email terdaftar).', 'info');
    } catch {
      toast.show('Terjadi kesalahan. Coba lagi.', 'error');
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
        <Text style={styles.title}>Lupa Password</Text>
        <Text style={styles.subtitle}>
          Masukkan email kamu. Jika email terdaftar, tautan reset password telah dikirim.
        </Text>

        {sent ? (
          <Card style={styles.sentCard}>
            <Text style={styles.sentText}>
              Jika email terdaftar, tautan reset telah dikirim ke {email}. Periksa kotak masuk email kamu.
            </Text>
            <View style={{ height: spacing.md }} />
            <Button label="Kembali ke Masuk" onPress={() => router.push('/auth/login')} variant="secondary" fullWidth />
          </Card>
        ) : (
          <Card style={styles.formCard}>
            <Input
              label="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(undefined); }}
              placeholder="email@contoh.com"
              keyboardType="email-address"
              error={error}
              accessibilityLabel="Email"
            />
            <Button label="Kirim Tautan Reset" onPress={handleSubmit} loading={loading} fullWidth />
          </Card>
        )}
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
  formCard: { marginBottom: spacing.lg },
  sentCard: {},
  sentText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
