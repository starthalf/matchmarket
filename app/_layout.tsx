import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MatchProvider } from '@/contexts/MatchContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { InstallPrompt } from '../components/InstallPrompt';
import { UpdateBanner } from '../components/UpdateBanner';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAF7' }}>
        <ActivityIndicator size="large" color="#0F3D2E" />
      </View>
    );
  }

  return (
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
            contentStyle: { backgroundColor: '#FAFAF7' }
          }}>
            <Stack.Screen name="+not-found" />
          </Stack>
        </ChatProvider>
      </MatchProvider>
    </AdminProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  // 🔥 PWA 업데이트 관련 state
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  // 🔥 PWA manifest & 메타 태그 동적 주입 (웹 전용)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);
      }

      if (!document.querySelector('meta[name="theme-color"]')) {
        const themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        themeColorMeta.content = '#ea4c89';
        document.head.appendChild(themeColorMeta);
      }

      if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
        const mobileCapableMeta = document.createElement('meta');
        mobileCapableMeta.name = 'mobile-web-app-capable';
        mobileCapableMeta.content = 'yes';
        document.head.appendChild(mobileCapableMeta);
      }

      if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const appleCapableMeta = document.createElement('meta');
        appleCapableMeta.name = 'apple-mobile-web-app-capable';
        appleCapableMeta.content = 'yes';
        document.head.appendChild(appleCapableMeta);
      }

      if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
        const appleStatusBarMeta = document.createElement('meta');
        appleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
        appleStatusBarMeta.content = 'default';
        document.head.appendChild(appleStatusBarMeta);
      }

      if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
        const appleTitleMeta = document.createElement('meta');
        appleTitleMeta.name = 'apple-mobile-web-app-title';
        appleTitleMeta.content = '테니스';
        document.head.appendChild(appleTitleMeta);
      }

      if (!document.querySelector('link[rel="apple-touch-icon"]')) {
        const appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        appleIconLink.href = '/assets/images/icon-192.png';
        document.head.appendChild(appleIconLink);
      }
    }
  }, []);

  // ✨ Pretendard 웹폰트 로드 + 전역 폰트 세팅 (웹 전용)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('pretendard-font')) {
        const link = document.createElement('link');
        link.id = 'pretendard-font';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
        document.head.appendChild(link);
      }

      if (!document.getElementById('matchmarket-global-style')) {
        const style = document.createElement('style');
        style.id = 'matchmarket-global-style';
        style.innerHTML = `
          html, body, #root, #__next {
            font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            background-color: #FAFAF7;
          }
          * {
            font-family: inherit;
          }
          input, textarea, select, button {
            font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // 🔥 Service Worker 등록 + 자동 업데이트 감지
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration);

            // 🔥 1시간마다 새 버전 체크
            setInterval(() => {
              console.log('🔍 Service Worker 업데이트 체크');
              registration.update();
            }, 60 * 60 * 1000);

            // 🔥 새 버전 감지 시 배너 표시
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('🆕 새 버전이 설치되었습니다');
                    waitingWorkerRef.current = newWorker;
                    setShowUpdateBanner(true);
                  }
                });
              }
            });

            // 🔥 페이지 로드 시 이미 대기 중인 새 버전이 있는지 체크
            if (registration.waiting && navigator.serviceWorker.controller) {
              console.log('🆕 대기 중인 새 버전 발견');
              waitingWorkerRef.current = registration.waiting;
              setShowUpdateBanner(true);
            }
          })
          .catch((error) => {
            console.log('❌ Service Worker registration failed:', error);
          });
      });

      // 🔥 새 SW 활성화되면 페이지 새로고침
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        console.log('🔄 새 버전 적용, 새로고침합니다');
        window.location.reload();
      });
    }
  }, []);

  // 네이티브 에러 처리 로직
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

  // 🔥 사용자가 업데이트 버튼 클릭 시
  const handleUpdate = () => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateBanner(false);
  };

  // 🔥 사용자가 배너 닫기 클릭 시
  const handleDismissUpdate = () => {
    setShowUpdateBanner(false);
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
      <InstallPrompt />
      <UpdateBanner
        visible={showUpdateBanner}
        onUpdate={handleUpdate}
        onDismiss={handleDismissUpdate}
      />
    </SafeAreaProvider>
  );
}