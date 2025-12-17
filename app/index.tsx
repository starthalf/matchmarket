import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ImageBackground, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { TrendingUp, ChevronRight, Chrome, Share2, Smartphone, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient'; // expo-linear-gradient 설치 필요: npx expo install expo-linear-gradient

// 만약 LinearGradient 설치가 안되어 있다면 View로 대체하거나 설치해주세요.
// 설치가 귀찮으시다면 아래 주석을 풀고 LinearGradient 컴포넌트를 View로 대체하는 간단한 shim을 만드셔도 됩니다.
/*
const LinearGradient = ({ colors, style, children }: any) => (
  <View style={[style, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>{children}</View>
);
*/

const { width } = Dimensions.get('window');

export default function Index() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // 애니메이션 상태값
  const [applicantCount, setApplicantCount] = useState(1);
  const [price, setPrice] = useState(25000);
  const [isAnimating, setIsAnimating] = useState(true);

  // 로그인 체크
  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  // 가격 상승 애니메이션 로직
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setApplicantCount((prev) => {
        if (prev >= 42) { // 목표 신청자 수 도달 시 리셋 혹은 멈춤
          // setIsAnimating(false); // 멈추려면 주석 해제
          return 1; // 무한 반복
        }
        return prev + 1;
      });

      setPrice((prev) => {
        if (prev >= 88000) return 25000; // 가격 리셋
        // 신청자가 늘어날수록 가격이 가파르게 상승하는 연출
        return prev + Math.floor(Math.random() * 1500) + 500;
      });
    }, 80); // 속도 조절

    return () => clearInterval(interval);
  }, [isAnimating]);

  // PWA 설치 로직 (기존 유지)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else if (Platform.OS === 'web') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) setShowIOSModal(true);
      else alert('브라우저 메뉴에서 "앱 설치"를 선택해주세요.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 배경 이미지: 여성 테니스 선수 (Unsplash 예시 이미지) */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?q=80&w=1974&auto=format&fit=crop' }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* 그라데이션 오버레이: 텍스트 가독성 확보 */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea}>
            
            {/* 상단 로고 */}
            <View style={styles.header}>
              <Text style={styles.logoText}>MatchMarket</Text>
            </View>

            {/* 메인 컨텐츠 */}
            <View style={styles.contentContainer}>
              
              {/* 메인 카피 */}
              <View style={styles.textSection}>
                <Text style={styles.subTitle}>Premium Tennis Matching</Text>
                <Text style={styles.mainTitle}>
                  당신과 치고 싶은{'\n'}사람들이{'\n'}기다리고 있습니다.
                </Text>
                <Text style={styles.description}>
                  당신의 실력이 증명될수록{'\n'}매치의 가치는 올라갑니다.
                </Text>
              </View>

              {/* 가격 상승 애니메이션 카드 */}
              <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE MATCHING</Text>
                  </View>
                  <Text style={styles.hostLabel}>HOST. 김테니 프로</Text>
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>현재 신청자</Text>
                    <Text style={styles.statValue}>{applicantCount}명</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>현재 참여금</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.statPrice}>
                        {price.toLocaleString()}원
                      </Text>
                      <TrendingUp size={20} color="#ff4757" style={{marginLeft: 4}}/>
                    </View>
                  </View>
                </View>

                {/* 게이지 바 애니메이션 */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${(applicantCount / 42) * 100}%` }]} />
                </View>
              </View>

            </View>

            {/* 하단 버튼 그룹 */}
            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.primaryButtonText}>호스트로 시작하기</Text>
                <ChevronRight size={20} color="#000" />
              </TouchableOpacity>

              <View style={styles.secondaryButtonRow}>
                <TouchableOpacity style={styles.textButton} onPress={handleInstall}>
                  <Text style={styles.textButtonText}>앱 설치하기</Text>
                </TouchableOpacity>
                <View style={styles.verticalLine} />
                <TouchableOpacity style={styles.textButton} onPress={() => router.push('/(tabs)')}>
                  <Text style={styles.textButtonText}>게스트로 둘러보기</Text>
                </TouchableOpacity>
              </View>
            </View>

          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>

      {/* iOS 설치 모달 (기존 로직 유지) */}
      {showIOSModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowIOSModal(false)}>
              <X size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>홈 화면에 추가하기</Text>
            <Text style={styles.modalDesc}>Safari 하단 <Share2 size={16} color="#000"/> 버튼을 누르고{'\n'}'홈 화면에 추가'를 선택하세요.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    paddingHorizontal: 24,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 40,
  },
  textSection: {
    gap: 12,
  },
  subTitle: {
    color: '#ec4899', // 핑크 포인트 컬러
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 50,
  },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 24,
    fontWeight: '400',
  },
  
  // 글래스모피즘 카드 스타일
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // 투명도 조절
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  hostLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 20,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statPrice: {
    color: '#fff', // 핑크색 강조
    fontSize: 24,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ec4899', // 게이지 색상
  },

  bottomSection: {
    paddingBottom: 40,
    gap: 20,
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  textButton: {
    padding: 8,
  },
  textButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  verticalLine: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // 모달 스타일
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDesc: {
    textAlign: 'center',
    color: '#555',
    lineHeight: 20,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});