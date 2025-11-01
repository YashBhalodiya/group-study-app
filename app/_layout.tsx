import { Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect } from 'react';
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthService } from './services/authService';

function AuthLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if we're in auth screens or verification screen
    const isAuthScreen = pathname === '/' || pathname === '/signup';
    const isVerificationScreen = pathname === '/email-verification';

    if (!user && !isAuthScreen && !isVerificationScreen) {
      // User is not authenticated and not in auth/verification screens, redirect to login
      router.replace('/');
    } else if (user && isAuthScreen) {
      // User is authenticated but still in auth screens
      // Check email verification status
      const checkEmailVerification = async () => {
        try {
          const isVerified = await AuthService.isEmailVerified();
          if (isVerified) {
            router.replace('/(tabs)/groups');
          } else {
            router.replace('/email-verification' as any);
          }
        } catch (error) {
          console.error('Error checking email verification:', error);
          router.replace('/email-verification' as any);
        }
      };
      
      checkEmailVerification();
    }
  }, [user, loading, pathname]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="email-verification" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Toast />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthLayout />
        <Toast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
