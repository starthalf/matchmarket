import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen'; // 스플래시 스크린 제어
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MatchProvider } from '@/contexts/MatchContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { InstallPrompt } from '../components/InstallPrompt';

// 스플래시 자동 숨김 방지
SplashScreen.preventAutoHideAsync().catch(() => {});

// 🔥 네비게이션 및 프로바이더 로직을 분리한 컴포넌트
function RootLayoutNav() {
  const { isLoading, user } = useAuth();

  // 로딩 상태에 따라 스플래시 스크린 제어
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // ✅ [핵심] 로딩 중일 때는 아무런 Provider도, Stack도 렌더링하지 않음 (무한 로딩 원천 차단)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAF7' }}>
        <ActivityIndicator size="large" color="#0F3D2E" />
      </View>
    );
  }

  // ✅ 로딩이 끝나면 비로소 Provider와 화면들을 렌더링함
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

  // 🔥 PWA manifest & 메타 태그 동적 주입 (웹 전용)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // manifest 링크
      if (!document.querySelector('link[rel="manifest"]')) {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);
      }

      // theme-color
      if (!document.querySelector('meta[name="theme-color"]')) {
        const themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        themeColorMeta.content = '#ea4c89';
        document.head.appendChild(themeColorMeta);
      }

      // mobile-web-app-capable
      if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
        const mobileCapableMeta = document.createElement('meta');
        mobileCapableMeta.name = 'mobile-web-app-capable';
        mobileCapableMeta.content = 'yes';
        document.head.appendChild(mobileCapableMeta);
      }

      // apple-mobile-web-app-capable
      if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
        const appleCapableMeta = document.createElement('meta');
        appleCapableMeta.name = 'apple-mobile-web-app-capable';
        appleCapableMeta.content = 'yes';
        document.head.appendChild(appleCapableMeta);
      }

      // apple-mobile-web-app-status-bar-style
      if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
        const appleStatusBarMeta = document.createElement('meta');
        appleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
        appleStatusBarMeta.content = 'default';
        document.head.appendChild(appleStatusBarMeta);
      }

      // apple-mobile-web-app-title
      if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
        const appleTitleMeta = document.createElement('meta');
        appleTitleMeta.name = 'apple-mobile-web-app-title';
        appleTitleMeta.content = '테니스';
        document.head.appendChild(appleTitleMeta);
      }

      // apple-touch-icon
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
      // 1. Pretendard 폰트 CDN 로드
      if (!document.getElementById('pretendard-font')) {
        const link = document.createElement('link');
        link.id = 'pretendard-font';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
        document.head.appendChild(link);
      }

      // 2. 전역 body 폰트 및 기본 스타일 세팅
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

  // Service Worker 등록 로직
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

  // 최상위에는 AuthProvider만 감싸고, 내부는 Nav 컴포넌트에게 위임
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
      <InstallPrompt />
    </SafeAreaProvider>
  );
}