import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Trash2, LogOut, HelpCircle, FileText, Bell } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useToast } from '@/src/components/ui/Toast';
import { useSessionStore } from '@/src/stores/session';
import { useUiStore } from '@/src/stores/ui';
import { IS_MOCK, APP_VERSION } from '@/src/config/env';
import { getService } from '@/src/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const logout = useSessionStore((s) => s.logout);
  const simulateAiFailure = useUiStore((s) => s.simulateAiFailure);
  const setSimulateAiFailure = useUiStore((s) => s.setSimulateAiFailure);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hapus Akun',
      'Akun dan semua data kamu akan dihapus permanen. Yakin?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Konfirmasi', 'Tindakan ini tidak dapat dibatalkan. Lanjutkan?', [
              { text: 'Batal', style: 'cancel' },
              {
                text: 'Ya, hapus',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await getService().deleteAccount();
                    await logout();
                    toast.show('Akun dihapus.', 'info');
                    router.replace('/');
                  } catch {
                    toast.show('Gagal menghapus akun.', 'error');
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  };

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

  const menuItems = [
    { icon: HelpCircle, label: 'Bantuan', onPress: () => router.push('/help') },
    { icon: FileText, label: 'Kebijakan Privasi', onPress: () => router.push('/legal/privasi') },
    { icon: FileText, label: 'Syarat & Ketentuan', onPress: () => router.push('/legal/syarat') },
    { icon: FileText, label: 'Disclaimer Prediksi', onPress: () => router.push('/legal/disclaimer') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Pengaturan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Bell size={20} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.toggleLabel}>Notifikasi</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </Card>

        {IS_MOCK && (
          <Card style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleLabel}>Simulasikan kegagalan AI</Text>
              </View>
              <Switch
                value={simulateAiFailure}
                onValueChange={setSimulateAiFailure}
                trackColor={{ false: colors.border, true: colors.danger }}
              />
            </View>
            <Text style={styles.toggleHint}>Jika aktif, analisis AI akan gagal (demo saja).</Text>
          </Card>
        )}

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

        <View style={{ height: spacing.lg }} />
        <Button label="Keluar" onPress={handleLogout} variant="ghost" fullWidth icon={<LogOut size={18} color={colors.danger} strokeWidth={2} />} />
        <View style={{ height: spacing.sm }} />
        <Pressable style={styles.deleteAccountButton} onPress={handleDeleteAccount} accessibilityLabel="Hapus akun" accessibilityRole="button">
          <Trash2 size={18} color={colors.danger} strokeWidth={2} />
          <Text style={styles.deleteAccountText}>Hapus Akun</Text>
        </Pressable>

        <Text style={styles.versionText}>TrendPreneur v{APP_VERSION}</Text>
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
  toggleCard: { marginBottom: spacing.md },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleLabel: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamily,
    color: colors.text,
  },
  toggleHint: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    marginTop: spacing.xs,
  },
  menuList: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
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
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  deleteAccountText: {
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.danger,
  },
  versionText: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
