import { Stack } from 'expo-router';


export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false, title: 'Masuk' }} />
      <Stack.Screen name="register" options={{ headerShown: false, title: 'Daftar' }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false, title: 'Lupa Password' }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false, title: 'Verifikasi Email' }} />
    </Stack>
  );
}
