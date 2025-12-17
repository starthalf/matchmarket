import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Star, MapPin, Clock, Users, TrendingUp, CheckCircle, Smartphone, Share2, Chrome, X, Zap } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // 가격 상승 애니메이션
  const [animatedViews, setAnimatedViews] = useState(1850);
  const [animatedPrice, setAnimatedPrice] = useState(26700);
  const [viewingNow, setViewingNow] = useState(12);
  const priceAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

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

  // 가격 상승 애니메이션 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedViews(prev => {
        const newViews = prev + Math.floor(Math.random() * 15) + 5;
        return newViews;
      });
      setAnimatedPrice(prev => {
        const increase = Math.floor(Math.random() * 300) + 100;
        return prev + increase;
      });
      setViewingNow(Math.floor(Math.random() * 15) + 8);
      
      // 가격 변경 시 펄스 효과
      Animated.sequence([
        Animated.timing(priceAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(priceAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }, 3000);

    // 글로우 애니메이션 (반복)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // 펄스 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const priceScale = priceAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA 설치 완료!');
      }
      
      setDeferredPrompt(null);
    } else {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        alert('📱 앱 설치 방법:\n\n1. 브라우저 주소창 옆의 설치 아이콘(⊕) 클릭\n또는\n2. 브라우저 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가" 선택');
      }
    }
  };

  const handleIOSInstall = () => {
    setShowIOSModal(true);
  };

  const handleWebView = () => {
    router.push('/(tabs)');
  };

  const handleStartHost = () => {
    router.push('/(tabs)/register');
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
                  <Image
                    source={{ uri: 'https://gpepbpazzcoiwqgvkmov.supabase.co/storage/v1/object/public/avatars/aesthetic-vibes.png' }}
                    style={styles.profileImageBg}
                  />
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerNameRow}>
                      <Text style={styles.sellerNameBg}>Luvly_ssoo</Text>
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
                당신과 치고 싶은 사람들이{'\n'}
                기다리고 있어요
              </Text>
              <Text style={styles.subTitle}>
                인기가 오르면, 매치 가격도 함께
              </Text>
            </View>

            {/* 메인 카드 - 애니메이션 적용 */}
            <Animated.View style={[styles.mainCard, { transform: [{ scale: pulseAnimation }] }]}>
              <View style={styles.sellerSection}>
                <Image
                  source={{ uri: 'https://gpepbpazzcoiwqgvkmov.supabase.co/storage/v1/object/public/avatars/aesthetic-vibes.png' }}
                  style={styles.profileImage}
                />
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>Luvly_ssoo</Text>
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

              {/* 실시간 조회수 - 애니메이션 */}
              <View style={styles.viewCountSection}>
                <Animated.View style={[styles.viewCountBadge, { opacity: glowOpacity }]}>
                  <Zap size={10} color="#92400e" />
                  <Text style={styles.viewCountLabel}>실시간</Text>
                </Animated.View>
                <View style={styles.viewCountRow}>
                  <Text style={styles.viewCountText}>👁️ {animatedViews.toLocaleString()}</Text>
                  <Text style={styles.viewCountUp}>+{viewingNow}명 지금 보는 중</Text>
                </View>
              </View>

              {/* 가격 섹션 - 애니메이션 */}
              <View style={styles.priceSection}>
                <View>
                  <Text style={styles.priceLabel}>현재 매치 가격</Text>
                  <Animated.Text style={[
                    styles.price, 
                    { transform: [{ scale: priceScale }] }
                  ]}>
                    {animatedPrice.toLocaleString()}원
                  </Animated.Text>
                </View>
                <View style={styles.priceChangeBox}>
                  <TrendingUp size={14} color="#ffffff" />
                  <Text style={styles.priceChangeTextNew}>+12%</Text>
                  <Text style={styles.priceChangeDesc}>오늘</Text>
                </View>
              </View>
            </Animated.View>

            {/* 버튼들 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.hostButton} onPress={handleStartHost}>
                <Text style={styles.hostButtonText}>호스트로 시작하기</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.androidButton} onPress={handleAndroidInstall}>
                <Chrome size={20} color="white" />
                <Text style={styles.buttonText}>앱 설치 (Android)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iosButton} onPress={handleIOSInstall}>
                <Share2 size={20} color="white" />
                <Text style={styles.buttonText}>앱 설치 (iOS)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.webButton} onPress={handleWebView}>
                <Smartphone size={20} color="#374151" />
                <Text style={styles.webButtonText}>먼저 둘러볼게요</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 호스트 타겟 섹션 */}
        <View style={styles.targetSection}>
          <Text style={styles.targetTitle}>이런 분들이 호스트로 활동 중</Text>
          <View style={styles.targetGrid}>
            <View style={styles.targetCard}>
              <Text style={styles.targetEmoji}>🎾</Text>
              <Text style={styles.targetLabel}>테니스 고수</Text>
              <Text style={styles.targetDesc}>실력으로 인정받고{'\n'}팬을 만들어보세요</Text>
            </View>
            <View style={styles.targetCard}>
              <Text style={styles.targetEmoji}>📱</Text>
              <Text style={styles.targetLabel}>인플루언서</Text>
              <Text style={styles.targetDesc}>팔로워와 직접{'\n'}만나는 특별한 경험</Text>
            </View>
            <View style={styles.targetCard}>
              <Text style={styles.targetEmoji}>🏆</Text>
              <Text style={styles.targetLabel}>선수 출신</Text>
              <Text style={styles.targetDesc}>당신의 노하우를{'\n'}나눠주세요</Text>
            </View>
            <View style={styles.targetCard}>
              <Text style={styles.targetEmoji}>👩</Text>
              <Text style={styles.targetLabel}>여성 플레이어</Text>
              <Text style={styles.targetDesc}>여복/혼복 매치{'\n'}항상 인기 폭발</Text>
            </View>
          </View>
        </View>

        {/* 수익 시뮬레이션 */}
        <View style={styles.earnSection}>
          <Text style={styles.earnTitle}>인기 호스트들의 한 달</Text>
          <View style={styles.earnCard}>
            <View style={styles.earnRow}>
              <Text style={styles.earnLabel}>평균 매치</Text>
              <Text style={styles.earnValue}>월 4회</Text>
            </View>
            <View style={styles.earnRow}>
              <Text style={styles.earnLabel}>매치당 참가자</Text>
              <Text style={styles.earnValue}>3~4명</Text>
            </View>
            <View style={styles.earnRow}>
              <Text style={styles.earnLabel}>평균 매치 가격</Text>
              <Text style={styles.earnValue}>25,000원</Text>
            </View>
            <View style={styles.earnDivider} />
            <View style={styles.earnRow}>
              <Text style={styles.earnTotalLabel}>예상 월 수익</Text>
              <Text style={styles.earnTotalValue}>30~40만원</Text>
            </View>
            <Text style={styles.earnNote}>* 인기도에 따라 가격이 자동 상승해요</Text>
          </View>
        </View>

        {/* 어떻게 작동하나요? */}
        <View style={styles.howSection}>
          <Text style={styles.howTitle}>어떻게 작동하나요?</Text>
          <View style={styles.howSteps}>
            <View style={styles.howStep}>
              <View style={styles.howStepNumber}>
                <Text style={styles.howStepNumberText}>1</Text>
              </View>
              <View style={styles.howStepContent}>
                <Text style={styles.howStepTitle}>매치 등록</Text>
                <Text style={styles.howStepDesc}>날짜, 장소, 기본 가격을 설정하세요</Text>
              </View>
            </View>
            <View style={styles.howStepLine} />
            <View style={styles.howStep}>
              <View style={[styles.howStepNumber, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.howStepNumberText}>2</Text>
              </View>
              <View style={styles.howStepContent}>
                <Text style={styles.howStepTitle}>인기 상승</Text>
                <Text style={styles.howStepDesc}>조회수가 오르면 가격도 자동 상승</Text>
              </View>
            </View>
            <View style={styles.howStepLine} />
            <View style={styles.howStep}>
              <View style={[styles.howStepNumber, { backgroundColor: '#10b981' }]}>
                <Text style={styles.howStepNumberText}>3</Text>
              </View>
              <View style={styles.howStepContent}>
                <Text style={styles.howStepTitle}>참가자 선택</Text>
                <Text style={styles.howStepDesc}>신청자 중 원하는 사람만 승인</Text>
              </View>
            </View>
            <View style={styles.howStepLine} />
            <View style={styles.howStep}>
              <View style={[styles.howStepNumber, { backgroundColor: '#8b5cf6' }]}>
                <Text style={styles.howStepNumberText}>4</Text>
              </View>
              <View style={styles.howStepContent}>
                <Text style={styles.howStepTitle}>수익 정산</Text>
                <Text style={styles.howStepDesc}>매치 완료 후 자동 정산</Text>
              </View>
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
                <Text style={styles.viewCountTextSmall}>👁️ 2,350</Text>
                <View style={styles.compactPriceRow}>
                  <Text style={styles.compactPrice}>10,900원</Text>
                  <View style={styles.priceChangeSmall}>
                    <TrendingUp size={10} color="#ef4444" />
                    <Text style={styles.priceChangeTextSmall}>+5%</Text>
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
                <Text style={styles.viewCountTextSmall}>👁️ 3,120</Text>
                <View style={styles.compactPriceRow}>
                  <Text style={styles.compactPrice}>15,500원</Text>
                  <View style={styles.priceChangeSmall}>
                    <TrendingUp size={10} color="#ef4444" />
                    <Text style={styles.priceChangeTextSmall}>+9%</Text>
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
                <Text style={styles.viewCountTextSmall}>👁️ 1,680</Text>
                <View style={styles.compactPriceRow}>
                  <Text style={styles.compactPrice}>18,900원</Text>
                  <View style={styles.priceChangeSmall}>
                    <TrendingUp size={10} color="#ef4444" />
                    <Text style={styles.priceChangeTextSmall}>+3%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 설치 방법 */}
        <View style={styles.installSection}>
          <Text style={styles.installTitle}>앱 설치 방법</Text>
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

        {/* CTA 섹션 */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>지금 바로 시작하세요</Text>
          <Text style={styles.ctaSubtitle}>당신을 기다리는 사람들이 있어요</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleStartHost}>
            <Text style={styles.ctaButtonText}>호스트로 시작하기</Text>
          </TouchableOpacity>
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
                  router.push('/(tabs)');
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
    paddingTop: 48,
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
    opacity: 0.3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  mainContent: {
    position: 'relative',
    zIndex: 10,
  },
  textCenter: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ec4899',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    lineHeight: 34,
  },
  subTitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.1)',
  },
  sellerSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ec4899',
    marginRight: 12,
  },
  profileImageBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ec4899',
    marginRight: 12,
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
    fontSize: 15,
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
    fontSize: 17,
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
    marginBottom: 16,
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
  // 조회수 섹션
  viewCountSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  viewCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  viewCountLabel: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '700',
  },
  viewCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewCountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  viewCountUp: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  // 가격 섹션
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
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
  priceChangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  priceChangeTextNew: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  priceChangeDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  // 버튼들
  buttonContainer: {
    gap: 12,
  },
  hostButton: {
    backgroundColor: '#111827',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  hostButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  androidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  iosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  webButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  webButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  // 타겟 섹션
  targetSection: {
    paddingHorizontal: 20,
    paddingVertical: 48,
    backgroundColor: '#ffffff',
  },
  targetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  targetCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  targetEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  targetDesc: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  // 수익 섹션
  earnSection: {
    paddingHorizontal: 20,
    paddingVertical: 48,
    backgroundColor: '#fdf4ff',
  },
  earnTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  earnCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  earnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  earnLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  earnValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  earnDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  earnTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  earnTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ec4899',
  },
  earnNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
  // 작동 방식 섹션
  howSection: {
    paddingHorizontal: 20,
    paddingVertical: 48,
    backgroundColor: '#ffffff',
  },
  howTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  howSteps: {
    gap: 0,
  },
  howStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  howStepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  howStepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  howStepContent: {
    flex: 1,
  },
  howStepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  howStepDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  howStepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginLeft: 19,
  },
  // 인기 매치 섹션
  popularSection: {
    paddingHorizontal: 20,
    paddingVertical: 48,
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
  },
  matchGrid: {
    gap: 16,
  },
  compactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
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
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  viewCountTextSmall: {
    fontSize: 13,
    color: '#6b7280',
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
  priceChangeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceChangeTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  // 설치 섹션
  installSection: {
    paddingHorizontal: 20,
    paddingVertical: 48,
    backgroundColor: '#ffffff',
  },
  installTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 32,
  },
  installSteps: {
    gap: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    paddingTop: 8,
  },
  // CTA 섹션
  ctaSection: {
    paddingHorizontal: 20,
    paddingVertical: 64,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  // 푸터
  footer: {
    paddingVertical: 40,
    backgroundColor: '#111827',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  // 모달
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