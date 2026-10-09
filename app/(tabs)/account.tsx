import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wallet,
  CreditCard,
  History,
  Bell,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { useSessionStore } from '@/src/stores/session';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDateId, formatDateIdFull } from '@/src/utils/format';
import { getCapitalBandLabel } from '@/src/config/constants';

export default function AccountTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.guestContent}>
          <View style={styles.guestIconCircle}>
            <UserIcon size={48} color={colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.guestTitle}>Selamat datang!</Text>
          <Text style={styles.guestDesc}>
            Masuk atau daftar untuk menyimpan preferensi modal, berlangganan Premium, dan menggunakan AI Analyst.
          </Text>
          <View style={styles.guestButtons}>
            <Button label="Masuk" onPress={() => router.push('/auth/login')} fullWidth />
            <View style={{ height: spacing.sm }} />
            <Button label="Daftar" onPress={() => router.push('/auth/register')} variant="secondary" fullWidth />
          </View>
        </ScrollView>
      </View>
    );
  }

  const menuItems = [
    { icon: Wallet, label: 'Modal & Konteks Usaha', onPress: () => router.push('/profile/capital') },
    { icon: CreditCard, label: 'Status Pembayaran', onPress: () => router.push('/premium/status') },
    { icon: History, label: 'Riwayat Analisis', onPress: () => router.push('/analysis/history') },
    { icon: Bell, label: 'Notifikasi', onPress: () => router.push('/notifications') },
    { icon: Settings, label: 'Pengaturan', onPress: () => router.push('/settings') },
    { icon: HelpCircle, label: 'Bantuan', onPress: () => router.push('/help') },
    { icon: FileText, label: 'Kebijakan Privasi', onPress: () => router.push('/legal/privasi') },
    { icon: FileText, label: 'Syarat & Ketentuan', onPress: () => router.push('/legal/syarat') },
    { icon: FileText, label: 'Disclaimer Prediksi', onPress: () => router.push('/legal/disclaimer') },
  ];

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.statusRow}>
              {user.isPremium ? (
                <Badge label={`Premium - ${formatDateId(user.premiumEndsAt ?? '')}`} variant="success" />
              ) : (
                <Badge label="Free" variant="neutral" />
              )}
            </View>
          </View>
        </View>

        <Card style={styles.capitalCard}>
          <Text style={styles.capitalLabel}>Modal</Text>
          <Text style={styles.capitalValue}>{getCapitalBandLabel(user.capitalBand)}</Text>
        </Card>

        <View style={styles.menuList}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={i}
                style={styles.menuItem}
                onPress={item.onPress}
                accessibilityLabel={item.label}
                accessibilityRole="button"
              >
                <View style={styles.menuLeft}>
                  <Icon size={20} color={colors.textMuted} strokeWidth={2} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <ChevronRight size={18} color={colors.textSubtle} strokeWidth={2} />
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Keluar"
          onPress={handleLogout}
          variant="ghost"
          fullWidth
          icon={<LogOut size={18} color={colors.danger} strokeWidth={2} />}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  guestContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  guestIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  guestTitle: {
    fontSize: typography.sizes.display,
    fontFamily: typography.fontFamilyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  guestDesc: {
    fontSize: typography.sizes.body,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  guestButtons: { width: '100%', maxWidth: 300 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.h1,
    fontFamily: typography.fontFamilyBold,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusRow: {
    marginTop: spacing.xs,
  },
  capitalCard: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capitalLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
  },
  capitalValue: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  menuList: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 48,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
  },
});
