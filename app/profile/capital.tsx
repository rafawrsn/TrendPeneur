import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Chip } from '@/src/components/ui/Chip';
import { useToast } from '@/src/components/ui/Toast';
import { useSessionStore } from '@/src/stores/session';
import { getService, ApiError } from '@/src/api';
import { CAPITAL_BANDS } from '@/src/config/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CapitalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const user = useSessionStore((s) => s.user);
  const refreshUser = useSessionStore((s) => s.refreshUser);

  const [capitalBand, setCapitalBand] = useState(user?.capitalBand ?? null);
  const [businessMode, setBusinessMode] = useState(user?.businessMode ?? null);
  const [timeCommitment, setTimeCommitment] = useState(user?.timeCommitment ?? null);
  const [experience, setExperience] = useState(user?.experience ?? null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!capitalBand) {
      toast.show('Pilih modal dulu.', 'error');
      return;
    }
    setLoading(true);
    try {
      await getService().updateCapital({
        capitalBand,
        businessMode: businessMode ?? undefined,
        timeCommitment: timeCommitment ?? undefined,
        experience: experience ?? undefined,
      });
      await refreshUser();
      toast.show('Modal tersimpan.', 'success');
      router.back();
    } catch (e) {
      if (e instanceof ApiError) toast.show(e.indonesianMessage, 'error');
      else toast.show('Gagal menyimpan. Coba lagi.', 'error');
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
        <Text style={styles.headerTitle}>Modal & Konteks Usaha</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Modal yang Tersedia</Text>
        <Text style={styles.sectionDesc}>Pilih rentang modal yang kamu siapkan. Rekomendasi AI akan menyesuaikan.</Text>
        <View style={styles.bandsGrid}>
          {CAPITAL_BANDS.map((band) => (
            <Pressable
              key={band.key}
              style={[styles.bandCard, capitalBand === band.key && styles.bandCardSelected]}
              onPress={() => setCapitalBand(band.key)}
              accessibilityLabel={band.label}
              accessibilityRole="radio"
            >
              {capitalBand === band.key && (
                <View style={styles.checkIcon}>
                  <Check size={16} color="#FFFFFF" strokeWidth={2} />
                </View>
              )}
              <Text style={[styles.bandLabel, capitalBand === band.key && styles.bandLabelSelected]}>
                {band.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Mode Usaha</Text>
        <View style={styles.chipsRow}>
          <Chip label="Online" selected={businessMode === 'online'} onPress={() => setBusinessMode('online')} />
          <Chip label="Offline" selected={businessMode === 'offline'} onPress={() => setBusinessMode('offline')} />
          <Chip label="Hybrid" selected={businessMode === 'hybrid'} onPress={() => setBusinessMode('hybrid')} />
        </View>

        <Text style={styles.sectionTitle}>Waktu</Text>
        <View style={styles.chipsRow}>
          <Chip label="Paruh waktu" selected={timeCommitment === 'paruh_waktu'} onPress={() => setTimeCommitment('paruh_waktu')} />
          <Chip label="Penuh waktu" selected={timeCommitment === 'penuh_waktu'} onPress={() => setTimeCommitment('penuh_waktu')} />
        </View>

        <Text style={styles.sectionTitle}>Pengalaman</Text>
        <View style={styles.chipsRow}>
          <Chip label="Pemula" selected={experience === 'pemula'} onPress={() => setExperience('pemula')} />
          <Chip label="Berpengalaman" selected={experience === 'berpengalaman'} onPress={() => setExperience('berpengalaman')} />
        </View>

        <View style={{ height: spacing.xl }} />
        <Button label="Simpan" onPress={handleSave} loading={loading} fullWidth />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  bandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bandCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    minWidth: '46%',
  },
  bandCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bandLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  bandLabelSelected: {
    color: '#FFFFFF',
  },
  checkIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
});
