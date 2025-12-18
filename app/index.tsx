import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ImageBackground, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Chrome, Share2, Smartphone, X, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function Index() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // 애니메이션 상태값
  const [applicantCount, setApplicantCount] = useState(1);
  const [price, setPrice] = useState(25000);
  const [isAnimating, setIsAnimating] = useState(true);

  // 1. 로그인 체크
  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  // 2. 가격/인원 상승 애니메이션 (호스트 유입용 연출)
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
    }, 50); // 속도 (ms)

    return () => clearInterval(interval);
  }, [isAnimating]);

  // 3. PWA 설치 프롬프트 (Android/Web)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
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
      
      {/* 배경 이미지: 전달해주신 Supabase URL 적용 */}
      <ImageBackground
        source={{ uri: 'https://xroiblqjsxxoewfyrzjy.supabase.co/storage/v1/object/public/images/influence3.jpg.png' }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* 다크 오버레이: 텍스트 가독성을 위해 반투명 검정막 추가 */}
        {/* 만약 배경 사진을 더 밝게 보고 싶으면 0.5를 0.3 정도로 낮추세요 */}
        <View style={styles.darkOverlay}>
          <SafeAreaView style={styles.safeArea}>
            
            {/* [상단] 브랜드 & 카피라이트 */}
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

            {/* [중간] 실시간 가치 상승 애니메이션 */}
            <View style={styles.centerSection}>
              <View style={styles.tickerContainer}>
                {/* 대기자 수 */}
                <View style={styles.tickerItem}>
                  <Text style={styles.tickerLabel}>WAITING</Text>
                  <Text style={styles.tickerValue}>{applicantCount}</Text>
                </View>
                
                <View style={styles.divider} />
                
                {/* 현재 가치 (가격) */}
                <View style={styles.tickerItem}>
                  <Text style={styles.tickerLabel}>CURRENT VALUE</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.tickerPrice}>
                      ₩ {price.toLocaleString()}
                    </Text>
                    <TrendingUp color="#E8F836" size={24} style={styles.icon} />
                  </View>
                </View>
              </View>
              
              {/* 게이지 바 */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(applicantCount / 150) * 100}%` }]} />
              </View>
            </View>

            {/* [하단] 설치 및 입장 버튼 */}
            <View style={styles.bottomSection}>
              {/* Android */}
              <TouchableOpacity style={styles.glassButton} onPress={handleAndroidInstall}>
                <Chrome size={20} color="white" />
                <Text style={styles.buttonText}>App Install (Android)</Text>
              </TouchableOpacity>

              {/* iOS */}
              <TouchableOpacity style={styles.glassButton} onPress={handleIOSInstall}>
                <Share2 size={20} color="white" />
                <Text style={styles.buttonText}>App Install (iOS)</Text>
              </TouchableOpacity>

              {/* Web */}
              <TouchableOpacity style={styles.outlineButton} onPress={handleWebView}>
                <Smartphone size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.outlineButtonText}>Just Look Around</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </View>
      </ImageBackground>

      {/* iOS 설치 안내 모달 */}
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
              <Text style={styles.modalText}>3. 홈 화면의 아이콘으로 접속</Text>
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
  
  // 전체 오버레이: 이미지 톤 다운 & 텍스트 가독성 확보
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // 숫자가 높을수록 어두워짐 (0.0 ~ 1.0)
    paddingHorizontal: 24,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },

  // [Top]
  topSection: { marginTop: 40 },
  brandLogo: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 30,
    opacity: 0.8,
  },
  copyContainer: { gap: 16 },
  mainCopy: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 46,
    fontStyle: 'italic',
  },
  highlight: {
    color: '#E8F836', // 테니스공 색상 (형광 라임)
  },
  subCopy: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
    lineHeight: 24,
    marginTop: 8,
  },

  // [Center]
  centerSection: { width: '100%' },
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
    marginBottom: 6,
  },
  tickerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tickerValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  tickerPrice: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  icon: { marginLeft: 8, marginBottom: 4 },
  
  // Progress Bar
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E8F836',
    borderRadius: 2,
  },

  // [Bottom]
  bottomSection: {
    gap: 12,
    marginBottom: 30,
  },
  glassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Glassmorphism
    paddingVertical: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 4,
    gap: 10,
  },
  outlineButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // Modal Style (Dark Theme)
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
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalClose: { position: 'absolute', top: 16, right: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 20 },
  modalStep: { alignItems: 'flex-start', gap: 12, width: '100%', paddingHorizontal: 10 },
  modalText: { fontSize: 15, color: '#d1d5db', lineHeight: 22 },
  modalConfirmBtn: {
    marginTop: 24,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 4,
  },
  modalConfirmText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
});