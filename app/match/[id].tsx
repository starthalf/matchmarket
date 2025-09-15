import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Clipboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Users, Heart, Share, Copy, CreditCard, CircleAlert as AlertCircle } from 'lucide-react-native';
import { UserRound } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { CertificationBadge } from '../../components/CertificationBadge';
import { PriceDisplay } from '../../components/PriceDisplay';
import { WaitlistManager } from '../../utils/waitlistManager';
import { BankTransferManager, PaymentRequest } from '@/utils/bankTransferManager';
import { CancelParticipationModal } from '../../components/CancelParticipationModal';
import { WaitlistService } from '../../lib/waitlistService';
import { useSafeStyles } from '../../constants/Styles';

export default function MatchDetailScreen() {
  const { user } = useAuth();
  const { matches, refreshMatches, updateMatch } = useMatches();
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = (matches || []).find(m => m.id === id);
  const safeStyles = useSafeStyles();

  if (!match) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <Text>매치를 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [depositorName, setDepositorName] = React.useState('');
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [paymentRequestId, setPaymentRequestId] = React.useState<string | null>(null);
  const [paymentRequestData, setPaymentRequestData] = React.useState<PaymentRequest | null>(null);
  const [isUserParticipating, setIsUserParticipating] = React.useState(false);
  const [userParticipationStatus, setUserParticipationStatus] = React.useState<'not_applied' | 'payment_pending' | 'confirmed' | 'waitlisted' | 'cancelled_by_user'>('not_applied');
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = React.useState(false);
  const [waitlistModalData, setWaitlistModalData] = React.useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  // Calculate user's waiting position
  const userWaitingPosition = React.useMemo(() => {
    if (!user || userParticipationStatus !== 'waitlisted') return 0;
    return WaitlistManager.getWaitingPosition(match, user.id);
  }, [match, user, userParticipationStatus]);
  
  // Handle waitlist cancellation
  const handleWaitlistCancellation = async () => {
    if (!user) return;
    
    try {
      const updatedMatch = JSON.parse(JSON.stringify(match));
      const cancelResult = await WaitlistManager.handleWaitlistCancellation(updatedMatch, user.id);
      
      if (cancelResult.success) {
        updateMatch(updatedMatch);
        setUserParticipationStatus('not_applied');
        setIsUserParticipating(false);
        setShowWaitlistModal(false);
        await refreshMatches();
      } else {
        console.error('대기 취소 실패:', cancelResult.error);
      }
    } catch (error) {
      console.error('대기 취소 중 오류:', error);
    }
  };
  
  // 사용자의 실제 입금 금액 계산
  const getUserPaymentAmount = (): number => {
    if (!user) return 0;
    const userParticipant = (match.participants || []).find(p => p.userId === user.id);
    return userParticipant?.paymentAmount || match.currentPrice;
  };
  
  // 초기 사용자 참가 상태 설정 (한 번만 실행)
  React.useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // participants 배열에서 현재 사용자 찾기
      const userParticipant = (match.participants || []).find(p => p.userId === user.id);
      
      if (userParticipant) {
        setUserParticipationStatus(userParticipant.status);
        setIsUserParticipating(userParticipant.status === 'confirmed');
      } else {
        // 대기자 목록에서 확인
        const userWaiter = (match.waitingList || []).find(w => w.userId === user.id);
        if (userWaiter) {
          setUserParticipationStatus('waitlisted');
          setIsUserParticipating(false);
        } else {
          setUserParticipationStatus('not_applied');
          setIsUserParticipating(false);
        }
      }
    }
  }, [user]); // match 의존성 제거

  const hoursUntilMatch = Math.max(0, 
    (new Date(`${match.date}T${match.time}`).getTime() - new Date().getTime()) / (1000 * 60 * 60)
  );
  
  // 본인이 등록한 매치인지 확인
  const isOwnMatch = user && match.sellerId === user.id;

  // 5분 타이머 효과
  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && paymentRequestData) {
      // 시간 만료 시 자동 취소
      handlePaymentTimeout();
    }
  }, [timeLeft, paymentRequestData]);

  const handlePaymentTimeout = () => {
    if (paymentRequestData) {
      BankTransferManager.handlePaymentExpiry(paymentRequestData);
    }
    Alert.alert(
      '입금 시간 만료',
      '5분 내에 입금하지 않아 참여신청이 자동 취소되었습니다.',
      [{ text: '확인', onPress: () => {
        setShowPaymentModal(false);
        setPaymentRequestData(null);
        setTimeLeft(0);
      }}]
    );
  };

  const handleApply = async () => {
    console.log('=== handleApply 함수 시작 ===');
    console.log('user:', user);
    console.log('isOwnMatch:', isOwnMatch);
    console.log('userParticipationStatus:', userParticipationStatus);
    
    // 매치 마감 상태 체크
    if (match.isClosed) {
      Alert.alert('매치 마감', '이 매치는 판매자에 의해 마감되었습니다.');
      return;
    }
    
    // 참가 취소 처리
    if (userParticipationStatus === 'confirmed') {
      console.log('✅ 참가 취소 모달 표시');
      setShowCancelModal(true);
      return;
    }
    
    // 대기 취소 처리 - 디버깅 로그 추가
    if (userParticipationStatus === 'waitlisted') {
      console.log('🔄 대기 취소 로직 시작');
      console.log('대기 취소 모달 표시');
      setWaitlistModalData({
        title: '대기 취소',
        message: `대기자 신청을 취소하시겠습니까?\n\n현재 대기 순서: ${userWaitingPosition}번째`,
        onConfirm: handleWaitlistCancellation,
      });
      setShowWaitlistModal(true);
      
      console.log('=== handleApply 함수 종료 ===');
      return;
    }
    
    // 입금 확인중 상태에서는 아무 동작 안함
    if (userParticipationStatus === 'payment_pending') {
      console.log('⏳ 입금 확인중 상태');
      Alert.alert('입금 확인중', '관리자가 입금을 확인하는 중입니다. 잠시만 기다려주세요.');
      return;
    }
    
    // 로그인 체크
    if (!user) {
      console.log('🚪 로그인 필요');
      Alert.alert('로그인 필요', '로그인이 필요합니다.', [
        { text: '확인', onPress: () => router.push('/auth/login') }
      ]);
      return;
    }
    
    // 본인 매치 체크
    if (isOwnMatch) {
      console.log('👤 본인 매치');
      Alert.alert('알림', '본인이 등록한 매치입니다.');
      return;
    }
    
    // 매치 마감 여부 체크
    const isMatchFull = match.currentApplicants.total >= match.expectedParticipants.total;
    const userGenderFull = user.gender === '남성' 
      ? match.currentApplicants.male >= match.expectedParticipants.male
      : match.currentApplicants.female >= match.expectedParticipants.female;
    
    console.log('🏓 매치 상태 체크:', { isMatchFull, userGenderFull });
    
    if (isMatchFull || userGenderFull) {
      console.log('📝 대기자 신청 프로세스 시작');
      
      // 커스텀 모달 표시
      setWaitlistModalData({
        title: '매치 마감',
        message: `매치가 마감되었습니다.\n대기자로 신청하시겠습니까?\n\n현재 대기: ${match.waitingApplicants}명`,
        onConfirm: async () => {
          console.log('✅ 대기자 신청 - 확인 버튼 클릭');
          setShowWaitlistModal(false);
          await handleWaitlistApplication(user.gender);
        }
      });
      setShowWaitlistModal(true);
    } else {
      console.log('💳 결제 프로세스 시작');
      // 바로 참가 신청 (입금 프로세스 시작)
      Alert.alert(
        '매치 참가',
        `매치에 참가하시겠습니까?\n참가비: ${match.currentPrice.toLocaleString()}원`,
        [
          { text: '취소', style: 'cancel' },
          { text: '참가하기', onPress: () => startPaymentProcess() }
        ]
      );
    }
    
    console.log('=== handleApply 함수 종료 ===');
  };

  // 추가: Alert이 작동하지 않는 경우를 대비한 대체 함수
  const handleWaitlistCancelFallback = async () => {
    console.log('🔄 대체 대기 취소 함수 실행');
    
    try {
      const updatedMatch = JSON.parse(JSON.stringify(match));
      const cancelResult = await WaitlistManager.handleWaitlistCancellation(updatedMatch, user.id);
      
      if (cancelResult.success) {
        setUserParticipationStatus('not_applied');
        setIsUserParticipating(false);
        await refreshMatches();
        console.log('✅ 대체 방법으로 대기 취소 성공');
      } else {
        console.error('❌ 대체 방법 대기 취소 실패:', cancelResult.error);
      }
    } catch (error) {
      console.error('💥 대체 방법 오류:', error);
    }
  };

  // 테스트용: 버튼을 직접 클릭했을 때 실행할 함수
  const testWaitlistCancel = () => {
    console.log('🧪 테스트: 직접 대기 취소 실행');
    handleWaitlistCancelFallback();
  };

  const handleWaitlistApplication = async (userGender: '남성' | '여성') => {
    console.log('=== handleWaitlistApplication 함수 시작 ===');
    console.log('userGender:', userGender);
    console.log('user:', user);
    
    if (!user) return;
    
    // 매치 객체의 깊은 복사 생성
    const updatedMatch = JSON.parse(JSON.stringify(match));
    console.log('매치 객체 복사 완료');
    
    try {
      console.log('WaitlistManager.handleUserJoinWaitlist 호출 시작');
      const result = await WaitlistManager.handleUserJoinWaitlist(updatedMatch, user);
      console.log('WaitlistManager.handleUserJoinWaitlist 결과:', result);
      
      if (result.success) {
        console.log('대기자 신청 성공 - UI 업데이트 시작');
        updateMatch(updatedMatch); // 전역 상태 업데이트
        setUserParticipationStatus('waitlisted');
        setIsUserParticipating(false);
        console.log('로컬 상태 업데이트 완료');
        
        Alert.alert('대기자 신청 완료', `대기자로 신청되었습니다.${result.position ? `\n현재 대기 순서: ${result.position}번째` : ''}`);
      } else {
        console.error('대기자 신청 실패:', result.error);
        Alert.alert('신청 실패', result.error || '대기자 신청에 실패했습니다.');
      }
    } catch (error) {
      console.error('대기자 신청 중 예외 발생:', error);
      Alert.alert('오류', '대기자 신청 중 오류가 발생했습니다.');
    }
    
    console.log('=== handleWaitlistApplication 함수 종료 ===');
  };

  const startPaymentProcess = () => {
    console.log('=== startPaymentProcess 함수 시작 ===');
    console.log('user:', user);
    console.log('match:', match);
    
    if (!user) return;
    
    try {
      // 결제 요청 생성
      const paymentRequest = BankTransferManager.createPaymentRequest(match, user.id);
      console.log('Payment request created:', paymentRequest);
      setPaymentRequestData(paymentRequest);
      console.log('Payment request data set in state');
      setPaymentRequestId(paymentRequest.id);
      
      // 입금 모달 표시 및 타이머 시작
      setShowPaymentModal(true);
      setTimeLeft(300); // 5분 타이머 시작
      setDepositorName(user?.name || ''); // 로그인한 사용자 이름으로 기본값 설정
    } catch (error) {
      Alert.alert('오류', '결제 요청 생성에 실패했습니다.');
    }
  };

  const handleDepositConfirm = async () => {
    console.log('=== handleDepositConfirm 함수 시작 ===');
    console.log('user:', user);
    console.log('depositorName:', depositorName);
    console.log('paymentRequestData:', paymentRequestData);
    
    console.log('handleDepositConfirm 함수 시작');
    
    if (!user) {
      Alert.alert(
        '로그인 필요',
        '매치 참가를 위해 로그인이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인', onPress: () => {
            setShowPaymentModal(false);
            router.push('/auth/login');
          }}
        ]
      );
      return;
    }

    if (!depositorName.trim()) {
      Alert.alert('입력 오류', '입금자명을 입력해주세요.');
      return;
    }

    if (!paymentRequestData) {
      Alert.alert('오류', '결제 요청 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      // 입금 신고 처리
      const result = await BankTransferManager.submitPayment(paymentRequestData, depositorName);
      
      if (result.success) {
        const paymentResult = await WaitlistManager.handlePaymentCompleted(paymentRequestData.id, match);
        
        console.log('WaitlistManager.handlePaymentCompleted 결과:', paymentResult);
        
        if (paymentResult.success) {
          updateMatch(paymentResult.updatedMatch); // 전역 상태 업데이트
          setUserParticipationStatus('payment_pending');
          setIsUserParticipating(false);
          
          setShowPaymentModal(false);
          setPaymentRequestData(null);
          setTimeLeft(0);
          setDepositorName('');
          
          Alert.alert('입금 신고 완료', '입금 신고가 완료되었습니다. 관리자 확인 후 참가가 확정됩니다.');
        } else {
          console.error('WaitlistManager 처리 실패:', paymentResult.error);
          Alert.alert('처리 실패', paymentResult.error || '결제 처리 중 오류가 발생했습니다.');
        }
      } else {
        console.error('BankTransferManager 처리 실패:', result.message);
        Alert.alert('입금 확인 실패', result.message);
      }
    } catch (error) {
      console.error('입금 확인 중 오류:', error);
      Alert.alert('오류', '입금 확인 중 오류가 발생했습니다.');
    }
  };

  const handleCancelParticipation = (refundAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }) => {
    if (!user) return;

    // 매치 객체의 깊은 복사 생성
    const updatedMatch = JSON.parse(JSON.stringify(match));

    // 참가자 목록에서 사용자 찾기 및 상태 업데이트
    const userParticipant = updatedMatch.participants.find(p => p.userId === user.id);
    if (userParticipant) {
      userParticipant.status = 'cancelled_by_user';
      userParticipant.cancelledAt = new Date().toISOString();
      userParticipant.refundAccount = refundAccount;
      userParticipant.refundRequestedAt = new Date().toISOString();

      // 참가자 수 감소
      if (user.gender === '남성') {
        updatedMatch.currentApplicants.male = Math.max(0, updatedMatch.currentApplicants.male - 1);
      } else {
        updatedMatch.currentApplicants.female = Math.max(0, updatedMatch.currentApplicants.female - 1);
      }
      updatedMatch.currentApplicants.total = Math.max(0, updatedMatch.currentApplicants.total - 1);

      updateMatch(updatedMatch); // 전역 상태 업데이트
      setUserParticipationStatus('cancelled_by_user');
      setIsUserParticipating(false);
      setShowCancelModal(false);

      Alert.alert('참가 취소 완료', '참가 취소가 완료되었습니다. 환불은 3-5일 내에 처리됩니다.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('복사 완료', `${label}이(가) 클립보드에 복사되었습니다.`);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCancelParticipant = () => {
    Alert.alert(
      '참가 취소 시뮬레이션',
      '참가자 취소를 시뮬레이션하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '입금안내 보기', onPress: showPaymentModalHandler },
        { text: '남성 참가자 취소', onPress: () => simulateWaitlistPaymentNotification('남성') },
      ]
    );
  };

  const simulateWaitlistPaymentNotification = async (gender: '남성' | '여성') => {
    // 매치 객체의 깊은 복사 생성
    const updatedMatch = JSON.parse(JSON.stringify(match));
    const result = await WaitlistManager.handleParticipantCancellation(updatedMatch, gender);
    
    if (result.success && result.notifiedUser) {
      updateMatch(updatedMatch); // 전역 상태 업데이트
      Alert.alert(
        '대기자 알림 발송 완료',
        `${result.notifiedUser.userName}님에게 결제 요청 알림을 발송했습니다.\n\n⏰ 결제 제한시간: 10분\n💰 결제 금액: ${updatedMatch.currentPrice.toLocaleString()}원`
      );
    } else {
      Alert.alert('알림 발송 실패', result.error || '알 수 없는 오류가 발생했습니다.');
    }
  };

  const showPaymentModalHandler = () => {
    if (user) {
      startPaymentProcess();
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <TouchableOpacity 
            style={safeStyles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={safeStyles.headerTitle}>매치 상세</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Heart size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 광고 배너 */}
        {match.adEnabled && (
          <View style={styles.adBanner}>
            <Text style={styles.adBannerText}>🎾 테니스 용품 특가 세일! 라켓 20% 할인 - 광고</Text>
          </View>
        )}
        
        {/* 추가 광고 섹션 */}
        {match.adEnabled && (
          <View style={styles.adSection}>
            <Text style={styles.adSectionTitle}>🎯 맞춤 광고</Text>
            <View style={styles.adCard}>
              <Text style={styles.adCardTitle}>🏆 프리미엄 테니스 레슨</Text>
              <Text style={styles.adCardText}>
                전 국가대표 코치와 함께하는 1:1 맞춤 레슨
              </Text>
              <Text style={styles.adCardPrice}>월 200,000원 → 150,000원 (25% 할인)</Text>
            </View>
          </View>
        )}

        {/* 매치 기본 정보 */}
        <View style={styles.matchInfo}>
          <Text style={styles.matchTitle}>{match.title}</Text>
          
          <View style={styles.basicDetails}>
            <View style={styles.detailRow}>
              <Clock size={18} color="#6b7280" />
              <Text style={styles.detailText}>
                {match.date} {match.time}~{match.endTime}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <MapPin size={18} color="#6b7280" />
              <Text style={styles.detailText}>{match.court}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Users size={18} color="#6b7280" />
              <Text style={styles.detailText}>
                {match.matchType} · NTRP {match.ntrpRequirement.min}-{match.ntrpRequirement.max} · 모집인원 {match.expectedParticipants.total}명 
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.genderBreakdown}>
                {match.expectedParticipants.male > 0 && (
                  <View style={styles.genderItem}>
                    <UserRound size={16} color="#3b82f6" />
                    <Text style={styles.genderText}>{match.currentApplicants.male}/{match.expectedParticipants.male}명</Text>
                  </View>
                )}
                {match.expectedParticipants.female > 0 && (
                  <View style={styles.genderItem}>
                    <UserRound size={16} color="#ec4899" />
                    <Text style={styles.genderText}>{match.currentApplicants.female}/{match.expectedParticipants.female}명</Text>
                  </View>
                )}
                <Text style={styles.waitingText}>· 대기 {match.waitingApplicants}명</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{match.description}</Text>
        </View>

        {/* 판매자 프로필 카드 */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerHeader}>
            <Text style={styles.sellerCardTitle}>매치 호스트</Text>
          </View>
          
          <View style={styles.sellerInfo}>
            <View style={styles.sellerProfileSection}>
              <View style={styles.profileImageContainer}>
                {match.seller.profileImage ? (
                  <Image 
                    source={{ uri: match.seller.profileImage }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.defaultProfileImage}>
                    <UserRound size={32} color="#9ca3af" />
                  </View>
                )}
              </View>
              
              <View style={styles.sellerMainInfo}>
                <View style={styles.sellerBasic}>
                  <Text style={styles.sellerName}>{match.seller.name}</Text>
                  <CertificationBadge 
                    ntrpCert={match.seller.certification.ntrp}
                    careerCert={match.seller.certification.career}
                    youtubeCert={match.seller.certification.youtube}
                    instagramCert={match.seller.certification.instagram}
                    size="medium"
                  />
                </View>
                
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerDetailText}>
                    {match.seller.gender} · {match.seller.ageGroup} · NTRP {match.seller.ntrp.toFixed(1)}
                  </Text>
                  <Text style={styles.sellerDetailText}>
                    경력 {match.seller.experience}년 · {match.seller.careerType} · {match.seller.playStyle}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.sellerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{match.seller.viewCount}</Text>
                <Text style={styles.statLabel}>조회</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{match.seller.likeCount}</Text>
                <Text style={styles.statLabel}>좋아요</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{match.seller.avgRating}</Text>
                <Text style={styles.statLabel}>평점</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 가격 정보 */}
        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>실시간 가격</Text>
          <View style={styles.priceInfo}>
            <PriceDisplay
              currentPrice={match.currentPrice}
              basePrice={match.basePrice}
              initialPrice={match.initialPrice}
              expectedViews={match.expectedViews}
              maxPrice={match.maxPrice}
              hoursUntilMatch={hoursUntilMatch}
              viewCount={match.seller.viewCount}
              waitingApplicants={match.waitingApplicants}
              expectedWaitingApplicants={match.expectedWaitingApplicants}
              sellerGender={match.seller.gender}
              sellerNtrp={match.seller.ntrp}
            />
          </View>
          <Text style={styles.priceNote}>
            * 가격은 실시간으로 변동됩니다 (5초마다 업데이트)
          </Text>
        </View>

        {/* 테스트 섹션 (개발용) */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>🔧 개발자 테스트</Text>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleCancelParticipant}
          >
            <Text style={styles.testButtonText}>참가자 취소 시뮬레이션</Text>
          </TouchableOpacity>
          
          {/* 디버깅용 테스트 버튼 추가 */}
          {userParticipationStatus === 'payment_pending' && (
            <TouchableOpacity
              style={[styles.testButton, styles.adminTestButton]}
              onPress={async () => {
                if (!user) {
                  Alert.alert('오류', '로그인이 필요합니다.');
                  return;
                }
                
                // 실제 입금 신고에서 사용된 paymentRequestId 찾기
                let actualPaymentRequestId = null;
                
                // participants에서 현재 사용자의 payment_pending 상태 찾기
                const userParticipant = match.participants.find(p => 
                  p.userId === user.id && p.status === 'payment_pending'
                );
                
                if (userParticipant && userParticipant.paymentSubmittedAt) {
                  // paymentSubmittedAt 시간을 기반으로 paymentRequestId 재구성
                  const timestamp = new Date(userParticipant.paymentSubmittedAt).getTime();
                  actualPaymentRequestId = `payment_${match.id}_${user.id}_${timestamp}`;
                } else if (paymentRequestData) {
                  // paymentRequestData가 있으면 그것을 사용
                  actualPaymentRequestId = paymentRequestData.id;
                } else {
                  // 마지막 수단: 현재 시간으로 생성 (정확하지 않을 수 있음)
                  actualPaymentRequestId = `payment_${match.id}_${user.id}_${Date.now()}`;
                }
                
                console.log('관리자 확정 버튼 클릭 - actualPaymentRequestId:', actualPaymentRequestId);
                
                Alert.alert(
                  '관리자 입금 확정',
                  `${user.name}님의 입금을 확정하시겠습니까?\n\n금액: ${match.currentPrice.toLocaleString()}원`,
                  [
                    { text: '취소', style: 'cancel' },
                    { text: '확정', onPress: async () => {
                      // 매치 객체의 깊은 복사 생성
                      const updatedMatch = JSON.parse(JSON.stringify(match));
                      const result = await WaitlistManager.handleAdminPaymentConfirmation(actualPaymentRequestId, updatedMatch);
                      if (result.success) {
                        updateMatch(updatedMatch); // 전역 상태 업데이트
                        setUserParticipationStatus('confirmed');
                        setIsUserParticipating(true);
                        Alert.alert('입금 확정 완료', `${user.name}님의 매치 참가가 확정되었습니다!`);
                      } else {
                        Alert.alert('확정 실패', result.error || '입금 확정에 실패했습니다.');
                      }
                    }}
                  ]
                );
              }}
            >
              <Text style={styles.adminTestButtonText}>👨‍💼 관리자 입금 확정</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 입금 안내 모달 */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              Alert.alert(
                '참여신청 취소',
                '정말로 참여신청을 취소하시겠습니까?',
                [
                  { text: '계속하기', style: 'cancel' },
                  { text: '취소하기', onPress: () => {
                    setShowPaymentModal(false);
                    setPaymentRequestId(null);
                    setTimeLeft(0);
                  }}
                ]
              );
            }}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>입금 안내</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 입금 확정 안내 메시지 */}
            <View style={styles.confirmationMessageContainer}>
              <Text style={styles.confirmationMessageText}>
                입금 후 입금 완료를 눌러야 확정됩니다
              </Text>
            </View>

            {/* 타이머 */}
            <View style={styles.timerSection}>
              <AlertCircle size={24} color="#dc2626" />
              <View style={styles.timerContent}>
                <Text style={styles.timerTitle}>입금 제한시간</Text>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              </View>
            </View>

            {/* 입금 정보 */}
            <View style={styles.paymentInfoSection}>
              <Text style={styles.sectionTitle}>입금 정보</Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>입금 금액</Text>
                  <View style={styles.infoValueRow}>
                    <Text style={styles.infoValue}>{match.currentPrice.toLocaleString()}원</Text>
                    <TouchableOpacity 
                      onPress={() => copyToClipboard(match.currentPrice.toString(), '입금 금액')}
                      style={styles.copyButton}
                    >
                      <Copy size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>입금 계좌</Text>
                  <View style={styles.infoValueRow}>
                    <Text style={styles.infoValue}>국민은행 123-456-789012</Text>
                    <TouchableOpacity 
                      onPress={() => copyToClipboard('123-456-789012', '계좌번호')}
                      style={styles.copyButton}
                    >
                      <Copy size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>예금주</Text>
                  <Text style={styles.infoValue}>MatchMarket</Text>
                </View>
              </View>
            </View>

            {/* 입금자명 입력 */}
            <View style={styles.depositorSection}>
              <Text style={styles.sectionTitle}>입금자명 입력</Text>
              <Text style={styles.sectionDescription}>
                입금 시 사용한 입금자명을 정확히 입력해주세요.
              </Text>
              
              <TextInput
                style={styles.depositorInput}
                value={depositorName}
                onChangeText={setDepositorName}
                placeholder="입금자명을 입력하세요"
                placeholderTextColor="#9ca3af"
                autoFocus={true}
                editable={true}
                selectTextOnFocus={true}
                clearButtonMode="while-editing"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                onFocus={() => console.log('Input focused')}
                onBlur={() => console.log('Input blurred')}
                onChangeText={(text) => {
                  console.log('Text changed:', text);
                  setDepositorName(text);
                }}
              />
            </View>

            {/* 주의사항 */}
            <View style={styles.noticeSection}>
              <Text style={styles.noticeTitle}>⚠️ 입금 시 주의사항</Text>
              <Text style={styles.noticeText}>
                • 정확한 금액을 입금해주세요 (원 단위까지 일치)
                {'\n'}• 5분 내에 입금하지 않으면 자동 취소됩니다
                {'\n'}• 입금자명은 본인 이름으로 입금해주세요
                {'\n'}• 입금 확인 후 1-2분 내에 참가확정됩니다
                {'\n'}• 매치 48시간 전부터는 환불이 불가능합니다
                {'\n'}• 매치 인원이 마감되지 않으면 자동 취소되며, 순차적으로 환불됩니다
                {'\n'}• 문의사항은 고객센터로 연락해주세요
              </Text>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.modalFooter}>
            {/* 입금 완료 버튼 위 강조 메시지 */}
            <View style={styles.buttonWarningContainer}>
              <Text style={styles.buttonWarningText}>
                입금 후 입금 완료를 눌러야 확정됩니다
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                !depositorName.trim() && styles.confirmButtonDisabled
              ]}
              onPress={handleDepositConfirm}
              disabled={!depositorName.trim()}
            >
              <CreditCard size={18} color="#ffffff" />
              <Text style={styles.confirmButtonText}>입금 완료</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 참가 취소 모달 */}
      <CancelParticipationModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelParticipation}
        matchTitle={match.title}
        refundAmount={getUserPaymentAmount()}
      />

      {/* 대기자 신청 확인 모달 */}
      <Modal
        visible={showWaitlistModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <Text style={styles.alertTitle}>{waitlistModalData?.title}</Text>
            <Text style={styles.alertMessage}>{waitlistModalData?.message}</Text>
            <View style={styles.alertButtons}>
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertCancelButton]}
                onPress={() => {
                  console.log('🚫 대기자 신청 - 취소 버튼 클릭');
                  setShowWaitlistModal(false);
                }}
              >
                <Text style={styles.alertCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertConfirmButton]}
                onPress={waitlistModalData?.onConfirm}
              >
                <Text style={styles.alertConfirmText}>
                  {waitlistModalData?.title === '대기 취소' ? '대기 취소' : '대기 신청'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        <View style={styles.priceDisplay}>
          <Text style={styles.currentPrice}>
            {match.currentPrice.toLocaleString()}원
          </Text>
          <Text style={styles.priceSubtext}>
            대기 {match.waitingApplicants}명
          </Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.applyButton,
            (userParticipationStatus === 'payment_pending' || userParticipationStatus === 'cancelled_by_user' || match.isClosed) && styles.applyButtonDisabled
          ]} 
          onPress={handleApply}
          disabled={userParticipationStatus === 'payment_pending' || userParticipationStatus === 'cancelled_by_user' || match.isClosed}
        >
          <Text style={styles.applyButtonText}>
            {match.isClosed
              ? '마감됨'
              : userParticipationStatus === 'confirmed'
              ? '참가취소'
              : userParticipationStatus === 'payment_pending'
              ? '입금확인중'
              : userParticipationStatus === 'cancelled_by_user'
              ? '취소됨'
              : userParticipationStatus === 'waitlisted'
              ? '대기중'
              : isOwnMatch 
              ? '본인 매치' 
              : (user && ((user.gender === '남성' && match.currentApplicants.male >= match.expectedParticipants.male) ||
                         (user.gender === '여성' && match.currentApplicants.female >= match.expectedParticipants.female)))
                ? '대기신청' 
                : '신청하기'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
  adBanner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
  },
  adBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  adSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  adSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  adCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  adCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  adCardText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 18,
  },
  adCardPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  matchInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 26,
  },
  basicDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  genderBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 30,
  },
  genderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genderText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  waitingText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginTop: 8,
  },
  sellerCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerHeader: {
    marginBottom: 16,
  },
  sellerCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sellerInfo: {
    gap: 12,
  },
  sellerProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  defaultProfileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerMainInfo: {
    flex: 1,
  },
  sellerBasic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sellerDetails: {
    gap: 4,
    marginBottom: 8,
  },
  sellerDetailText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sellerStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ec4899',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  priceCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  priceCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  priceInfo: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  priceNote: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  waitlistCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  waitlistCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  waitlistContainer: {
    gap: 8,
  },
  waiterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 12,
  },
  waiterPosition: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ec4899',
    width: 20,
  },
  waiterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  waiterInfo: {
    fontSize: 12,
    color: '#6b7280',
  },
  waiterStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },
  moreWaiters: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noWaiters: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  testSection: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  adminTestButton: {
    backgroundColor: '#16a34a',
    marginTop: 8,
  },
  adminTestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 120,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  priceDisplay: {
    flex: 1,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  priceSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingTop: 16,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12,
  },
  timerContent: {
    flex: 1,
  },
  timerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#dc2626',
    fontFamily: 'monospace',
  },
  paymentInfoSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  copyButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  depositorSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  depositorInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  noticeSection: {
    backgroundColor: '#fffbeb',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonWarningContainer: {
    backgroundColor: '#fee2e2',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    alignItems: 'center',
  },
  buttonWarningText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
  },
  confirmationMessageContainer: {
    backgroundColor: '#fee2e2',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    alignItems: 'center',
  },
  confirmationMessageText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertCancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  alertCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  alertConfirmButton: {
    backgroundColor: '#ec4899',
  },
  alertConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});