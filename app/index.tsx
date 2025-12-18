import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ImageBackground, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Chrome, Share2, Smartphone, X, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
// import { LinearGradient } from 'expo-linear-gradient'; // 그라데이션 필요시 설치, 없으면 아래 View overlay로 충분

const { width, height } = Dimensions.get('window');

export default function Index() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // 애니메이션 상태
  const [applicantCount, setApplicantCount] = useState(1);
  const [price, setPrice] = useState(25000);
  const [isAnimating, setIsAnimating] = useState(true);

  // 1. 로그인 체크
  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  // 2. 가격/인원 상승 애니메이션
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setApplicantCount((prev) => {
        if (prev >= 150) return 1; // 150명까지 차오르면 리셋
        return prev + 1;
      });
      setPrice((prev) => {
        if (prev >= 120000) return 25000; // 12만원까지 오르면 리셋
        return prev + Math.floor(Math.random() * 800) + 200;
      });
    }, 50); // 속도감 있게

    return () => clearInterval(interval);
  }, [isAnimating]);

  // 3. PWA 설치 로직 (기존 코드 유지)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') console.log('✅ 설치 완료');
      setDeferredPrompt(null);
    } else {
      if (Platform.OS === 'web') alert('브라우저 메뉴(⋮)에서 "앱 설치"를 선택해주세요.');
    }
  };

  const handleIOSInstall = () => setShowIOSModal(true);
  
  const handleWebView = () => router.push('/(tabs)');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 배경: 나이키 스타일의 흑백/고대비 느낌 */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1622163642998-1ea36b1dde3b?q=80&w=2662&auto=format&fit=crop' }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* 전체 반투명 오버레이 (무게감) */}
        <View style={styles.darkOverlay}>
          <SafeAreaView style={styles.safeArea}>
            
            {/* 상단: 카피라이트 */}
            <View style={styles.topSection}>
              <Text style={styles.brandLogo}>MATCH MARKET</Text>
              <View style={styles.copyContainer}>
                <Text style={styles.mainCopy}>
                  DON'T JUST PLAY,{'\n'}
                  <Text style={styles.highlight}>PROVE YOUR VALUE.</Text>
                </Text>
                <Text style={styles.subCopy}>
                  당신과 치고 싶은 사람들이 기다리고 있습니다.{'\n'}
                  실력이 곧 수익이 되는 순간.
                </Text>
              </View>
            </View>

            {/* 중간: 가격 변동 애니메이션 (핵심) */}
            <View style={styles.centerSection}>
              <View style={styles.tickerContainer}>
                <View style={styles.tickerItem}>
                  <Text style={styles.tickerLabel}>WAITING</Text>
                  <Text style={styles.tickerValue}>{applicantCount}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.tickerItem}>
                  <Text style={styles.tickerLabel}>CURRENT PRICE</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.tickerPrice}>
                      ₩ {price.toLocaleString()}
                    </Text>
                    <TrendingUp color="#ff3b30" size={24} style={styles.icon} />
                  </View>
                </View>
              </View>
              {/* 심플한 게이지 바 */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(applicantCount / 150) * 100}%` }]} />
              </View>
            </View>

            {/* 하단: 버튼 그룹 (원래 기능 유지 + 반투명 스타일 적용) */}
            <View style={styles.bottomSection}>
              {/* Android */}
              <TouchableOpacity style={styles.glassButton} onPress={handleAndroidInstall}>
                <Chrome size={20} color="white" />
                <Text style={styles.buttonText}>Android App Install</Text>
              </TouchableOpacity>

              {/* iOS */}
              <TouchableOpacity style={styles.glassButton} onPress={handleIOSInstall}>
                <Share2 size={20} color="white" />
                <Text style={styles.buttonText}>iOS App Install</Text>
              </TouchableOpacity>

              {/* Web View */}
              <TouchableOpacity style={styles.outlineButton} onPress={handleWebView}>
                <Smartphone size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.outlineButtonText}>Just Look Around</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </View>
      </ImageBackground>

      {/* iOS 모달 (스타일 다크 모드 적용) */}
      {showIOSModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowIOSModal(false)}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>iOS 설치 가이드</Text>
            <View style={styles.modalStep}>
              <Text style={styles.modalText}>1. Safari 하단 <Share2 size={16} color="#fff"/> 공유 버튼 터치</Text>
              <Text style={styles.modalText}>2. '홈 화면에 추가' 선택</Text>
            </View>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setShowIOSModal(false)}>
              <Text style={styles.modalConfirmText}>확인했습니다</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  
  // 나이키 스타일: 짙은 오버레이로 텍스트 가독성 + 분위기 확보
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // 이미지 밝기에 따라 0.4~0.7 조절
    paddingHorizontal: 24,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },

  // 상단부
  topSection: { marginTop: 20 },
  brandLogo: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 40,
    opacity: 0.8,
  },
  copyContainer: { gap: 16 },
  mainCopy: {
    fontSize: 48,
    fontWeight: '900', // Heavy Font
    color: '#fff',
    lineHeight: 52,
    fontStyle: 'italic', // 스포티한 느낌
  },
  highlight: {
    color: '#E8F836', // 테니스 공 색상 or 화이트
  },
  subCopy: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
    lineHeight: 24,
    marginTop: 10,
  },

  // 중앙부 (애니메이션)
  centerSection: {
    width: '100%',
  },
  tickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  tickerItem: { gap: 4 },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 5,
  },
  tickerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tickerValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900', // Futura 느낌
    fontVariant: ['tabular-nums'], // 숫자 너비 고정
  },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  tickerPrice: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  icon: { marginLeft: 8, marginBottom: 4 },
  
  // 게이지 바
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E8F836', // 형광 라임 (테니스공)
    borderRadius: 2,
  },

  // 하단부 (버튼)
  bottomSection: {
    gap: 12,
    marginBottom: 20,
  },
  glassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // 반투명 유리
    paddingVertical: 18,
    borderRadius: 4, // 나이키는 둥근 것보다 각진 게 어울림 (취향따라 조절)
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 4,
    gap: 10,
  },
  outlineButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // 모달 스타일 (Dark Theme)
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalClose: { position: 'absolute', top: 20, right: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20 },
  modalStep: { alignItems: 'flex-start', gap: 12, width: '100%', paddingHorizontal: 10 },
  modalText: { fontSize: 16, color: '#d1d5db', lineHeight: 24 },
  modalConfirmBtn: {
    marginTop: 30,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 4,
  },
  modalConfirmText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});