import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Download, X } from 'lucide-react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 웹 환경에서만 작동
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    // 이미 설치되어 있는지 확인
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    setIsStandalone(isInStandaloneMode);
    if (isInStandaloneMode) return;

    // iOS 체크
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Android Chrome 프롬프트 캐치
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS는 수동 표시
    if (ios && !isInStandaloneMode) {
      // 2초 후 표시 (사용자가 페이지를 좀 본 후)
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // 웹이 아니거나 이미 설치됨
  if (Platform.OS !== 'web' || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
          <X size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Download size={48} color="#10b981" />
        </View>

        <Text style={styles.title}>
          {isIOS ? '홈 화면에 추가하기' : '앱 설치하기'}
        </Text>

        <Text style={styles.description}>
          {isIOS 
            ? '이 웹사이트를 홈 화면에 추가하면 앱처럼 사용할 수 있습니다.'
            : '한 번의 클릭으로 앱을 설치하고 빠르게 접속하세요!'
          }
        </Text>

        {isIOS ? (
          <View style={styles.iosInstructions}>
            <Text style={styles.instructionText}>
              1. 하단의 공유 버튼 <Text style={styles.bold}>⎋</Text> 탭
            </Text>
            <Text style={styles.instructionText}>
              2. "홈 화면에 추가" 선택
            </Text>
            <Text style={styles.instructionText}>
              3. "추가" 버튼 탭
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.installButton} onPress={handleInstallClick}>
            <Download size={20} color="white" />
            <Text style={styles.installButtonText}>지금 설치하기</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleDismiss}>
          <Text style={styles.laterText}>나중에</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    padding: 20,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute' as any,
    top: -10,
    right: 0,
    padding: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  iosInstructions: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  installButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    gap: 8,
  },
  installButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  laterText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});