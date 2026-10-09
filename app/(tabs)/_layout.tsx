import { Tabs } from 'expo-router';
import { Home, Sparkles, User, Lock } from 'lucide-react-native';
import { colors, typography } from '@/src/theme/tokens';
import { useSessionStore } from '@/src/stores/session';

export default function TabLayout() {
  const user = useSessionStore((s) => s.user);
  const isPremium = user?.isPremium ?? false;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: {
          fontFamily: typography.fontFamilyMedium,
          fontSize: typography.sizes.caption,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          paddingBottom: 4,
          paddingTop: 4,
          height: 56,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyst"
        options={{
          title: 'AI Analyst',
          tabBarIcon: ({ size, color }) => (
            isPremium ? (
              <Sparkles size={size} color={color} strokeWidth={2} />
            ) : (
              <Lock size={size - 4} color={color} strokeWidth={2} />
            )
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Akun',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
