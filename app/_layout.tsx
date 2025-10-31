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
    <> {/* <-- 1. 프래그먼트 추가 */}
      <SafeAreaProvider>
        <AuthProvider>
          <AdminProvider>
            <MatchProvider>
              <ChatProvider>
                {/* StatusBar를 맨 위로 이동하고 더 명확한 설정 */}
                <StatusBar
                  style="dark"
                  backgroundColor="transparent"
                  translucent={true}
                />
                <Stack screenOptions={{
                  headerShown: false,
                  // Stack 네비게이션에서도 SafeArea 고려
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
    </> {/* <-- 1. 프래그먼트 닫기 */}
  );
}
// <-- 2. 불필요한 ); 와 } 삭제