import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { PaymentStatusCard } from '@/src/components/features/PaymentStatusCard';
import { useToast } from '@/src/components/ui/Toast';
import { useSessionStore } from '@/src/stores/session';
import { getService, ApiError, IS_MOCK } from '@/src/api';
import { useQuery } from '@tanstack/react-query';
import { formatDateId, formatDateIdFull } from '@/src/utils/format';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PaymentRequest } from '@/src/api/types';

const rejectReasons = [
  { code: 'NOMINAL_TIDAK_SESUAI', label: 'Nominal tidak sesuai' },
  { code: 'BUKTI_TIDAK_JELAS', label: 'Bukti tidak jelas' },
  { code: 'BUKTI_DUPLIKAT', label: 'Bukti duplikat' },
  { code: 'LAINNYA', label: 'Lainnya' },
];

export default function PaymentStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const refreshUser = useSessionStore((s) => s.refreshUser);
  const [refreshing, setRefreshing] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const { data: payments, refetch } = useQuery({
    queryKey: ['payments'],
    queryFn: () => getService().getPayments(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.some((p) => p.status === 'PENDING_VERIFICATION' || p.status === 'PENDING_PAYMENT')) {
        return 10000;
      }
      return false;
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    await refreshUser();
    setRefreshing(false);
  }, [refetch, refreshUser]);

  const activePayment = payments?.find((p) => p.status === 'PENDING_PAYMENT' || p.status === 'PENDING_VERIFICATION');
  const pastPayments = payments?.filter((p) => p.status !== 'PENDING_PAYMENT' && p.status !== 'PENDING_VERIFICATION') ?? [];

  const handleApprove = async (id: string) => {
    try {
      await getService().devApprovePayment(id);
      toast.show('Pembayaran disetujui. Premium aktif!', 'success');
      await refreshUser();
      await refetch();
    } catch (e) {
      if (e instanceof ApiError) toast.show(e.indonesianMessage, 'error');
    }
  };

  const handleReject = (id: string) => {
    Alert.alert('Tolak Pembayaran', 'Pilih alasan:', rejectReasons.map((r) => ({
      text: r.label,
      onPress: async () => {
        try {
          await getService().devRejectPayment(id, r.code);
          toast.show('Pembayaran ditolak.', 'info');
          await refetch();
        } catch (e) {
          if (e instanceof ApiError) toast.show(e.indonesianMessage, 'error');
        }
      },
    })));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Status Pembayaran</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {!activePayment && (!payments || payments.length === 0) && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada permintaan pembayaran.</Text>
            <View style={{ height: spacing.md }} />
            <Button label="Upgrade ke Premium" onPress={() => router.push('/premium/paywall')} fullWidth />
          </Card>
        )}

        {activePayment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permintaan Aktif</Text>
            <PaymentStatusCard payment={activePayment} />
            {activePayment.status === 'PENDING_PAYMENT' && (
              <View style={{ marginTop: spacing.md }}>
                <Button label="Lanjut Pembayaran" onPress={() => router.push('/premium/payment')} fullWidth />
              </View>
            )}
            {activePayment.status === 'PENDING_VERIFICATION' && (
              <Card style={styles.verificationNote}>
                <ShieldCheck size={18} color={colors.primary} strokeWidth={2} />
                <Text style={styles.verificationText}>Estimasi proses 1x24 jam kerja.</Text>
              </Card>
            )}
            {activePayment.status === 'REJECTED' && (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                <Button label="Unggah Ulang Bukti" onPress={() => router.push(`/premium/upload-proof?paymentId=${activePayment.id}`)} fullWidth />
                <Button label="Buat Permintaan Baru" onPress={() => router.push('/premium/paywall')} variant="secondary" fullWidth />
              </View>
            )}
          </View>
        )}

        {IS_MOCK && activePayment?.status === 'PENDING_VERIFICATION' && (
          <Card style={styles.simulatorCard}>
            <Pressable
              style={styles.simulatorHeader}
              onPress={() => setShowSimulator(!showSimulator)}
              accessibilityLabel="Simulasi Admin"
              accessibilityRole="button"
            >
              <Text style={styles.simulatorTitle}>Simulasi Admin (hanya demo)</Text>
              {showSimulator ? <ChevronUp size={18} color={colors.text} /> : <ChevronDown size={18} color={colors.text} />}
            </Pressable>
            {showSimulator && (
              <View style={styles.simulatorButtons}>
                <Button label="Setujui" onPress={() => handleApprove(activePayment.id)} fullWidth />
                <View style={{ height: spacing.sm }} />
                <Button label="Tolak (pilih alasan)" onPress={() => handleReject(activePayment.id)} variant="danger" fullWidth />
              </View>
            )}
          </Card>
        )}

        {pastPayments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Riwayat Pembayaran</Text>
            {pastPayments.map((p) => (
              <PaymentStatusCard key={p.id} payment={p} />
            ))}
            <View style={{ height: spacing.sm }} />
          </View>
        )}
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
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  verificationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  verificationText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.primary,
  },
  simulatorCard: {
    marginBottom: spacing.lg,
    backgroundColor: '#FDF3E0',
    borderColor: colors.warning,
  },
  simulatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simulatorTitle: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.warning,
  },
  simulatorButtons: {
    marginTop: spacing.md,
  },
});
