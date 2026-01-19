import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MatchProvider } from '@/contexts/MatchContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { InstallPrompt } from '../components/InstallPrompt';

// AuthProvider 내부에서만 useAuth() 사용 가능하도록 분리
function RootLayoutContent() {
  const { user, isLoading } = useAuth();
  useFrameworkReady();

  // 🔥 Service Worker 등록
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

  // ✅ 로딩 중에는 로딩 화면 표시 (라우팅 차단)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  // 로그인 안 되어있으면 로그인 페이지로
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f9fafb' } }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    );
  }

  // 로그인 되어있으면 메인 탭 라우터로
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f9fafb' } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
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
                <RootLayoutContent />
              </ChatProvider>
            </MatchProvider>
          </AdminProvider>
        </AuthProvider>
      </SafeAreaProvider>
      <InstallPrompt />
    </>
  );
}