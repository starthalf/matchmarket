import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ImageBackground, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Chrome, Share2, Smartphone, X, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#ea4c89'; // 핫핑크 포인트 컬러

export default function Index() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // 애니메이션 설정값
  const [applicantCount, setApplicantCount] = useState(5);
  const [price, setPrice] = useState(10000);
  
  const [isAnimating, setIsAnimating] = useState(true);

  // 1. 로그인 체크
  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  // 2. 가격/인원 상승 애니메이션 로직
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      
      // 인원 증가 로직 (5 -> 130)
      setApplicantCount((prev) => {
        if (prev >= 130) return 5; 
        return prev + 1;
      });

      // 가격 상승 로직 (10,000 -> 200,000)
      setPrice((prev) => {
        if (prev >= 200000) return 10000; 
        return prev + Math.floor(Math.random() * 4 + 1) * 500;
      });

    }, 80); // 0.08초마다 갱신

    return () => clearInterval(interval);
  }, [isAnimating]);

  // 3. PWA 설치 프롬프트
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
      
      <ImageBackground
        source={{ uri: 'https://xroiblqjsxxoewfyrzjy.supabase.co/storage/v1/object/public/images/influence10.png' }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.darkOverlay}>
          <SafeAreaView style={styles.safeArea}>
            
            {/* [상단] 카피 영역 */}
            <View style={styles.topSection}>
              <Text style={styles.brandLogo}>MATCH MARKET</Text>
              <View style={styles.copyContainer}>
                <Text style={styles.mainCopy}>
                  Sell Your{'\n'}Tennis
                </Text>
                <Text style={styles.subCopy}>
                  고수, 선출, 인플루언서와 치고 싶은 사람들이 기다려요
                </Text>
              </View>
            </View>

            {/* [중간] 통계 섹션 */}
            <View style={styles.centerSection}>
              <View style={styles.statsRow}>
                
                {/* 왼쪽: 참가신청 */}
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>참가신청</Text>
                  <Text style={styles.statValue}>{applicantCount}</Text>
                </View>

                {/* 오른쪽: 나의 매치 가격 */}
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>나의 매치</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.statValue}>
                      ₩ {price.toLocaleString()}
                    </Text>
                    <TrendingUp 
                      color={PRIMARY_COLOR} 
                      size={28} 
                      strokeWidth={3}
                      style={styles.icon} 
                    />
                  </View>
                </View>

              </View>
            </View>

            {/* [하단] 버튼 그룹 (3개 모두 동일 디자인) */}
            <View style={styles.bottomSection}>
              {/* Android */}
              <TouchableOpacity style={styles.glassButton} onPress={handleAndroidInstall}>
                <Chrome size={20} color="white" />
                <Text style={styles.buttonText}>안드로이드 설치할게요</Text>
              </TouchableOpacity>

              {/* iOS */}
              <TouchableOpacity style={styles.glassButton} onPress={handleIOSInstall}>
                <Share2 size={20} color="white" />
                <Text style={styles.buttonText}>iOS 설치할게요</Text>
              </TouchableOpacity>

              {/* Web (스타일 동일하게 변경됨) */}
              <TouchableOpacity style={styles.glassButton} onPress={handleWebView}>
                <Smartphone size={20} color="white" />
                <Text style={styles.buttonText}>모바일 웹으로 볼래요</Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </View>
      </ImageBackground>

      {/* iOS 모달 */}
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
  
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 20,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },

  // [Top Section]
  topSection: { 
    marginTop: 60,
    alignItems: 'center', 
  },
  brandLogo: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 24,
    opacity: 0.7,
  },
  copyContainer: { 
    alignItems: 'center', 
    gap: 16 
  },
  mainCopy: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 54,
    textAlign: 'center', 
    fontStyle: 'italic',
  },
  subCopy: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },

  // [Center Section]
  centerSection: { 
    width: '100%',
    marginTop: 100, // 위에서 아래로 위치 내림
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',            
    paddingHorizontal: 40, // 좌우 여백 확보
  },
  statItem: {
    alignItems: 'center', 
    minWidth: 100,        
  },
  statLabel: {
    color: '#fff',
    fontSize: 16,        
    fontWeight: '500',
    marginBottom: 8,     
    opacity: 0.9,
    textAlign: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 36,        
    fontWeight: '900',
    fontVariant: ['tabular-nums'], 
    letterSpacing: -0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, 
  },
  icon: {
    marginBottom: 4, 
  },

  // [Bottom Section]
  bottomSection: {
    gap: 12,
    marginBottom: 40,
  },
  glassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Modal
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
    backgroundColor: PRIMARY_COLOR, 
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  modalConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});