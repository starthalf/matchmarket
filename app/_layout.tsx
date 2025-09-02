import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MatchProvider } from '@/contexts/MatchContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <MatchProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
        </Stack>
      </MatchProvider>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
