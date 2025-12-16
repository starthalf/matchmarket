import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Star, MapPin, Clock, Users, TrendingUp, CheckCircle, Smartphone, Share2, Chrome, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // 이미 로그인되어 있으면 메인으로
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  // PWA 프롬프트 캐치 (웹 환경에서만)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // iOS 체크
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Android Chrome 프롬프트 캐치
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstall = async () => {
    // Android에서 설치 프롬프트가 있으면 표시
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA 설치 완료!');
      }
      
      setDeferredPrompt(null);
    } else {
      // deferredPrompt가 없을 때 안내
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        alert('📱 앱 설치 방법:\n\n1. 브라우저 주소창 옆의 설치 아이콘(⊕) 클릭\n또는\n2. 브라우저 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가" 선택');
      }
    }
  };

  const handleIOSInstall = () => {
    // iOS는 설치 안내 모달 표시
    setShowIOSModal(true);
  };

  const handleWebView = () => {
    // 모바일웹으로 볼게요 → 로그인으로
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 히어로 섹션 */}
        <View style={styles.hero}>
          {/* 배경 블러 카드 */}
          <View style={styles.backgroundCard}>
            <View style={styles.blurCard}>
              <View style={styles.cardContent}>
                <View style={styles.sellerSection}>
                  <View style={styles.profileImageBg}>
                    <Text style={styles.profileInitial}>A</Text>
                  </View>
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerNameRow}>
                      <Text style={styles.sellerNameBg}>aesthetic.vibes</Text>
                      <View style={styles.badges}>
                        <CheckCircle size={12} color="#10b981" fill="#10b981" />
                        <CheckCircle size={12} color="#3b82f6" fill="#3b82f6" />
                        <CheckCircle size={12} color="#ec4899" fill="#ec4899" />
                      </View>
                    </View>
                    <Text style={styles.sellerMetaBg}>여성 · 20대 · 선수 · NTRP 4.2</Text>
                    <View style={styles.ratingRow}>
                      <Star size={12} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.ratingBg}>4.7</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.matchTitleBg}>여선출과 2:2 복식, 고수환영</Text>
                <View style={styles.priceInfo}>
                  <Text style={styles.priceBg}>26,700원</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 오버레이 */}
          <View style={styles.overlay} />

          {/* 메인 콘텐츠 */}
          <View style={styles.mainContent}>
            <View style={styles.textCenter}>
              <Text style={styles.logo}>MatchMarket</Text>
              <Text style={styles.title}>
                인기 높은 매치에 참여하세요{'\n'}
                당신이 호스트라면, 인기가 높을수록{'\n'}
                수익이 늘어나요
              </Text>
            </View>

            {/* 메인 카드 */}
            <View style={styles.mainCard}>
              <View style={styles.sellerSection}>
                <View style={styles.profileImage}>
                  <Text style={styles.profileInitial}>A</Text>
                </View>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>aesthetic.vibes</Text>
                    <View style={styles.badges}>
                      <CheckCircle size={12} color="#10b981" fill="#10b981" />
                      <CheckCircle size={12} color="#3b82f6" fill="#3b82f6" />
                      <CheckCircle size={12} color="#ec4899" fill="#ec4899" />
                    </View>
                  </View>
                  <Text style={styles.sellerMeta}>여성 · 20대 · 선수 · NTRP 4.2</Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.rating}>4.7</Text>
                    <Text style={styles.reviewLink}>리뷰 보기</Text>
                  </View>
                </View>
              </View>

              <View style={styles.matchHeader}>
                <Text style={styles.matchTitle}>여선출과 2:2 복식, 고수환영</Text>
                <View style={styles.genderBadge}>
                  <Text style={styles.genderBadgeText}>혼복, 남복</Text>
                </View>
              </View>

              <View style={styles.matchDetails}>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.detailText}>11-01 19:00~22:00</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.detailText}>양재테니스장</Text>
                </View>
                <View style={styles.detailRow}>
                  <Users size={14} color="#6b7280" />
                  <Text style={styles.detailText}>NTRP 3.0-4.5</Text>
                </View>
              </View>

              <View style={styles.viewCount}>
                <Text style={styles.viewCountText}>👁️ 1850</Text>
              </View>

              <View style={styles.priceSection}>
                <Text style={styles.price}>26,700원</Text>
                <View style={styles.priceChange}>
                  <TrendingUp size={12} color="#ef4444" />
                  <Text style={styles.priceChangeText}>7%</Text>
                </View>
              </View>
            </View>

            {/* 버튼들 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.androidButton} onPress={handleAndroidInstall}>
                <Chrome size={20} color="white" />
                <Text style={styles.buttonText}>설치할게요 (Android 버전)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iosButton} onPress={handleIOSInstall}>
                <Share2 size={20} color="white" />
                <Text style={styles.buttonText}>설치할게요 (iOS 버전)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.webButton} onPress={handleWebView}>
                <Smartphone size={20} color="#374151" />
                <Text style={styles.webButtonText}>모바일웹으로 볼게요</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 실시간 인기 매치 */}
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>실시간 인기 매치</Text>

          <View style={styles.matchGrid}>
            {/* 매치 카드 1 */}
            <View style={styles.compactCard}>
              <View style={styles.compactBadge}>
                <Text style={styles.compactBadgeText}>여복</Text>
              </View>
              <View style={styles.compactHeader}>
                <View style={styles.compactProfileBg}>
                  <Text style={styles.compactProfileText}>U</Text>
                </View>
                <View style={styles.compactInfo}>
                  <View style={styles.compactNameRow}>
                    <Text style={styles.compactName}>urban.explorer</Text>
                    <View style={styles.badges}>
                      <CheckCircle size={12} color="#10b981" fill="#10b981" />
                      <CheckCircle size={12} color="#3b82f6" fill="#3b82f6" />
                    </View>
                  </View>
                  <Text style={styles.compactMeta}>남성 · 30대 · 선수 · NTRP 4.5</Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.compactRating}>4.5</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.compactTitle}>캐나다 수자, 일상자 모임</Text>
              <View style={styles.compactDetails}>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.detailText}>10-31 19:00~22:00</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.detailText}>강남테니스장</Text>
                </View>
              </View>
              <View style={styles.compactFooter}>
                <Text style={styles.viewCountText}>👁️ 2350</Text>
                <View style={styles.compactPriceRow}>
                  <Text style={styles.compactPrice}>10,900원</Text>
                  <View style={styles.priceChange}>
                    <TrendingUp size={12} color="#ef4444" />
                    <Text style={styles.priceChangeText}>5%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 매치 카드 2 */}
            <View style={styles.compactCard}>
              <View style={styles.compactBadge}>
                <Text style={styles.compactBadgeText}>남복</Text>
              </View>
              <View style={styles.compactHeader}>
                <View style={[styles.compactProfileBg, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.compactProfileText}>S</Text>
                </View>
                <View style={styles.compactInfo}>
                  <View style={styles.compactNameRow}>
                    <Text style={styles.compactName}>sports.pro</Text>
                    <View style={styles.badges}>
                      <CheckCircle size={12} color="#10b981" fill="#10b981" />
                      <CheckCircle size={12} color="#3b82f6" fill="#3b82f6" />
                      <CheckCircle size={12} color="#ec4899" fill="#ec4899" />
                    </View>
                  </View>
                  <Text style={styles.compactMeta}>남성 · 20대 · 선수 · NTRP 4.8</Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.compactRating}>4.9</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.compactTitle}>강남 주말 테니스 클럽</Text>
              <View style={styles.compactDetails}>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.detailText}>11-02 10:00~13:00</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.detailText}>올림픽공원테니스장</Text>
                </View>
              </View>
              <View style={styles.compactFooter}>
                <Text style={styles.viewCountText}>👁️ 3120</Text>
                <View style={styles.compactPriceRow}>
                  <Text style={styles.compactPrice}>15,500원</Text>
                  <View style={styles.priceChange}>
                    <TrendingUp size={12} color="#ef4444" />
                    <Text style={styles.priceChangeText}>9%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 매치 카드 3 */}
            <View style={styles.compactCard}>
              <View style={styles.compactBadge}>
                <Text style={styles.compactBadgeText}>혼복</Text>
              </View>
              <View style={styles.compactHeader}>
                <View style={[styles.compactProfileBg, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.compactProfileText}>M</Text>
                </View>
                <View style={styles.compactInfo}>
                  <View style={styles.compactNameRow}>
                    <Text style={styles.compactName}>match.maker</Text>
                    <View style={styles.badges}>
                      <CheckCircle size={12} color="#10b981" fill="#10b981" />
                    </View>
                  </View>
                  <Text style={styles.compactMeta}>여성 · 30대 · 아마추어 · NTRP 3.5</Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.compactRating}>4.2</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.compactTitle}>평일 저녁 복식 게임</Text>
              <View style={styles.compactDetails}>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.detailText}>11-03 18:00~21:00</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.detailText}>서래마을테니스장</Text>
                </View>
              </View>
              <View style={styles.compactFooter}>
                <Text style={styles.viewCountText}>👁️ 1680</Text>
                <View style={styles.compactPriceRow}>
                  <Text style={styles.compactPrice}>18,900원</Text>
                  <View style={styles.priceChange}>
                    <TrendingUp size={12} color="#ef4444" />
                    <Text style={styles.priceChangeText}>3%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 설치 방법 */}
        <View style={styles.installSection}>
          <Text style={styles.installTitle}>설치 방법</Text>
          <View style={styles.installSteps}>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>위 버튼 클릭하여 앱 시작</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Android: 자동 설치 프롬프트에서 "설치" 클릭{'\n'}
                iOS: Safari 하단 공유 버튼 → "홈 화면에 추가"
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>홈 화면에서 앱 아이콘을 찾아 실행!</Text>
            </View>
          </View>
        </View>

        {/* iOS 설치 안내 모달 */}
        {showIOSModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.modalClose}
                onPress={() => setShowIOSModal(false)}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>iOS 설치 방법</Text>
              
              <View style={styles.modalSteps}>
                <View style={styles.modalStep}>
                  <View style={styles.modalStepNumber}>
                    <Text style={styles.modalStepNumberText}>1</Text>
                  </View>
                  <Text style={styles.modalStepText}>
                    Safari 하단의 공유 버튼 탭
                  </Text>
                </View>

                <View style={styles.modalStep}>
                  <View style={styles.modalStepNumber}>
                    <Text style={styles.modalStepNumberText}>2</Text>
                  </View>
                  <Text style={styles.modalStepText}>
                    "홈 화면에 추가" 선택
                  </Text>
                </View>

                <View style={styles.modalStep}>
                  <View style={styles.modalStepNumber}>
                    <Text style={styles.modalStepNumberText}>3</Text>
                  </View>
                  <Text style={styles.modalStepText}>
                    "추가" 버튼 탭하여 완료!
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => {
                  setShowIOSModal(false);
                  router.push('/auth/login');
                }}
              >
                <Text style={styles.modalButtonText}>웹으로 계속하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 푸터 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 MatchMarket. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  hero: {
    position: 'relative',
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  backgroundCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  blurCard: {
    width: '100%',
    maxWidth: 600,
    opacity: 0.4,
    transform: [{ scale: 1.1 }],
  },
  cardContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  mainContent: {
    position: 'relative',
    zIndex: 10,
  },
  textCenter: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ec4899',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    lineHeight: 32,
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 32,
  },
  sellerSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileImageBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sellerNameBg: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  sellerMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  sellerMetaBg: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  ratingBg: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  reviewLink: {
    fontSize: 12,
    color: '#ec4899',
    marginLeft: 4,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  matchTitleBg: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  genderBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  genderBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  matchDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  viewCount: {
    marginBottom: 16,
  },
  viewCountText: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ef4444',
  },
  priceBg: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ef4444',
  },
  priceInfo: {
    marginTop: 12,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  buttonContainer: {
    gap: 12,
  },
  androidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  webButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  webButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  popularSection: {
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
  },
  matchGrid: {
    gap: 16,
  },
  compactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    position: 'relative',
  },
  compactBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  compactHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  compactProfileBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactProfileText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  compactInfo: {
    flex: 1,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  compactMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  compactRating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  compactDetails: {
    gap: 8,
    marginBottom: 16,
  },
  compactFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ef4444',
  },
  installSection: {
    paddingHorizontal: 20,
    paddingVertical: 64,
    backgroundColor: '#f9fafb',
  },
  installTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 48,
  },
  installSteps: {
    gap: 32,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    paddingTop: 12,
  },
  footer: {
    paddingVertical: 40,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalSteps: {
    gap: 16,
    marginBottom: 24,
  },
  modalStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12, 
  },
  modalStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalStepText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    paddingTop: 4,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});