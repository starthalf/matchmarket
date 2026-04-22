import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  Eye,
  Heart,
  Star,
  Users,
  Send,
  X,
  Timer,
  Copy
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { PriceDisplay } from '../../components/PriceDisplay';
import { useSafeStyles } from '../../constants/Styles';
import { Match, MatchApplication } from '../../types/tennis';
import { createNotification } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';  // 이 줄 추가

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { matches, updateMatch } = useMatches();
  const safeStyles = useSafeStyles();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showPaymentTimer, setShowPaymentTimer] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300); // 5분 = 300초
  const [myApplication, setMyApplication] = useState<MatchApplication | undefined>();
const [myParticipation, setMyParticipation] = useState<any>();
const [sellerInfo, setSellerInfo] = useState<any>(null);

const match = matches.find(m => m.id === id);

// 🔥 초기 가격을 동적 계산
const calculateInitialPrice = () => {
  if (!match) return 0;
  
  const { PricingCalculator } = require('../../types/tennis');
  const safeApplications = match.applications || [];
  const currentTime = new Date();
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const hoursUntilMatch = Math.max(0, (matchDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
  
  const factors = {
    viewCount: match.seller?.viewCount || 0,
    applicationsCount: safeApplications.length,
    expectedApplicants: (match.expectedParticipants?.total || 0) * 5,
    hoursUntilMatch,
    basePrice: match.basePrice,
    maxPrice: match.maxPrice || 200000
  };
  
  return PricingCalculator.calculateDynamicPrice(factors);
};

const [displayPrice, setDisplayPrice] = useState(calculateInitialPrice());

  const handlePriceChange = async (newPrice: number) => {
    if (!match) return;

    setDisplayPrice(newPrice);

    const updatedMatch: Match = {
      ...match,
      currentPrice: newPrice
    };

    await updateMatch(updatedMatch);
  };

  if (!match) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>매치를 찾을 수 없습니다.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 안전한 기본값 설정
  const safeApplications = match.applications || [];
  const safeParticipants = match.participants || [];

  const isOwnMatch = match.sellerId === user?.id;

  const currentTime = new Date();
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const hoursUntilMatch = Math.max(0, (matchDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));

// 결제 타이머 효과
  useEffect(() => {
    if (!showPaymentTimer) return;
    const timer = setInterval(() => {
      setPaymentTimeLeft(prev => {
        if (prev <= 1) {
          setShowPaymentTimer(false);
          toast.show('결제 시간이 만료되었습니다.', 'error');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showPaymentTimer]);

// ✅ 수정된 코드 - 매치 마감 시 입금 모달 자동 닫기
// 승인 상태 감지 및 입금 모달 자동 띄우기
useEffect(() => {
  if (!match || !user) return;
  
  // 🆕 매치가 마감되면 입금 모달 강제 닫기
  if (match.isClosed && showPaymentTimer) {
    setShowPaymentTimer(false);
    toast.show('매치가 마감되어 입금이 불가능합니다.', 'error');
    return;
  }
  
  const currentApp = safeApplications.find(app => app.userId === user.id);
  const currentPart = safeParticipants.find(p => p.userId === user.id);
  
  // approved 상태인 경우에만 남은 시간 계산 (payment_pending은 제외)
  if (currentApp?.status === 'approved' && currentApp.approvedAt) {
    const approvedTime = new Date(currentApp.approvedAt).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - approvedTime) / 1000);
    const remainingSeconds = Math.max(0, 300 - elapsedSeconds); // 5분 = 300초
    
    if (remainingSeconds > 0) {
      // 남은 시간이 있으면 모달 표시
      setPaymentTimeLeft(remainingSeconds);
      setShowPaymentTimer(true);
      
      // 처음 승인될 때만 알림 (상태 변화 감지)
      if (myApplication?.status === 'pending') {
        toast.show('매치 참가가 승인되었습니다. 5분 내에 입금을 완료해주세요.');
      } else if (myApplication === undefined) {
        // 로그인 시
        toast.show(`승인된 매치가 있습니다. ${Math.floor(remainingSeconds / 60)}분 ${remainingSeconds % 60}초 내에 입금을 완료해주세요.`, 'info');
      }
    } else {
      // 시간 만료 - applications 배열에서 완전히 제거
      if (myApplication?.status === 'approved') {
        // applications 배열에서 제거
        const updatedApplications = safeApplications.filter(
          app => app.id !== currentApp.id
        );
        const updatedMatch: Match = {
          ...match,
          applications: updatedApplications
        };
        updateMatch(updatedMatch);
        
        // 모달 닫기
        setShowPaymentTimer(false);
        
        toast.show('결제 시간이 만료되어 참여신청이 취소되었습니다.', 'error');
      }
    }
  }
  
  setMyApplication(currentApp);
  setMyParticipation(currentPart);
}, [match, user, safeApplications, safeParticipants, myApplication?.status, match?.isClosed]);

  // 판매자 정보 가져오기
  useEffect(() => {
    const fetchSellerInfo = async () => {
      if (!match?.sellerId) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('bankName:bank_name, accountNumber:account_number, accountHolder:account_holder, name')
          .eq('id', match.sellerId)
          .single();
        
        if (error) {
          console.error('판매자 정보 조회 오류:', error);
          return;
        }
        
        setSellerInfo(data);
      } catch (error) {
        console.error('판매자 정보 가져오기 실패:', error);
      }
    };
    
    fetchSellerInfo();
  }, [match?.sellerId]);

  const handleApply = () => {
    if (!user) {
      Alert.alert('로그인 필요', '로그인이 필요합니다.', [
        { text: '확인', onPress: () => router.push('/auth/login') }
      ]);
      return;
    }

    if (isOwnMatch) {
      Alert.alert('알림', '본인이 등록한 매치입니다.');
      return;
    }

    if (myApplication) {
      Alert.alert('이미 신청함', '이미 참여신청을 하셨습니다.');
      return;
    }

    setShowApplicationModal(true);
  };

  const submitApplication = async () => {
    if (!user || !match) return;

    setIsSubmitting(true);

    try {
      // 새로운 참여신청 생성
      const newApplication: MatchApplication = {
        id: `app_${match.id}_${user.id}_${Date.now()}`,
        matchId: match.id,
        userId: user.id,
        userName: user.name,
        userGender: user.gender,
        userNtrp: user.ntrp,
        userProfileImage: user.profileImage,
        appliedPrice: match.currentPrice,
        appliedAt: new Date().toISOString(),
        status: 'pending'
      };

      // 매치에 참여신청 추가
      const updatedMatch: Match = {
        ...match,
        applications: [...safeApplications, newApplication]
      };

      updateMatch(updatedMatch);

// 🔥 판매자에게 매치관리 알림 전송 (Supabase)
      await createNotification(
        match.sellerId,
        'new_application',
        match.id,
        user.id,
        user.name
      );

      setShowApplicationModal(false);

      Alert.alert(
        '참여신청 완료! 🎾',
        '참여신청이 완료되었습니다.\n판매자가 승인하면 결제요청이 전송됩니다.',
        [{ text: '확인' }]
      );
    } catch (error) {
      console.error('참여신청 중 오류:', error);
      Alert.alert('신청 실패', '참여신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.confirm) {
        // 웹 환경
        resolve(window.confirm(message));
      } else {
        // 모바일 환경
        Alert.alert(
          '확인',
          message,
          [
            { text: '취소', style: 'cancel', onPress: () => resolve(false) },
            { text: '확인', onPress: () => resolve(true) }
          ]
        );
      }
    });
  };

  const showAlert = (message: string): void => {
    if (typeof window !== 'undefined' && window.alert) {
      // 웹 환경
      window.alert(message);
    } else {
      // 모바일 환경
      Alert.alert('알림', message);
    }
  };

  const handleCancelApplication = async () => {
    if (!myApplication || !match) return;
    
    const confirmed = await showConfirm('참여신청을 취소하시겠습니까?');
    
    if (confirmed) {
      try {
        const updatedApplications = safeApplications.filter(
          app => app.id !== myApplication.id
        );
        
        const updatedMatch: Match = {
          ...match,
          applications: updatedApplications
        };
        
        updateMatch(updatedMatch);
        showAlert('참여신청이 취소되었습니다.');
      } catch (error) {
        console.error('신청 취소 중 오류:', error);
        showAlert('신청 취소 중 오류가 발생했습니다.');
      }
    }
  };

 const handlePaymentComplete = async () => {
  try {
    if (!user || !myApplication) {
      Alert.alert('오류', '참여 정보를 찾을 수 없습니다.');
      return;
    }

    // ❌ 기존: application을 제거하고 participant 추가
    // ✅ 수정: application의 status만 'confirmed'로 변경
    const updatedApplications = safeApplications.map(app =>
  app.id === myApplication.id
    ? {
        ...app,
        status: 'payment_submitted',
        paymentSubmittedAt: new Date().toISOString()
      }
    : app
);

    const updatedMatch = {
      ...match,
      applications: updatedApplications
    };

    await updateMatch(updatedMatch);
    
    // 🔥 판매자에게 입금완료 알림 전송 (Supabase)
    await createNotification(
      match.sellerId,
      'payment_confirmed',
      match.id,
      user.id,
      user.name
    );
    
    setShowPaymentTimer(false);
    
    Alert.alert(
  '입금완료',
  '입금이 완료되었습니다.\n판매자가 확인하면 참가가 확정됩니다.',
  [{ text: '확인' }]
);
  } catch (error) {
    console.error('입금완료 처리 중 오류:', error);
    Alert.alert('오류', '입금완료 처리 중 오류가 발생했습니다.');
  }
};

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getApplicationStatus = () => {
    if (!user) return null;
    
    if (myParticipation) {
      switch (myParticipation.status) {
        case 'payment_pending':
          return '입금 확인중';
        case 'confirmed':
          return '참가 확정';
        case 'cancelled_by_user':
          return '참가 취소';
        case 'refunded':
          return '환불 완료';
        default:
          return null;
      }
    }
    
    if (myApplication) {
  switch (myApplication.status) {
    case 'pending':
      return '승인 대기중';
    case 'approved':
      return '승인됨 - 결제대기';
    case 'payment_submitted':
      return '입금 확인 대기중';
    case 'confirmed':
      return '참여 확정';
    case 'rejected':
      return '신청 거절됨';
    default:
      return null;
  }
}
    
    return null;
  };

  const statusText = getApplicationStatus();
  const canApply = !isOwnMatch && !myApplication && !myParticipation;

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>매치 상세</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 매치 기본 정보 */}
        <View style={styles.matchInfoCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>{match.title}</Text>
            <View style={styles.matchTypeBadge}>
<Text style={styles.matchTypeText}>
  {Array.isArray(match.matchType) 
    ? match.matchType.join(' · ') 
    : String(match.matchType).replace(/[\[\]"\\]/g, '').trim()}
</Text>
            </View>
          </View>

          <View style={styles.matchDetails}>
            <View style={styles.detailRow}>
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.detailText}>{match.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color="#6b7280" />
              <Text style={styles.detailText}>{match.time} - {match.endTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.detailText}>{match.court}</Text>
            </View>
            <View style={styles.detailRow}>
              <Users size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                남성 {match.expectedParticipants?.male || 0}명, 여성 {match.expectedParticipants?.female || 0}명 모집
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Shield size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                NTRP {match.ntrpRequirement.min.toFixed(1)} - {match.ntrpRequirement.max.toFixed(1)}
              </Text>
            </View>
          </View>

          {match.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>매치 설명</Text>
              <Text style={styles.descriptionText}>{match.description}</Text>
            </View>
          )}
        </View>

        {/* 판매자 정보 */}
        <View style={styles.sellerCard}>
          <Text style={styles.sectionTitle}>판매자 정보</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerProfile}>
              <View style={styles.sellerAvatarPlaceholder}>
                <User size={20} color="#6b7280" />
              </View>
              <View style={styles.sellerDetails}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>{match.seller?.name || '알 수 없음'}</Text>
                  {match.seller?.certification?.ntrp === 'verified' && (
                    <Shield size={16} color="#10b981" />
                  )}
                </View>
                <Text style={styles.sellerMeta}>
                  {match.seller?.gender || ''} · {match.seller?.ageGroup || ''} · NTRP {match.seller?.ntrp?.toFixed(1) || '0.0'}
                </Text>
                <Text style={styles.sellerDetailText}>
                  경력 {Math.floor((match.seller?.experience || 0) / 12)}년 · {match.seller?.careerType || ''} · {match.seller?.playStyle || ''}
                </Text>
              </View>
            </View>
            <View style={styles.sellerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{match.seller?.viewCount || 0}</Text>
                <Text style={styles.statLabel}>조회</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{match.seller?.likeCount || 0}</Text>
                <Text style={styles.statLabel}>좋아요</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{match.seller?.avgRating?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.statLabel}>평점</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 가격 정보 */}
        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>매치 가격</Text>
          <View style={styles.priceInfo}>
            <PriceDisplay
  currentPrice={match.currentPrice}
  basePrice={match.basePrice}
  maxPrice={match.maxPrice || 200000}
  hoursUntilMatch={hoursUntilMatch}
  viewCount={match.seller?.viewCount || 0}
  applicationsCount={safeApplications.length}
  expectedParticipants={match.expectedParticipants?.total || 0}
  isClosed={match.isClosed}
  onPriceChange={handlePriceChange}
/>
          </View>
          <Text style={styles.priceNote}>
            * 가격은 인기가 높아지면 변동됩니다
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 하단 고정 영역 */}
      <View style={styles.bottomBar}>
<View style={styles.priceDisplay}>
  <Text style={styles.currentPrice}>
    {displayPrice.toLocaleString()}원
  </Text>
          {statusText && (
            <Text style={styles.statusText}>{statusText}</Text>
          )}
        </View>
        
        {myApplication && myApplication.status === 'pending' ? (
          <TouchableOpacity 
            style={[styles.applyButton, styles.cancelApplicationButton]}
            onPress={handleCancelApplication}
          >
            <Text style={styles.applyButtonText}>신청 취소</Text>
          </TouchableOpacity>
        ) : (
          // 그 외의 경우 - 기존 버튼
          <TouchableOpacity 
            style={[
              styles.applyButton,
              (!canApply || match.isClosed) && styles.applyButtonDisabled
            ]} 
            onPress={handleApply}
            disabled={!canApply || match.isClosed}
          >
            <Text style={styles.applyButtonText}>
              {match.isClosed ? '마감됨' :
               isOwnMatch ? '본인 매치' :
               myApplication ? '신청완료' :
               myParticipation ? '참가중' :
               '참여신청'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 참여신청 모달 */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowApplicationModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>참여신청</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.applicationSummary}>
              <Text style={styles.summaryTitle}>신청 내용</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>매치</Text>
                <Text style={styles.summaryValue}>{match.title}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>일시</Text>
                <Text style={styles.summaryValue}>{match.date} {match.time}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>장소</Text>
                <Text style={styles.summaryValue}>{match.court}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>신청가격</Text>
                <Text style={[styles.summaryValue, styles.priceValue]}>
                  {match.currentPrice.toLocaleString()}원
                </Text>
              </View>
            </View>

            <View style={styles.applicationNote}>
              <Text style={styles.noteTitle}>📝 참여신청 안내</Text>
              <Text style={styles.noteText}>
                • 판매자가 신청을 승인하면 결제요청이 전송됩니다{'\n'}
                • 결제요청 후 5분 내에 입금해주세요{'\n'}
                • 입금완료 후 채팅을 통해 소통할 수 있습니다
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowApplicationModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
                onPress={submitApplication}
                disabled={isSubmitting}
              >
                <Text style={styles.confirmButtonText}>
                  {isSubmitting ? '신청 중...' : '참여신청'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 결제 타이머 모달 */}
      <Modal
        visible={showPaymentTimer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentTimer(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ width: 24 }} />
            <Text style={styles.modalTitle}>입금 안내</Text>
            <TouchableOpacity onPress={() => setShowPaymentTimer(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.timerSection}>
              <Timer size={48} color="#dc2626" />
              <Text style={styles.timerText}>{formatTime(paymentTimeLeft)}</Text>
              <Text style={styles.timerLabel}>남은 시간</Text>
            </View>

            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>입금 정보</Text>
              <View style={styles.paymentDetail}>
                <Text style={styles.paymentLabel}>입금 금액</Text>
                <Text style={styles.paymentAmount}>
                  {match.currentPrice.toLocaleString()}원
                </Text>
              </View>
<View style={styles.paymentDetail}>
                <Text style={styles.paymentLabel}>입금 계좌</Text>
                <View style={styles.accountWithCopy}>
                  <Text style={styles.paymentAccount}>
                    {sellerInfo?.bankName} {sellerInfo?.accountNumber}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(sellerInfo?.accountNumber || '');
    toast.show('계좌번호가 복사되었습니다.');
  }
}}
                  >
                    <Copy size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.paymentDetail}>
                <Text style={styles.paymentLabel}>예금주</Text>
                <Text style={styles.paymentAccount}>
                  {sellerInfo?.accountHolder}
                </Text>
              </View>
            </View>

            // ✅ 수정된 코드 - 마감된 매치는 입금완료 버튼 비활성화
<TouchableOpacity 
  style={[
    styles.paymentCompleteButton,
    match.isClosed && styles.paymentCompleteButtonDisabled
  ]}
  onPress={handlePaymentComplete}
  disabled={match.isClosed}
>
  <Text style={styles.paymentCompleteButtonText}>
    {match.isClosed ? '매치 마감됨' : '입금완료'}
  </Text>
</TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  matchInfoCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    lineHeight: 28,
  },
  matchTypeBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  matchTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  matchDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 24,
  },
  sellerCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sellerInfo: {
    gap: 16,
  },
  sellerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sellerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sellerMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  sellerDetailText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  sellerStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  priceCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  priceInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  priceNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    gap: 16,
  },
  priceDisplay: {
    flex: 1,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  applyButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  applicationSummary: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  priceValue: {
    color: '#ec4899',
    fontSize: 16,
  },
  applicationNote: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelApplicationButton: {
    backgroundColor: '#dc2626',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  timerSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#dc2626',
    marginVertical: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  paymentDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ec4899',
  },
  paymentAccount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paymentCompleteButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  paymentCompleteButtonDisabled: {
  backgroundColor: '#d1d5db',
  opacity: 0.6,
},
 paymentCompleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  accountWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
});