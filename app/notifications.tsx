import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/src/theme/tokens';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getService } from '@/src/api';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { formatDateId } from '@/src/utils/format';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getService().getNotifications(),
  });

  const handlePress = async (id: string) => {
    await getService().markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Kembali" accessibilityRole="button">
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifikasi</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !item.read && handlePress(item.id)}
            accessibilityLabel={item.title}
            accessibilityRole="button"
          >
            <Card style={[styles.notifItem, ...(item.read ? [] : [styles.notifUnread])]}>
              <View style={styles.notifHeader}>
                <View style={styles.notifIconWrapper}>
                  <Bell size={16} color={item.read ? colors.textSubtle : colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.notifTitle}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifBody}>{item.body}</Text>
              <Text style={styles.notifDate}>{formatDateId(item.createdAt)}</Text>
            </Card>
          </Pressable>
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }}
        ListEmptyComponent={
          <EmptyState
            title="Belum ada notifikasi"
            message="Notifikasi pembayaran dan Premium akan muncul di sini."
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
  notifItem: {
    marginBottom: spacing.sm,
  },
  notifUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  notifIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    flex: 1,
    fontSize: typography.sizes.bodySmall,
    fontFamily: typography.fontFamilySemiBold,
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifBody: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textMuted,
    lineHeight: 18,
  },
  notifDate: {
    fontSize: typography.sizes.caption,
    fontFamily: typography.fontFamily,
    color: colors.textSubtle,
    marginTop: spacing.xs,
  },
});
