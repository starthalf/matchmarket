import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MatchProvider } from '@/contexts/MatchContext';
import { AdminProvider } from '@/contexts/AdminContext';

export default function RootLayout() {
  useFrameworkReady();

  // 네이티브 환경에서 에러 처리
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // 네이티브 환경에서 전역 에러 핸들러 설정
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // 중요하지 않은 경고들 필터링
        const message = args.join(' ');
        if (
          message.includes('Warning: componentWillReceiveProps') ||
          message.includes('Warning: componentWillMount') ||
          message.includes('VirtualizedList') ||
          message.includes('Require cycle')
        ) {
          return;
        }
        originalConsoleError(...args);
      };
    }
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AdminProvider>
          <MatchProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="+not-found" />
            </Stack>
          </MatchProvider>
        </AdminProvider>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
