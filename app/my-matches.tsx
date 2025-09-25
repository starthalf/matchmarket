import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Trash2, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, User, Lock } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { mockMatches, mockUsers, addMockEarning, EarningsData } from '../data/mockData';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useSafeStyles } from '../constants/Styles';
import { useMatches } from '../contexts/MatchContext'; // 추가

export default function MyMatchesScreen() {
  const { user } = useAuth();
const { matches, updateMatch } = useMatches();
  const safeStyles = useSafeStyles();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [completedMatches, setCompletedMatches] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    confirmStyle?: 'default' | 'destructive';
  } | null>(null);

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <Text>로그인이 필요합니다.</Text>
      </SafeAreaView>
    );
  }

  // 내가 등록한 매치들
  const myMatches = matches.filter(match => match.sellerId === user.id); // 변경

  // 실제 매치의 참여자 정보 가져오기
  const getMatchParticipants = (match: any) => {
    if (!match.participants || !Array.isArray(match.participants)) {
      return [];
    }

    return match.participants
      .filter(p => p.status === 'confirmed' || p.status === 'payment_pending')
      .map(p => {
        // mockUsers에서 사용자 정보 찾기
        const user = mockUsers.find(u => u.id === p.userId);
        return {
          id: p.userId,
          name: user?.name || p.userName || '알 수 없음',
          gender: user?.gender || p.userGender || '미확인',
          ntrp: user?.ntrp || p.userNtrp || 0,
          joinedAt: p.joinedAt || p.paymentConfirmedAt || new Date().toISOString(),
          status: p.status,
          appliedPrice: p.appliedPrice || p.paymentAmount || match.currentPrice
        };
      })
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  };

  // 참여신청자 목록 가져오기 함수
  const getMatchApplications = (match: any) => {
    if (!match.applications || !Array.isArray(match.applications)) {
      return [];
    }

    return match.applications
      .filter(app => app.status === 'pending')
      .map(app => {
        const user = mockUsers.find(u => u.id === app.userId);
        return {
          ...app,
          name: user?.name || app.userName,
          gender: user?.gender || app.userGender,
          ntrp: user?.ntrp || app.userNtrp,
          profileImage: user?.profileImage || app.userProfileImage
        };
      })
      .sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());
  };

  // 참여신청 승인 처리 함수
  const handleApproveApplication = (match: any, application: any) => {
    Alert.alert(
      '참여신청 승인',
      `${application.name}님의 참여신청을 승인하시겠습니까?\n\n신청가격: ${application.appliedPrice.toLocaleString()}원`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '승인', 
          onPress: () => {
            try {
            const updatedApplications = (match.applications || []).map(app => 
  app.id === application.id 
    ? { ...app, status: 'approved', approvedAt: new Date().toISOString() }
    : app
);

const newParticipant = {
  id: `participant_${application.id}`,
  userId: application.userId,
  userName: application.name,
  gender: application.gender,
  ntrp: application.ntrp,
  joinedAt: new Date().toISOString(),
  status: 'payment_pending',
  paymentAmount: application.appliedPrice,
  appliedPrice: application.appliedPrice,
};

const updatedMatch = {
  ...match,
  applications: updatedApplications,
  participants: [...(match.participants || []), newParticipant],
  currentApplicants: {
    ...match.currentApplicants,
    [application.gender === '남성' ? 'male' : 'female']: 
      match.currentApplicants[application.gender === '남성' ? 'male' : 'female'] + 1,
    total: match.currentApplicants.total + 1
  }
};

updateMatch(updatedMatch);
setSelectedMatch(updatedMatch);

              Alert.alert('승인 완료', `${application.name}님의 참여신청이 승인되었습니다.`);
            } catch (error) {
              console.error('승인 처리 중 오류:', error);
              Alert.alert('오류', '승인 처리 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 참여신청 거절 처리 함수
  const handleRejectApplication = (match: any, application: any) => {
    Alert.alert(
      '참여신청 거절',
      `${application.name}님의 참여신청을 거절하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '거절', 
          style: 'destructive',
          onPress: () => {
            try {
              // mockMatches에서 해당 매치 찾기
              const matchIndex = mockMatches.findIndex(m => m.id === match.id);
              if (matchIndex === -1) {
                Alert.alert('오류', '매치를 찾을 수 없습니다.');
                return;
              }

              const targetMatch = mockMatches[matchIndex];

              // applications 배열이 없으면 생성
              if (!targetMatch.applications) {
                targetMatch.applications = [];
              }

              // 신청 상태를 rejected로 변경
              const updatedApplications = targetMatch.applications.map(app => 
                app.id === application.id 
                  ? { ...app, status: 'rejected', rejectedAt: new Date().toISOString() }
                  : app
              );

              // mockMatches의 해당 매치 업데이트
              mockMatches[matchIndex] = {
                ...targetMatch,
                applications: updatedApplications
              };

              // 로컬 selectedMatch 상태도 업데이트
              setSelectedMatch({...mockMatches[matchIndex]});

              Alert.alert('거절 완료', `${application.name}님의 참여신청이 거절되었습니다.`);
            } catch (error) {
              console.error('거절 처리 중 오류:', error);
              Alert.alert('오류', '거절 처리 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteMatch = (match: any) => {
    const hoursUntilMatch = (new Date(`${match.date}T${match.time}`).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilMatch < 48) {
      setConfirmModalData({
        title: '삭제 불가',
        message: '매치 시작 48시간 전부터는 매치를 삭제할 수 없습니다.',
        confirmText: '확인',
        onConfirm: () => setShowConfirmModal(false),
      });
      setShowConfirmModal(true);
      return;
    }

    setConfirmModalData({
      title: '매치 삭제',
      message: `정말로 "${match.title}" 매치를 삭제하시겠습니까?\n\n참가자들에게 자동으로 환불됩니다.`,
      confirmText: '삭제',
      confirmStyle: 'destructive',
      onConfirm: () => {
        setShowConfirmModal(false);
        setTimeout(() => {
          setConfirmModalData({
            title: '매치 삭제 완료',
            message: '매치가 삭제되었고 참가자들에게 환불이 진행됩니다.',
            confirmText: '확인',
            onConfirm: () => setShowConfirmModal(false),
          });
          setShowConfirmModal(true);
        }, 100);
      },
    });
    setShowConfirmModal(true);
  };

  const handleConfirmMatch = (match: any) => {
    console.log('=== handleConfirmMatch 함수 시작 ===');
    console.log('match:', match);
    
    const now = new Date();
    const matchTime = new Date(`${match.date}T${match.time}`);
    console.log('현재 시간:', now);
    console.log('매치 시간:', matchTime);
    console.log('매치 시간이 지났는지:', now > matchTime);
    
    if (now < matchTime) {
      console.log('매치 시간이 아직 안됨 - 알림 표시');
      setConfirmModalData({
        title: '확정 불가',
        message: '매치 시작 시간이 지난 후에 확정할 수 있습니다.',
        confirmText: '확인',
        onConfirm: () => setShowConfirmModal(false),
      });
      setShowConfirmModal(true);
      return;
    }

    console.log('매치 완료 확인 알림 표시');
    setConfirmModalData({
      title: '경기 완료',
      message: `"${match.title}" 매치가 성공적으로 진행되었습니까?`,
      confirmText: '경기 완료',
      onConfirm: () => {
        console.log('=== 경기 완료 버튼 클릭됨 ===');
        console.log('수익 계산 시작...');
        
        // 수익 계산 및 추가
        const matchBaseCost = match.basePrice * match.currentApplicants.total;
        const matchTotalPaid = match.currentPrice * match.currentApplicants.total;
        const matchAdditionalRevenue = Math.max(0, (matchTotalPaid - matchBaseCost) * 0.85);
        
        console.log('수익 계산 결과:', {
          matchBaseCost,
          matchTotalPaid,
          matchAdditionalRevenue
        });
        
        // 광고 수익 (랜덤 생성)
        const adViews = Math.floor(Math.random() * 1500) + 500;
        const adClicks = Math.floor(adViews * 0.05) + Math.floor(Math.random() * 50);
        const adRevenue = adClicks * (Math.floor(Math.random() * 200) + 100);
        const adShare = match.adEnabled ? adRevenue * 0.5 : 0;
        
        console.log('광고 수익 계산:', {
          adViews,
          adClicks,
          adRevenue,
          adShare
        });
        
        const totalRevenue = matchBaseCost + matchAdditionalRevenue + adShare;
        console.log('총 수익:', totalRevenue);
        
        const newEarning: EarningsData = {
          id: match.id,
          matchTitle: match.title,
          date: match.date,
          matchBasePrice: matchBaseCost,
          matchTotalPaid: matchTotalPaid,
          matchBaseCost: matchBaseCost,
          matchAdditionalRevenue: matchAdditionalRevenue,
          adViews: adViews,
          adClicks: adClicks,
          adRevenue: adRevenue,
          adShare: adShare,
          totalRevenue: totalRevenue,
        };
        
        console.log('새 수익 데이터:', newEarning);
        console.log('addMockEarning 호출 전');
        addMockEarning(newEarning);
        console.log('addMockEarning 호출 후');
        
        // 매치를 완료된 매치 목록에 추가
        console.log('completedMatches 업데이트 전:', completedMatches);
        setCompletedMatches(prev => new Set([...prev, match.id]));
        console.log('completedMatches 업데이트 후');
        
        setShowConfirmModal(false);
        
        // 완료 알림을 별도 모달로 표시
        setTimeout(() => {
          setConfirmModalData({
            title: '경기 완료 처리됨',
            message: `매치가 완료되었습니다.\n\n💰 정산 금액: ${totalRevenue.toLocaleString()}원\n- 기본비용: ${matchBaseCost.toLocaleString()}원\n- 추가수익: ${matchAdditionalRevenue.toLocaleString()}원\n- 광고수익: ${adShare.toLocaleString()}원\n\n수익 정산 페이지에서 확인하세요.`,
            confirmText: '확인',
            onConfirm: () => setShowConfirmModal(false),
          });
          setShowConfirmModal(true);
        }, 100);
        
        console.log('=== handleConfirmMatch 완료 ===');
      },
    });
    setShowConfirmModal(true);
  };

  const handleViewParticipants = (match: any) => {
    setSelectedMatch(match);
    setShowParticipantsModal(true);
  };

  const handleToggleClosedStatus = (match: any) => {
    const newClosedStatus = !match.isClosed;
    const statusText = newClosedStatus ? '마감' : '모집 재개';
    
    setConfirmModalData({
      title: `매치 ${statusText}`,
      message: `"${match.title}" 매치를 ${statusText}하시겠습니까?${newClosedStatus ? '\n\n마감 시 더 이상 대기자를 받지 않습니다.' : ''}`,
      confirmText: statusText,
      onConfirm: () => {
        // 매치 상태 업데이트
        match.isClosed = newClosedStatus;
        
        if (newClosedStatus) {
          // 마감 시 현재 참가자 수를 예상 참가자 수와 동일하게 설정하고 대기자 수를 0으로 설정
          match.currentApplicants = { ...match.expectedParticipants };
          match.waitingApplicants = 0;
          match.waitingList = [];
        }
        
        setShowConfirmModal(false);
        
        // 완료 알림
        setTimeout(() => {
          setConfirmModalData({
            title: '완료',
            message: `매치가 ${statusText}되었습니다.`,
            confirmText: '확인',
            onConfirm: () => setShowConfirmModal(false),
          });
          setShowConfirmModal(true);
        }, 100);
      },
    });
    setShowConfirmModal(true);
  };

  const getMatchStatus = (match: any) => {
    // 경기 완료 처리된 매치인지 확인
    if (completedMatches.has(match.id)) {
      return { status: 'settled', text: '경기완료', color: '#16a34a' };
    }
    
    if (match.isClosed) {
      return { status: 'closed', text: '마감됨', color: '#6b7280' };
    }
    
    const now = new Date();
    const matchTime = new Date(`${match.date}T${match.time}`);
    const hoursUntilMatch = (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (match.currentApplicants.total >= match.expectedParticipants.total) {
      return { status: 'confirmed', text: '확정됨', color: '#3b82f6' };
    } else if (hoursUntilMatch <= 24) {
      return { status: 'closing', text: '마감임박', color: '#f59e0b' };
    } else {
      return { status: 'recruiting', text: '모집중', color: '#6b7280' };
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
          <Text style={safeStyles.headerTitle}>내 매치 관리</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {myMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>등록한 매치가 없습니다</Text>
            <Text style={styles.emptyText}>첫 매치를 등록해보세요</Text>
          </View>
        ) : (
          myMatches.map((match) => {
            const status = getMatchStatus(match);
            const now = new Date();
            const matchTime = new Date(`${match.date}T${match.time}`);
            const canConfirm = now > matchTime && !completedMatches.has(match.id);
            
            return (
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <View style={styles.matchTitleRow}>
                    <Text style={styles.matchTitle} numberOfLines={1}>
                      {match.title}
                    </Text>
                    {status.status === 'settled' && (
                      <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                        <Text style={styles.statusText}>{status.text}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.matchDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {match.date} {match.time}~{match.endTime}
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

                <View style={styles.priceInfo}>
                  <Text style={styles.currentPrice}>
                    현재가: {match.currentPrice.toLocaleString()}원
                  </Text>
                  <Text style={styles.basePrice}>
                    기본가: {match.initialPrice?.toLocaleString() || match.basePrice?.toLocaleString() || 0}원
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.participantsButton}
                    onPress={() => handleViewParticipants(match)}
                  >
                    <Users size={16} color="#3b82f6" />
                    <Text style={styles.participantsButtonText}>참가자 보기</Text>
                  </TouchableOpacity>
                  
                  {canConfirm && (
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={() => handleConfirmMatch(match)}
                    >
                      <CheckCircle size={16} color="#16a34a" />
                      <Text style={styles.confirmButtonText}>경기 완료</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMatch(match)}
                  >
                    <Trash2 size={16} color="#dc2626" />
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 마감 토글 - 별도 섹션 */}
                <View style={styles.closedToggleSection}>
                  <View style={styles.closedToggleContainer}>
                    <Lock size={16} color="#6b7280" />
                    <Text style={styles.closedToggleLabel}>
                      {completedMatches.has(match.id) 
                        ? '경기완료' 
                        : match.isClosed ? '마감됨' : '모집중'}
                    </Text>
                  </View>
                  <Switch
                    value={completedMatches.has(match.id) || match.isClosed || false}
                    onValueChange={() => handleToggleClosedStatus(match)}
                    disabled={completedMatches.has(match.id)}
                    trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
                    thumbColor={completedMatches.has(match.id) ? '#16a34a' : (match.isClosed ? '#dc2626' : '#f4f3f4')}
                  />
                </View>
              </View>
            );
          })
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 참가자 목록 모달 */}
      <Modal
        visible={showParticipantsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowParticipantsModal(false)}>
              <Text style={styles.modalCancelText}>닫기</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>참가자 목록</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedMatch && (
              <>
                <View style={styles.matchInfoCard}>
                  <Text style={styles.matchInfoTitle}>{selectedMatch.title}</Text>
                  <Text style={styles.matchInfoDetails}>
                    {selectedMatch.date} {selectedMatch.time} · {selectedMatch.court}
                  </Text>
                </View>

                <View style={styles.participantsSection}>
                  <Text style={styles.sectionTitle}>
                    확정 참가자 ({getMatchParticipants(selectedMatch).length}명)
                  </Text>
                  
                  {getMatchParticipants(selectedMatch).map((participant) => (
                    <View key={participant.id} style={styles.participantCard}>
                      <View style={styles.participantInfo}>
                        <User size={20} color="#6b7280" />
                        <View style={styles.participantDetails}>
                          <Text style={styles.participantName}>{participant.name}</Text>
                          <Text style={styles.participantMeta}>
                            {participant.gender} · NTRP {participant.ntrp}
                          </Text>
                          <Text style={styles.participantPrice}>
                            참가비: {(participant.appliedPrice || selectedMatch.currentPrice || 0).toLocaleString()}원
                          </Text>
                        </View>
                      </View>
                      <View style={styles.participantStatus}>
                        <Text style={styles.joinedDate}>
                          {new Date(participant.joinedAt).toLocaleDateString('ko-KR')}
                        </Text>
                        <Text style={[styles.statusText, { color: participant.status === 'confirmed' ? '#16a34a' : '#f59e0b' }]}>
                          {participant.status === 'confirmed' ? '참가확정' : '입금확인중'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {getMatchApplications(selectedMatch).length > 0 && (
                  <View style={styles.applicationsSection}>
                    <Text style={styles.sectionTitle}>
                      참여신청자 ({getMatchApplications(selectedMatch).length}명)
                    </Text>
                    
                    {getMatchApplications(selectedMatch).map((application) => (
                      <View key={application.id} style={styles.applicationCard}>
                        <View style={styles.applicationInfo}>
                          <User size={20} color="#f59e0b" />
                          <View style={styles.applicationDetails}>
                            <Text style={styles.applicationName}>{application.name}</Text>
                            <Text style={styles.applicationMeta}>
                              {application.gender} · NTRP {application.ntrp}
                            </Text>
                            <Text style={styles.applicationPrice}>
                              신청가격: {application.appliedPrice.toLocaleString()}원
                            </Text>
                          </View>
                        </View>
                        <View style={styles.applicationActions}>
                          <TouchableOpacity 
                            style={styles.approveButton}
                            onPress={() => handleApproveApplication(selectedMatch, application)}
                          >
                            <Text style={styles.approveButtonText}>승인</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.rejectButton}
                            onPress={() => handleRejectApplication(selectedMatch, application)}
                          >
                            <Text style={styles.rejectButtonText}>거절</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {selectedMatch.waitingList && selectedMatch.waitingList.length > 0 && (
                  <View style={styles.waitingSection}>
                    <Text style={styles.sectionTitle}>
                      대기자 목록 ({selectedMatch.waitingList.length}명)
                    </Text>
                    
                    {selectedMatch.waitingList.map((waiter: any, index: number) => (
                      <View key={waiter.id} style={styles.waiterCard}>
                        <View style={styles.waiterInfo}>
                          <Text style={styles.waiterPosition}>{index + 1}</Text>
                          <User size={16} color="#6b7280" />
                          <View style={styles.waiterDetails}>
                            <Text style={styles.waiterName}>{waiter.userName}</Text>
                            <Text style={styles.waiterMeta}>
                              {waiter.gender} · NTRP {waiter.ntrp}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.waitingStatus}>대기중</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 확인 모달 */}
      {confirmModalData && (
        <ConfirmationModal
          visible={showConfirmModal}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmText={confirmModalData.confirmText}
          confirmStyle={confirmModalData.confirmStyle}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  matchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  matchHeader: {
    marginBottom: 12,
  },
  matchTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  matchTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
    fontSize: 14,
    color: '#6b7280',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ec4899',
  },
  basePrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  participantsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dbeafe',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  participantsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  closedToggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderWidth: 1,
    borderTopColor: '#f3f4f6',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  closedToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closedToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
  matchInfoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  matchInfoDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  participantsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  waitingSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantDetails: {
    flex: 1,
    gap: 2,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  participantMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  participantPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 2,
  },
  participantStatus: {
    alignItems: 'flex-end',
    gap: 2,
  },
  joinedDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  waiterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  waiterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waiterPosition: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    width: 20,
  },
  waiterDetails: {
    gap: 2,
  },
  waiterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  waiterMeta: {
    fontSize: 12,
    color: '#92400e',
  },
  waitingStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  applicationsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  applicationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  applicationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applicationDetails: {
    flex: 1,
    gap: 2,
  },
  applicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  applicationMeta: {
    fontSize: 12,
    color: '#92400e',
  },
  applicationPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 2,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  rejectButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});