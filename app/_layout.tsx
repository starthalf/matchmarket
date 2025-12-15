import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { MatchProvider } from '@/contexts/MatchContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { InstallPrompt } from '../components/InstallPrompt';

export default function RootLayout() {
  useFrameworkReady();

  // 🔥 Service Worker 등록 추가
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration);
          })
          .catch((error) => {
            console.log('❌ Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  // 네이티브 환경에서 에러 처리
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
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
    <>
      <SafeAreaProvider>
        <AuthProvider>
          <AdminProvider>
            <MatchProvider>
              <ChatProvider>
                <StatusBar
                  style="dark"
                  backgroundColor="transparent"
                  translucent={true}
                />
                <Stack screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#f9fafb' }
                }}>
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ChatProvider>
            </MatchProvider>
          </AdminProvider>
        </AuthProvider>
      </SafeAreaProvider>
      <InstallPrompt />
    </>
  );
}