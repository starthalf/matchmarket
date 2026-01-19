import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ImageBackground, StatusBar, Dimensions, ScrollView } from 'react-native'; // 1. ScrollView 추가
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Chrome, Share2, Smartphone, X, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window'); // height 추가
const PRIMARY_COLOR = '#ea4c89';

export default function Index() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const [applicantCount, setApplicantCount] = useState(5);
  const [price, setPrice] = useState(10000);
  const [isAnimating, setIsAnimating] = useState(true);

  // 1. 로그인 체크
  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  // 2. 애니메이션 로직
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setApplicantCount((prev) => (prev >= 130 ? 5 : prev + 1));
      setPrice((prev) => (prev >= 200000 ? 10000 : prev + Math.floor(Math.random() * 4 + 1) * 500));
    }, 80);
    return () => clearInterval(interval);
  }, [isAnimating]);

  // 3. PWA 설치
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
        source={require('../assets/images/influence11.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.darkOverlay}>
          <SafeAreaView style={styles.safeArea}>
            
            {/* [중요 변경] ScrollView 추가 
              contentContainerStyle에 flexGrow: 1과 justifyContent: 'space-between'을 줍니다.
              이렇게 하면 내용이 적을 땐 화면 꽉 차게 벌어지고, 많을 땐 스크롤이 됩니다.
            */}
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
            
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
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>참가신청</Text>
                    <Text style={styles.statValue}>{applicantCount}</Text>
                  </View>
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

              {/* [하단] 버튼 그룹 */}
              <View style={styles.bottomSection}>
                <TouchableOpacity style={styles.glassButton} onPress={handleAndroidInstall}>
                  <Chrome size={20} color="white" />
                  <Text style={styles.buttonText}>안드로이드 설치할게요</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.glassButton} onPress={handleIOSInstall}>
                  <Share2 size={20} color="white" />
                  <Text style={styles.buttonText}>iOS 설치할게요</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.glassButton} onPress={handleWebView}>
                  <Smartphone size={20} color="white" />
                  <Text style={styles.buttonText}>모바일 웹으로 볼래요</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
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
    // justifyContent: 'space-between', // -> 삭제 (ScrollView가 담당)
    // paddingVertical: 20, // -> 삭제 (필요 시 scrollContent padding으로 이동하거나 유지)
  },

  // [새로 추가된 스타일]
  scrollContent: {
    flexGrow: 1, // 화면이 길면 꽉 채우고, 내용이 많으면 늘어남
    justifyContent: 'space-between', // 상단-중단-하단 배치 유지
    paddingVertical: 40, // 상하 여백
  },

  // [Top Section]
  topSection: { 
    marginTop: 20, // marginTop 조절 (ScrollView 내부라서)
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
    marginVertical: 40, // marginTop 고정값 대신 상하 여백으로 유연하게
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',            
    paddingHorizontal: 40, 
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
    marginBottom: 20, // 하단 여백 확보
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
  
  // Modal (그대로 유지)
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