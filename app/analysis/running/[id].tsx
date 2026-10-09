import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Card } from '@/src/components/ui/Card';
import { ProgressSteps } from '@/src/components/ui/ProgressSteps';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Button } from '@/src/components/ui/Button';
import { getService } from '@/src/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnalysisRunningScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    let attempt = 0;
    const steps = ['Mengumpulkan data', 'Menganalisis', 'Menyusun hasil'];

    const poll = async () => {
      if (!active) return;
      attempt++;
      try {
        const analysis = await getService().getAnalysis(id);
        if (!active) return;
        if (analysis.status === 'COMPLETED') {
          setStep(2);
          setProgress(100);
          setTimeout(() => router.replace(`/analysis/${id}`), 500);
          return;
        }
        if (analysis.status === 'FAILED') {
          setFailed(true);
          return;
        }
        if (analysis.status === 'RUNNING') {
          setStep(1);
          setProgress(60);
        }
        if (attempt < 40) {
          setTimeout(poll, 2000);
        } else {
          setFailed(true);
        }
      } catch {
        if (active && attempt < 40) {
          setTimeout(poll, 2000);
        }
      }
    };

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 50));
    }, 300);

    setTimeout(poll, 1500);

    return () => {
      active = false;
      clearInterval(progressInterval);
    };
  }, [id, router]);

  const steps = ['Mengumpulkan data', 'Menganalisis', 'Menyusun hasil'];

  if (failed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <ErrorState
            message="Analisis belum berhasil. Kuotamu tidak terpotong."
          />
          <View style={{ height: spacing.md }} />
          <Button
            label="Coba lagi"
            onPress={() => router.replace(`/analysis/new`)}
            fullWidth
          />
          <View style={{ height: spacing.sm }} />
          <Button
            label="Kembali ke Beranda"
            onPress={() => router.replace('/')}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Sedang Menganalisis...</Text>
        <Text style={styles.subtitle}>Tunggu sebentar, AI sedang memproses data tren produk</Text>

        <Card style={styles.progressCard}>
          <ProgressSteps steps={steps} currentIndex={step} />
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.stepLabel}>{steps[step]}</Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  progressCard: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.primary,
    marginTop: spacing.md,
  },
});
