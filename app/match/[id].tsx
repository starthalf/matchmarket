import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  User, 
  Eye, 
  Heart,
  CreditCard,
  Building,
  CircleCheck as CheckCircle,
  TriangleAlert as AlertTriangle,
  X
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { CertificationBadge } from '../../components/CertificationBadge';
import { CancelParticipationModal } from '../../components/CancelParticipationModal';
import { WaitlistManager } from '../../utils/waitlistManager';
import { BankTransferManager } from '../../utils/bankTransferManager';
import { useSafeStyles } from '../../constants/Styles';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { matches, updateMatch } = useMatches();
  const safeStyles = useSafeStyles();
  const [isJoining, setIsJoining] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [depositorName, setDepositorName] = useState('');

  const match = matches.find(m => m.id === id);

  useEffect(() => {
    if (match) {
      // 조회수 증가 (실제로는 서버에서 처리)
      match.seller.viewCount += 1;
    }
  }, [match]);

  // 결제 타이머
  useEffect(() => {
    if (paymentRequest && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && paymentRequest) {
      // 시간 만료
      setShowPaymentModal(false);
      setPaymentRequest(null);
      Alert.alert('결제 시간 만료', '결제 시간이 만료되어 대기가 취소되었습니다.');
    }
  }, [timeLeft, paymentRequest]);

  if (!match) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>매치를 찾을 수 없습니다.</Text>
          <TouchableOpacity 
            style={styles.backToHomeButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.backToHomeText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>로그인이 필요합니다</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 사용자 상태 확인
  const isParticipant = match.participants.some(p => p.userId === user.id);
  const isWaiting = match.waitingList.some(w => w.userId === user.id);
  const isSeller = match.sellerId === user.id;
  const myParticipation = match.participants.find(p => p.userId === user.id);
  const myWaiting = match.waitingList.find(w => w.userId === user.id);

  // 참가 가능 여부 확인
  const canParticipate = () => {
    if (isSeller) return { canJoin: false, reason: '본인이 등록한 매치입니다.' };
    if (isParticipant) return { canJoin: false, reason: '이미 참가 중입니다.' };
    if (isWaiting) return { canJoin: false, reason: '이미 대기 중입니다.' };
    if (match.isClosed) return { canJoin: false, reason: '마감된 매치입니다.' };
    
    // NTRP 요구사항 확인
    if (user.ntrp < match.ntrpRequirement.min || user.ntrp > match.ntrpRequirement.max) {
      return { 
        canJoin: false, 
        reason: `NTRP ${match.ntrpRequirement.min}-${match.ntrpRequirement.max} 범위에 해당하지 않습니다.` 
      };
    }

    // 성별별 자리 확인
    const availableSlots = {
      male: match.expectedParticipants.male - match.currentApplicants.male,
      female: match.expectedParticipants.female - match.currentApplicipants.female,
    };

    if (user.gender === '남성' && availableSlots.male <= 0) {
      return { canJoin: false, reason: '남성 참가자 모집이 마감되었습니다.' };
    }
    if (user.gender === '여성' && availableSlots.female <= 0) {
      return { canJoin: false, reason: '여성 참가자 모집이 마감되었습니다.' };
    }

    return { canJoin: true };
  };

  const handleJoinMatch = async () => {
    const { canJoin, reason } = canParticipate();
    
    if (!canJoin) {
      Alert.alert('참가 불가', reason);
      return;
    }

    setIsJoining(true);

    try {
      // 즉시 참가 (자리가 있는 경우)
      const availableSlots = {
        male: match.expectedParticipants.male - match.currentApplicants.male,
        female: match.expectedParticipants.female - match.currentApplicants.female,
      };

      const hasSlot = user.gender === '남성' ? availableSlots.male > 0 : availableSlots.female > 0;

      if (hasSlot) {
        // 즉시 참가 - 결제 요청 생성
        const newPaymentRequest = BankTransferManager.createPaymentRequest(match, user.id);
        setPaymentRequest(newPaymentRequest);
        setTimeLeft(5 * 60); // 5분
        setShowPaymentModal(true);
        
        Alert.alert(
          '참가 신청 완료',
          `${match.title} 매치에 참가 신청되었습니다.\n5분 내에 입금을 완료해주세요.`
        );
      } else {
        // 대기자 등록
        const result = await WaitlistManager.handleUserJoinWaitlist(match, user);
        
        if (result.success) {
          updateMatch(match);
          Alert.alert(
            '대기자 등록 완료',
            `대기자로 등록되었습니다.\n현재 대기 순서: ${result.position}번째`
          );
        } else {
          Alert.alert('등록 실패', result.error || '대기자 등록에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('매치 참가 오류:', error);
      Alert.alert('오류', '매치 참가 중 오류가 발생했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!depositorName.trim()) {
      Alert.alert('입력 오류', '입금자명을 입력해주세요.');
      return;
    }

    try {
      const result = await WaitlistManager.handleUserPaymentSubmission(
        paymentRequest.id,
        match,
        depositorName
      );

      if (result.success) {
        updateMatch(result.updatedMatch);
        setShowPaymentModal(false);
        setPaymentRequest(null);
        setDepositorName('');
        
        Alert.alert(
          '입금 신고 완료',
          '입금 신고가 완료되었습니다.\n관리자 확인 후 참가가 확정됩니다.'
        );
      } else {
        Alert.alert('신고 실패', result.error || '입금 신고에 실패했습니다.');
      }
    } catch (error) {
      console.error('입금 신고 오류:', error);
      Alert.alert('오류', '입금 신고 중 오류가 발생했습니다.');
    }
  };

  const handleCancelParticipation = (refundAccount: any) => {
    // 참가 취소 처리
    if (myParticipation) {
      myParticipation.status = 'cancelled_by_user';
      myParticipation.cancelledAt = new Date().toISOString();
      myParticipation.refundAccount = refundAccount;
      myParticipation.refundRequestedAt = new Date().toISOString();

      // 참가자 수 감소
      if (user.gender === '남성') {
        match.currentApplicants.male = Math.max(0, match.currentApplicants.male - 1);
      } else {
        match.currentApplicants.female = Math.max(0, match.currentApplicants.female - 1);
      }
      match.currentApplicants.total = match.currentApplicants.male + match.currentApplicants.female;

      updateMatch(match);
      setShowCancelModal(false);

      Alert.alert(
        '참가 취소 완료',
        '참가가 취소되었습니다.\n환불은 영업일 기준 3-5일 내에 처리됩니다.'
      );

      // 대기자에게 알림 발송
      WaitlistManager.handleParticipantCancellation(match, user.gender);
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getParticipationStatus = () => {
    if (myParticipation) {
      switch (myParticipation.status) {
        case 'confirmed':
          return { text: '참가확정', color: '#16a34a', icon: <CheckCircle size={16} color="#16a34a" /> };
        case 'payment_pending':
          return { text: '입금확인중', color: '#f59e0b', icon: <Clock size={16} color="#f59e0b" /> };
        case 'cancelled_by_user':
          return { text: '취소됨', color: '#dc2626', icon: <X size={16} color="#dc2626" /> };
        default:
          return { text: '알 수 없음', color: '#6b7280', icon: <AlertTriangle size={16} color="#6b7280" /> };
      }
    }
    
    if (myWaiting) {
      const position = match.waitingList
        .filter(w => w.status === 'waiting')
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
        .findIndex(w => w.userId === user.id) + 1;
      
      return { 
        text: `대기중 (${position}번째)`, 
        color: '#f59e0b', 
        icon: <Clock size={16} color="#f59e0b" /> 
      };
    }
    
    return null;
  };

  const participationStatus = getParticipationStatus();

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
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 판매자 정보 */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerInfo}>
            <View style={styles.profileImageContainer}>
              {match.seller.profileImage ? (
                <Image 
                  source={{ uri: match.seller.profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <User size={32} color="#9ca3af" />
                </View>
              )}
            </View>
            
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{match.seller.name}</Text>
                <CertificationBadge 
                  ntrpCert={match.seller.certification.ntrp}
                  careerCert={match.seller.certification.career}
                  youtubeCert={match.seller.certification.youtube}
                  instagramCert={match.seller.certification.instagram}
                  size="medium"
                />
              </View>
              <Text style={styles.sellerMeta}>
                {match.seller.gender} · {match.seller.ageGroup} · NTRP {match.seller.ntrp} · {match.seller.careerType}
              </Text>
              <View style={styles.sellerStats}>
                <View style={styles.statItem}>
                  <Star size={14} color="#f59e0b" />
                  <Text style={styles.statText}>{match.seller.avgRating}</Text>
                </View>
                <View style={styles.statItem}>
                  <Eye size={14} color="#6b7280" />
                  <Text style={styles.statText}>{match.seller.viewCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Heart size={14} color="#ec4899" />
                  <Text style={styles.statText}>{match.seller.likeCount}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 매치 정보 */}
        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>{match.title}</Text>
            <View style={styles.matchTypeBadge}>
              <Text style={styles.matchTypeText}>{match.matchType}</Text>
            </View>
          </View>

          <Text style={styles.matchDescription}>{match.description}</Text>

          <View style={styles.matchDetails}>
            <View style={styles.detailRow}>
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {match.date} {formatTime(match.time)}~{formatTime(match.endTime)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.detailText}>{match.court}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Users size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {match.currentApplicants.total}/{match.expectedParticipants.total}명 참가
                {match.waitingApplicants > 0 && ` · 대기 ${match.waitingApplicants}명`}
              </Text>
            </View>
          </View>

          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>
                현재가: {match.currentPrice.toLocaleString()}원
              </Text>
              <Text style={styles.basePrice}>
                기본가: {match.basePrice.toLocaleString()}원
              </Text>
            </View>
          </View>
        </View>

        {/* 참가 상태 */}
        {participationStatus && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              {participationStatus.icon}
              <Text style={[styles.statusText, { color: participationStatus.color }]}>
                {participationStatus.text}
              </Text>
            </View>
            
            {myParticipation?.status === 'payment_pending' && (
              <Text style={styles.statusDescription}>
                입금 확인 중입니다. 관리자 확인 후 참가가 확정됩니다.
              </Text>
            )}
            
            {myParticipation?.status === 'confirmed' && (
              <Text style={styles.statusDescription}>
                매치 참가가 확정되었습니다. 매치 당일에 참여해주세요.
              </Text>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 하단 액션 버튼 */}
      {!isSeller && (
        <View style={styles.actionBar}>
          {!isParticipant && !isWaiting ? (
            <TouchableOpacity 
              style={[
                styles.joinButton,
                (!canParticipate().canJoin || isJoining) && styles.joinButtonDisabled
              ]}
              onPress={handleJoinMatch}
              disabled={!canParticipate().canJoin || isJoining}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.joinButtonText}>
                  {canParticipate().canJoin ? '참가신청' : canParticipate().reason}
                </Text>
              )}
            </TouchableOpacity>
          ) : myParticipation?.status === 'confirmed' ? (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCancelModal(true)}
            >
              <Text style={styles.cancelButtonText}>참가 취소</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statusInfo}>
              <Text style={styles.statusInfoText}>
                {participationStatus?.text}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 결제 모달 */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>입금 안내</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.paymentSection}>
              <View style={styles.timerSection}>
                <Clock size={24} color="#dc2626" />
                <Text style={styles.timerText}>
                  남은 시간: {formatTimer(timeLeft)}
                </Text>
              </View>

              <View style={styles.accountInfo}>
                <Text style={styles.accountTitle}>입금 계좌</Text>
                <View style={styles.accountDetails}>
                  <Building size={16} color="#6b7280" />
                  <Text style={styles.accountText}>
                    국민은행 123-456-789012
                  </Text>
                </View>
                <Text style={styles.accountHolder}>예금주: MatchMarket</Text>
              </View>

              <View style={styles.amountInfo}>
                <Text style={styles.amountTitle}>입금 금액</Text>
                <Text style={styles.amountValue}>
                  {paymentRequest?.amount.toLocaleString()}원
                </Text>
              </View>

              <View style={styles.depositorSection}>
                <Text style={styles.inputLabel}>입금자명 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={depositorName}
                  onChangeText={setDepositorName}
                  placeholder="입금하신 분의 성함을 입력하세요"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <TouchableOpacity 
                style={styles.submitPaymentButton}
                onPress={handlePaymentSubmit}
              >
                <Text style={styles.submitPaymentButtonText}>입금 완료 신고</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 참가 취소 모달 */}
      <CancelParticipationModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelParticipation}
        matchTitle={match.title}
        refundAmount={myParticipation?.paymentAmount || 0}
      />
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  backToHomeButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHomeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loginPromptText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sellerCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerInfo: {
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
    borderColor: '#d1d5db',
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
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  sellerMeta: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  sellerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  matchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  matchTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 26,
  },
  matchTypeBadge: {
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ec4899',
  },
  matchTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ec4899',
  },
  matchDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 20,
  },
  matchDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  priceSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ec4899',
  },
  basePrice: {
    fontSize: 14,
    color: '#9ca3af',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actionBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  joinButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  statusInfo: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  bottomPadding: {
    height: 40,
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
  modalContent: {
    flex: 1,
    paddingTop: 16,
  },
  paymentSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  accountInfo: {
    marginBottom: 20,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  accountDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  accountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  accountHolder: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 24,
  },
  amountInfo: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  amountTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400e',
  },
  depositorSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  submitPaymentButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitPaymentButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});