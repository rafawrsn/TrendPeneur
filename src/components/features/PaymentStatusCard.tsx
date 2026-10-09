import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { Badge } from '../ui/Badge';
import { formatDateId, formatRupiah } from '../../utils/format';
import type { PaymentRequest } from '../../api/types';

const statusConfig: Record<string, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }> = {
  PENDING_PAYMENT: { label: 'Menunggu Pembayaran', variant: 'warning' },
  PENDING_VERIFICATION: { label: 'Menunggu Verifikasi', variant: 'info' },
  APPROVED: { label: 'Disetujui', variant: 'success' },
  REJECTED: { label: 'Ditolak', variant: 'danger' },
  EXPIRED: { label: 'Kedaluwarsa', variant: 'neutral' },
  CANCELLED: { label: 'Dibatalkan', variant: 'neutral' },
};

const rejectReasons: Record<string, string> = {
  NOMINAL_TIDAK_SESUAI: 'Nominal pembayaran tidak sesuai dengan tagihan.',
  BUKTI_TIDAK_JELAS: 'Bukti pembayaran tidak jelas atau tidak terbaca.',
  BUKTI_DUPLIKAT: 'Bukti pembayaran sudah pernah digunakan.',
  LAINNYA: 'Pembayaran ditolak.',
};

interface PaymentStatusCardProps {
  payment: PaymentRequest;
}

export function PaymentStatusCard({ payment }: PaymentStatusCardProps) {
  const sc = statusConfig[payment.status] ?? statusConfig.PENDING_PAYMENT;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Status</Text>
        <Badge label={sc.label} variant={sc.variant} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Jumlah</Text>
        <Text style={styles.value}>{formatRupiah(payment.amountTotal)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Kode Unik</Text>
        <Text style={styles.value}>{payment.uniqueCode}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Dibuat</Text>
        <Text style={styles.value}>{formatDateId(payment.createdAt)}</Text>
      </View>
      {payment.decidedAt && (
        <View style={styles.row}>
          <Text style={styles.label}>Diproses</Text>
          <Text style={styles.value}>{formatDateId(payment.decidedAt)}</Text>
        </View>
      )}
      {payment.status === 'REJECTED' && payment.rejectReasonCode && (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonTitle}>Alasan Penolakan</Text>
          <Text style={styles.reasonText}>
            {rejectReasons[payment.rejectReasonCode] ?? payment.rejectReasonText ?? 'Pembayaran ditolak.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  value: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  reasonBox: {
    marginTop: spacing.md,
    backgroundColor: '#FBE5E5',
    borderRadius: radius.small,
    padding: spacing.md,
  },
  reasonTitle: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
  },
});
