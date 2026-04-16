// app/(tabs)/match-management.tsx - 완전 구현 버전
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, Users, Check, X, Clock, Calendar, CheckCircle, User, LogIn } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { Match, MatchApplication } from '../../types/tennis';
import { useSafeStyles } from '../../constants/Styles';
import { EarningsManager } from '../../utils/earningsManager';
import { router } from 'expo-router';
import { supabase, subscribeToParticipantUpdates, createNotification, markNotificationsAsRead } from '../../lib/supabase';

export default function MatchManagementScreen() {
  const { user } = useAuth();
  const { matches, updateMatch } = useMatches();
  const safeStyles = useSafeStyles();
  const [selectedTab, setSelectedTab] = useState<'my-matches' | 'applications'>('my-matches');
  const [showPastMatches, setShowPastMatches] = useState(false);

  // 내가 등록한 매치들
  const myMatches = matches.filter(match => match.sellerId === user?.id);
  
  // 내가 신청한 매치들
  const myApplications = matches.filter(match => 
    match.applications?.some(app => app.userId === user?.id)
  );

// 현재 시간
const now = new Date();

// ✅ 수정된 코드 - 종료 시간 기준으로 변경
// 내 매치를 진행 예정 / 지난 매치로 분류
const upcomingMyMatches = myMatches.filter(match => {
  const matchEndDateTime = new Date(`${match.date} ${match.endTime}`);
  // 종료 시간이 안 지났거나 경기완료 안 했으면 진행 예정으로
  return matchEndDateTime >= now || !match.isCompleted;
});

const pastMyMatches = myMatches.filter(match => {
  const matchEndDateTime = new Date(`${match.date} ${match.endTime}`);
  // 종료 시간 지났고 경기완료 한 것만 지난 매치로
  return matchEndDateTime < now && match.isCompleted;
});

// 내 신청 매치도 분류
const upcomingMyApplications = myApplications.filter(match => {
  const matchEndDateTime = new Date(`${match.date} ${match.endTime}`);
  return matchEndDateTime >= now;
});

const pastMyApplications = myApplications.filter(match => {
  const matchEndDateTime = new Date(`${match.date} ${match.endTime}`);
  return matchEndDateTime < now;
});



// 🔥 승인 알림이 있으면 참여매치 탭을 먼저 보여주기
  useEffect(() => {
    if (!user) return;

    const checkAndMarkNotifications = async () => {
      try {
        // 먼저 승인 알림이 있는지 확인
        const { data: approvedNotifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'approved')
          .eq('read', false);

        // 승인 알림이 있으면 참여매치 탭으로 전환
        if (approvedNotifications && approvedNotifications.length > 0) {
          setSelectedTab('applications');
        }

        // 모든 알림 읽음 처리
        await markNotificationsAsRead(user.id, 'new_application');
        await markNotificationsAsRead(user.id, 'rejected');
        await markNotificationsAsRead(user.id, 'payment_confirmed');
        await markNotificationsAsRead(user.id, 'approved'); // 승인 알림도 읽음 처리
      } catch (error) {
        console.error('알림 확인 실패:', error);
      }
    };

    checkAndMarkNotifications();
  }, [user]);

  // 🔥 입금 대기 시간 만료된 신청 자동 제거
  useEffect(() => {
    const checkAndRemoveExpiredApplications = () => {
      const now = new Date().getTime();
      
      myMatches.forEach(match => {
        if (!match.applications || match.applications.length === 0) return;
        
        const updatedApplications = match.applications.filter(app => {
          // approved 상태이고 approvedAt이 있는 경우만 체크
          if (app.status === 'approved' && app.approvedAt) {
            const approvedTime = new Date(app.approvedAt).getTime();
            const elapsedSeconds = Math.floor((now - approvedTime) / 1000);
            const remainingSeconds = Math.max(0, 300 - elapsedSeconds); // 5분
            
            // 시간이 만료되면 false를 반환하여 필터링됨
            return remainingSeconds > 0;
          }
          
          // 다른 상태는 그대로 유지
          return true;
        });
        
        // applications가 변경되었으면 업데이트
        if (updatedApplications.length !== match.applications.length) {
          updateMatch({
            ...match,
            applications: updatedApplications
          });
        }
      });
    };
    
    // 컴포넌트 마운트 시 체크
    checkAndRemoveExpiredApplications();
    
    // 10초마다 체크 (더 자주 체크)
    const interval = setInterval(checkAndRemoveExpiredApplications, 10000);
    
    return () => clearInterval(interval);
  }, [myMatches, updateMatch]);

// 🔥 판매자: 입금완료 실시간 알림 감지
useEffect(() => {
  if (!user) return;

  const unsubscribe = subscribeToParticipantUpdates(user.id, (updatedParticipant) => {
    // 판매자가 등록한 매치 찾기
    const myMatch = myMatches.find(m => m.id === updatedParticipant.match_id);
    
    if (myMatch && updatedParticipant.status === 'payment_submitted') {
      // 입금완료 알림
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`💰 입금완료!\n참여자가 입금을 완료했습니다.\n매치관리에서 입금을 확인해주세요.`);
      }
    }
  });

  return () => unsubscribe();
}, [user, myMatches]);

// 🔥 참여자: 승인 감지 및 매치 상세 화면으로 자동 이동
useEffect(() => {
  if (!user) return;

  const unsubscribe = subscribeToParticipantUpdates(user.id, (updatedParticipant) => {
    // 승인된 매치 찾기
    const approvedMatch = matches.find(m => m.id === updatedParticipant.match_id);
    
    if (approvedMatch && updatedParticipant.status === 'approved') {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('🎾 매치 참가 승인!\n매치 참가가 승인되었습니다.\n5분 내에 입금을 완료해주세요.');
        router.push(`/match/${approvedMatch.id}`);
      }
    }
  });

  return () => unsubscribe();
}, [user, matches]);

  const handleApproveApplication = (matchId: string, applicationId: string) => {
  const match = matches.find(m => m.id === matchId);
  if (!match || !match.applications) return;

  const application = match.applications.find(app => app.id === applicationId);
  if (!application) return;

  const executeApproval = async () => {
    const updatedApplications = match.applications!.map(app =>
      app.id === applicationId 
        ? { 
            ...app, 
            status: 'approved' as const,
            approvedAt: new Date().toISOString()
          }
        : app
    );

    await updateMatch({
      ...match,
      applications: updatedApplications
    });

    // 🔥 참여자에게 승인 알림 전송 (Supabase)
    await createNotification(
      application.userId,
      'approved',
      match.id,
      user?.id,
      match.title
    );
  };

  if (typeof window !== 'undefined' && window.confirm) {
    if (window.confirm(`${application.userName}님의 참여신청을 승인하시겠습니까?`)) {
      executeApproval();
      window.alert('참여신청이 승인되었습니다.');
    }
  } else {
    Alert.alert(
      '참여신청 승인',
      `${application.userName}님의 참여신청을 승인하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '승인',
          onPress: () => {
            executeApproval();
            Alert.alert('승인 완료', '참여신청이 승인되었습니다.\n결제요청이 전송됩니다.');
          }
        }
      ]
    );
  }
};

 const handleRejectApplication = (matchId: string, applicationId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || !match.applications) return;

    const application = match.applications.find(app => app.id === applicationId);
    if (!application) return;

    const executeRejection = async () => {
      const updatedApplications = match.applications!.map(app =>
        app.id === applicationId 
          ? { ...app, status: 'rejected' as const }
          : app
      );

      await updateMatch({
        ...match,
        applications: updatedApplications
      });

      // 🔥 참여자에게 거절 알림 전송 (Supabase)
      await createNotification(
        application.userId,
        'rejected',
        match.id,
        user?.id,
        match.title
      );
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`${application.userName}님의 참여신청을 거절하시겠습니까?`)) {
        executeRejection().then(() => {
          window.alert('참여신청이 거절되었습니다.');
        });
      }
    } else {
      Alert.alert(
        '참여신청 거절',
        `${application.userName}님의 참여신청을 거절하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '거절',
            style: 'destructive',
            onPress: async () => {
              await executeRejection();
              Alert.alert('거절 완료', '참여신청이 거절되었습니다.');
            }
          }
        ]
      );
    }
  };

// 수정할 부분: 248번째 줄부터 302번째 줄까지

// 🆕 입금 확인 처리
const handleConfirmPayment = (matchId: string, applicationId: string) => {
  const match = matches.find(m => m.id === matchId);
  if (!match || !match.applications) return;

  const application = match.applications.find(app => app.id === applicationId);
  if (!application) return;

  const executeConfirmation = async () => {
    const updatedApplications = match.applications!.map(app =>
      app.id === applicationId 
        ? { 
            ...app, 
            status: 'confirmed' as const,
            paymentConfirmedAt: new Date().toISOString()
          }
        : app
    );

    const updatedMatch = {
      ...match,
      applications: updatedApplications
    };

    await updateMatch(updatedMatch);

    // 🔥 수익정산 생성 (입금 확인 시점)
    try {
      const earningCreated = await EarningsManager.createEarningFromMatch(updatedMatch);
      if (earningCreated) {
        console.log('✅ 수익정산이 생성되었습니다.');
      }
    } catch (error) {
      console.error('수익정산 생성 실패:', error);
    }

    // 🔥 참여자에게 채팅 알림 전송 (Supabase)
    await createNotification(
      application.userId,
      'new_chat_room',
      match.id,
      user?.id,
      user?.name
    );
  };

  if (typeof window !== 'undefined' && window.confirm) {
    if (window.confirm(`${application.userName}님의 입금을 확인하시겠습니까?\n\n확인 시 참여가 확정되어 채팅방에 입장됩니다.`)) {
      executeConfirmation();
      window.alert('입금이 확인되었습니다.');
    }
  } else {
    Alert.alert(
      '입금 확인',
      `${application.userName}님의 입금을 확인하시겠습니까?\n\n확인 시 참여가 확정되어 채팅방에 입장됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '입금 확인',
          onPress: () => {
            executeConfirmation();
            Alert.alert('확인 완료', '입금이 확인되어 참여가 확정되었습니다.');
          }
        }
      ]
    );
  }
};
  
  // 모집중/마감 토글
  const handleToggleRecruitment = (match: Match) => {
    const newStatus = !match.isClosed;
    
    const executeToggle = () => {
      updateMatch({
        ...match,
        isClosed: newStatus
      });
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(newStatus ? '매치를 마감하시겠습니까?' : '매치 모집을 다시 시작하시겠습니까?')) {
        executeToggle();
        window.alert(newStatus ? '매치가 마감되었습니다.' : '매치 모집이 시작되었습니다.');
      }
    } else {
      Alert.alert(
        newStatus ? '매치 마감' : '모집 재개',
        newStatus ? '매치를 마감하시겠습니까?' : '매치 모집을 다시 시작하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '확인',
            onPress: () => {
              executeToggle();
              Alert.alert('완료', newStatus ? '매치가 마감되었습니다.' : '매치 모집이 시작되었습니다.');
            }
          }
        ]
      );
    }
  };

 /* 경기완료 기능 - 비활성화
  // 경기완료 처리
  const handleCompleteMatch = async (match: Match) => {
    const executeComplete = async () => {
      // 1. 매치 완료 처리
      await updateMatch({
        ...match,
        isCompleted: true,
        completedAt: new Date().toISOString()
      });
      
      // 2. 수익 데이터 생성 및 저장
      const success = await EarningsManager.createEarningFromMatch(match);
      
      if (success) {
        Alert.alert(
          '완료', 
          '경기가 완료 처리되었습니다.\n수익이 정산되었습니다. 수익 정산 메뉴에서 확인하세요.'
        );
      } else {
        Alert.alert(
          '완료',
          '경기가 완료 처리되었습니다.\n수익 계산 중 오류가 발생했습니다.'
        );
      }
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm('경기를 완료 처리하시겠습니까?\n완료 후 수익금 정산이 가능합니다.')) {
        executeComplete();
        window.alert('경기가 완료 처리되었습니다.\n수익 정산 메뉴에서 정산을 진행하세요.');
      }
    } else {
      Alert.alert(
        '경기완료',
        '경기를 완료 처리하시겠습니까?\n완료 후 수익금 정산이 가능합니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '완료',
            onPress: () => {
              executeComplete();
              Alert.alert('완료', '경기가 완료 처리되었습니다.\n수익 정산 메뉴에서 정산을 진행하세요.');
            }
          }
        ]
      );
    }
  };
  */

  const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'approved': return '#3b82f6';
    case 'payment_submitted': return '#8b5cf6';
    case 'confirmed': return '#10b981';
    case 'rejected': return '#ef4444';
    default: return '#6b7280';
  }
};

  const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '승인 대기';
    case 'approved': return '승인됨';
    case 'payment_submitted': return '입금 확인 대기';
    case 'confirmed': return '참여 확정';
    case 'rejected': return '거절됨';
    default: return '알 수 없음';
  }
};

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>로그인이 필요합니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <View>
            <Text style={styles.title}>매치관리</Text>
            <Text style={styles.subtitle}>
              등록한 매치와 참여신청을 관리하세요
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.headerLoginIcon}
              onPress={() => {
                if (user) {
                  router.push('/profile');
                } else {
                  router.push('/auth/login');
                }
              }}
            >
              {user ? (
                <User size={20} color="#16a34a" />
              ) : (
                <LogIn size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

            <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'my-matches' && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('my-matches')}
          >
            <Text style={[
              styles.tabButtonText,
              selectedTab === 'my-matches' && styles.tabButtonTextActive
            ]}>
              판매매치 ({myMatches.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === 'applications' && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab('applications')}
          >
            <Text style={[
              styles.tabButtonText,
              selectedTab === 'applications' && styles.tabButtonTextActive
            ]}>
              참여매치 ({myApplications.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {selectedTab === 'my-matches' ? (
            <View>
              {myMatches.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <ClipboardList size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateTitle}>등록한 매치가 없습니다</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    새로운 매치를 등록해보세요
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push('/(tabs)/register')}
                  >
                    <Text style={styles.emptyStateButtonText}>매치 등록하기</Text>
                  </TouchableOpacity>
                </View>
) : (
                <>
                  {/* 🔥 진행 예정 매치 */}
                  {upcomingMyMatches.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginBottom: 12,
                        paddingHorizontal: 16
                      }}>
                        
                      </View>
                      
                      {upcomingMyMatches.map((match) => (
                        <View key={match.id} style={styles.matchCard}>
                          <TouchableOpacity
                            onPress={() => router.push(`/match/${match.id}`)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.matchHeader}>
                              <Text style={styles.matchTitle}>{match.title}</Text>
                              <View style={[
                                styles.statusBadge,
                                { backgroundColor: match.isClosed ? '#fee2e2' : '#dcfce7' }
                              ]}>
                                <Text style={[
                                  styles.statusBadgeText,
                                  { color: match.isClosed ? '#dc2626' : '#16a34a' }
                                ]}>
                                  {match.isClosed ? '마감' : '모집중'}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.matchInfo}>
                              <View style={styles.matchInfoRow}>
                                <Calendar size={16} color="#6b7280" />
                                <Text style={styles.matchInfoText}>
                                  {match.date} {match.time}
                                </Text>
                              </View>
                              <View style={styles.matchInfoRow}>
                                <Users size={16} color="#6b7280" />
                                <Text style={styles.matchInfoText}>
                                  {match.applications?.length || 0}명 신청 / {match.expectedParticipants.total}명 모집
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>

                          <View style={styles.matchControlSection}>
  <View style={styles.recruitmentToggle}>
    <Text style={styles.recruitmentToggleLabel}>
      {match.isClosed ? '마감됨' : '모집중'}
    </Text>
    <Switch
      value={!match.isClosed}
      onValueChange={() => handleToggleRecruitment(match)}
      trackColor={{ false: '#d1d5db', true: '#86efac' }}
      thumbColor={!match.isClosed ? '#16a34a' : '#f3f4f6'}
    />
  </View>
  
  {/* 경기완료 버튼 - 비활성화
  <TouchableOpacity
    style={[
      styles.completeButton,
      !match.isClosed && styles.completeButtonDisabled
    ]}
    onPress={() => match.isClosed && handleCompleteMatch(match)}
    activeOpacity={match.isClosed ? 0.7 : 1}
    disabled={!match.isClosed}
  >
    <CheckCircle size={18} color={match.isClosed ? "#ffffff" : "#9ca3af"} />
    <Text style={[
      styles.completeButtonText,
      !match.isClosed && styles.completeButtonTextDisabled
    ]}>
      경기완료
    </Text>
  </TouchableOpacity>
  
  {match.isCompleted && (
    <View style={styles.completedBadge}>
      <CheckCircle size={16} color="#16a34a" />
      <Text style={styles.completedBadgeText}>완료됨</Text>
    </View>
  )}
  */}
</View>

                          {match.applications && match.applications.length > 0 && (
                            <View style={styles.applicationsSection}>
                              <Text style={styles.applicationsSectionTitle}>
                                참여신청 ({match.applications.length})
                              </Text>
                              {match.applications.map((application) => (
                                <View key={application.id} style={styles.applicationItem}>
                                  <View style={styles.applicationUser}>
                                    <View style={styles.applicationUserInfo}>
                                      <Text style={styles.applicationUserName}>
                                        {application.userName}
                                      </Text>
                                      <Text style={styles.applicationUserDetails}>
  NTRP {application.userNtrp} · {application.userGender} · 신청가격: {application.appliedPrice.toLocaleString()}원
</Text>
                                    </View>
                                    <View style={[
                                      styles.applicationStatus,
                                      { backgroundColor: getStatusColor(application.status) + '20' }
                                    ]}>
                                      <Text style={[
                                        styles.applicationStatusText,
                                        { color: getStatusColor(application.status) }
                                      ]}>
                                        {getStatusText(application.status)}
                                      </Text>
                                    </View>
                                  </View>
                                  {application.status === 'pending' && (
  <View style={styles.applicationActions}>
    <TouchableOpacity
      style={styles.rejectButton}
      onPress={() => handleRejectApplication(match.id, application.id)}
      activeOpacity={0.7}
    >
      <X size={16} color="#ef4444" />
      <Text style={styles.rejectButtonText}>거절</Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.approveButton}
      onPress={() => handleApproveApplication(match.id, application.id)}
      activeOpacity={0.7}
    >
      <Check size={16} color="#ffffff" />
      <Text style={styles.approveButtonText}>승인</Text>
    </TouchableOpacity>
  </View>
)}

// ✅ 수정된 코드 - 마감되지 않은 매치만 입금확인 가능
{/* ✅ 수정된 코드 - 마감되지 않은 매치만 입금확인 가능 */}
{application.status === 'payment_submitted' && !match.isClosed && (
  <View style={styles.applicationActions}>
    <TouchableOpacity
      style={[styles.approveButton, { backgroundColor: '#10b981' }]}
      onPress={() => handleConfirmPayment(match.id, application.id)}
      activeOpacity={0.7}
    >
      <Check size={16} color="#ffffff" />
      <Text style={styles.approveButtonText}>입금 확인</Text>
    </TouchableOpacity>
  </View>
)}

{/* 🆕 마감된 매치의 입금 대기 상태 안내 */}
{application.status === 'payment_submitted' && match.isClosed && (
  <View style={{ 
    backgroundColor: '#fef3c7', 
    padding: 8, 
    borderRadius: 8,
    marginTop: 8 
  }}>
    <Text style={{ 
      fontSize: 13, 
      color: '#92400e',
      textAlign: 'center'
    }}>
      마감된 매치는 입금확인을 할 수 없습니다
    </Text>
  </View>
)}
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 🔥 지난 매치 (접기/펼치기) */}
                  {pastMyMatches.length > 0 && (
                    <View style={{ paddingHorizontal: 16 }}>
                      <TouchableOpacity
                        onPress={() => setShowPastMatches(!showPastMatches)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#f3f4f6',
                          padding: 16,
                          borderRadius: 12,
                          marginBottom: showPastMatches ? 12 : 0,
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Clock size={20} color="#6b7280" />
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '600', 
                            color: '#6b7280',
                            marginLeft: 8
                          }}>
                            지난 매치 ({pastMyMatches.length})
                          </Text>
                        </View>
                        <Text style={{ fontSize: 18, color: '#6b7280' }}>
                          {showPastMatches ? '▲' : '▼'}
                        </Text>
                      </TouchableOpacity>

                      {showPastMatches && pastMyMatches.map((match) => (
                        <View key={match.id} style={[styles.matchCard, { opacity: 0.6 }]}>
                          <TouchableOpacity
                            onPress={() => router.push(`/match/${match.id}`)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.matchHeader}>
                              <Text style={styles.matchTitle}>{match.title}</Text>
                              <View style={[styles.statusBadge, { backgroundColor: '#e5e7eb' }]}>
                                <Text style={[styles.statusBadgeText, { color: '#6b7280' }]}>
                                  종료
                                </Text>
                              </View>
                            </View>
                            <View style={styles.matchInfo}>
                              <View style={styles.matchInfoRow}>
                                <Calendar size={16} color="#6b7280" />
                                <Text style={styles.matchInfoText}>
                                  {match.date} {match.time}
                                </Text>
                              </View>
                              <View style={styles.matchInfoRow}>
                                <Users size={16} color="#6b7280" />
                                <Text style={styles.matchInfoText}>
                                  {match.applications?.length || 0}명 참여
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>

                          {match.isCompleted && (
                            <View style={styles.completedBadge}>
                              <CheckCircle size={16} color="#16a34a" />
                              <Text style={styles.completedBadgeText}>완료됨</Text>
                            </View>
                          )}

                          {!match.isCompleted && (
                            <TouchableOpacity
                              style={styles.completeButton}
                              onPress={() => handleCompleteMatch(match)}
                              activeOpacity={0.7}
                            >
                              <CheckCircle size={18} color="#ffffff" />
                              <Text style={styles.completeButtonText}>경기완료</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          ) : (
            <View>
              {myApplications.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Clock size={48} color="#9ca3af" />
                  <Text style={styles.emptyStateTitle}>신청한 매치가 없습니다</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    관심있는 매치에 참여신청해보세요
                  </Text>
                </View>
             ) : (
                <>
                  {/* 🔥 진행 예정 신청 */}
                  {upcomingMyApplications.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginBottom: 12,
                        paddingHorizontal: 16
                      }}>
                       
                      </View>
                      
                      {upcomingMyApplications.map((match) => {
                        const myApplication = match.applications?.find(app => app.userId === user.id);
                        if (!myApplication) return null;

                        const needsPayment = myApplication.status === 'approved' && myApplication.approvedAt;
                        let remainingTime = 0;
                        
                        if (needsPayment) {
                          const approvedTime = new Date(myApplication.approvedAt!).getTime();
                          const now = new Date().getTime();
                          const elapsedSeconds = Math.floor((now - approvedTime) / 1000);
                          remainingTime = Math.max(0, 300 - elapsedSeconds);
                        }

                        return (
                          <TouchableOpacity
                            key={match.id}
                            style={styles.applicationMatchCard}
                            onPress={() => router.push(`/match/${match.id}`)}
                          >
                            {needsPayment && remainingTime > 0 && (
                              <View style={styles.paymentAlertBanner}>
                                <Clock size={20} color="#dc2626" />
                                <View style={styles.paymentAlertContent}>
                                  <Text style={styles.paymentAlertTitle}>💰 입금이 필요합니다!</Text>
                                  <Text style={styles.paymentAlertText}>
                                    {Math.floor(remainingTime / 60)}분 {remainingTime % 60}초 내에 입금해주세요
                                  </Text>
                                </View>
                              </View>
                            )}

                            <View style={styles.matchHeader}>
                              <Text style={styles.matchTitle}>{match.title}</Text>
                              <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(myApplication.status) + '20' }
                              ]}>
                                <Text style={[
                                  styles.statusBadgeText,
                                  { color: getStatusColor(myApplication.status) }
                                ]}>
                                  {getStatusText(myApplication.status)}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.matchInfo}>
                              <View style={styles.matchInfoRow}>
                                <Calendar size={16} color="#6b7280" />
                                <Text style={styles.matchInfoText}>
                                  {match.date} {match.time}
                                </Text>
                              </View>
                              <View style={styles.matchInfoRow}>
                                <Users size={16} color="#6b7280" />
                                <Text style={styles.matchInfoText}>
                                  신청가격: {myApplication.appliedPrice.toLocaleString()}원
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.applicationDate}>
                              신청일: {new Date(myApplication.appliedAt).toLocaleDateString()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* 🔥 지난 신청 매치 */}
                  {pastMyApplications.length > 0 && (
                    <View style={{ paddingHorizontal: 16 }}>
                      <TouchableOpacity
                        onPress={() => setShowPastMatches(!showPastMatches)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#f3f4f6',
                          padding: 16,
                          borderRadius: 12,
                          marginBottom: showPastMatches ? 12 : 0,
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Clock size={20} color="#6b7280" />
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '600', 
                            color: '#6b7280',
                            marginLeft: 8
                          }}>
                            지난 신청 ({pastMyApplications.length})
                          </Text>
                        </View>
                        <Text style={{ fontSize: 18, color: '#6b7280' }}>
                          {showPastMatches ? '▲' : '▼'}
                        </Text>
                      </TouchableOpacity>

                      {showPastMatches && pastMyApplications.map((match) => {
                        const myApplication = match.applications?.find(app => app.userId === user.id);
                        if (!myApplication) return null;

                        return (
                          <TouchableOpacity
                            key={match.id}
                            style={[styles.applicationMatchCard, { opacity: 0.6 }]}
                            onPress={() => router.push(`/match/${match.id}`)}
                          >
                            <View style={styles.matchHeader}>
                              <Text style={styles.matchTitle}>{match.title}</Text>
                              <View style={[styles.statusBadge, { backgroundColor: '#e5e7eb' }]}>
                                <Text style={[styles.statusBadgeText, { color: '#6b7280' }]}>
                                  종료
                                </Text>
                              </View>
                            </View>

                            <View style={styles.matchInfo}>
                              <View style={styles.matchInfoRow}>
                                <Calendar size={16} color="#6b7280" />
                                <Text style={styles.matchInfoText}>
                                  {match.date} {match.time}
                                </Text>
                              </View>
                              <View style={styles.matchInfoRow}>
                                <Users size={16} color="#6b7280" />
                                <Text style={styles.matchInfoText}>
                                  신청가격: {myApplication.appliedPrice.toLocaleString()}원
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.applicationDate}>
                              신청일: {new Date(myApplication.appliedAt).toLocaleDateString()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7f4',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ea4c89',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLoginIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#ea4c89',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6e6d7a',
  },
  tabButtonTextActive: {
    color: '#ea4c89',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6e6d7a',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0d0c22',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6e6d7a',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#ea4c89',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0,
    shadowColor: '#0d0c22',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d0c22',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchInfo: {
    gap: 8,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchInfoText: {
    fontSize: 14,
    color: '#6e6d7a',
  },
  matchControlSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  recruitmentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recruitmentToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  completeButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  backgroundColor: '#ea4c89',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 10,
  flex: 1,
},
completeButtonDisabled: {
  backgroundColor: '#d1d5db',
  opacity: 0.5,
},
completeButtonText: {
  color: '#ffffff',
  fontWeight: '600',
  fontSize: 14,
},
completeButtonTextDisabled: {
  color: '#9ca3af',  // 비활성화 시 회색 텍스트
},
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  applicationsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applicationsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d0c22',
    marginBottom: 12,
  },
  applicationItem: {
    backgroundColor: '#f8f7f4',
    padding: 12,
    borderRadius:
      8,
    marginBottom: 8,
  },
  applicationUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicationUserInfo: {
    flex: 1,
  },
  applicationUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d0c22',
  },
  applicationUserDetails: {
    fontSize: 14,
    color: '#6e6d7a',
    marginTop: 2,
  },
  applicationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  applicationStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  rejectButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0d0c22',
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  applicationMatchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 20,
    padding: 20,
    borderWidth: 0,
    shadowColor: '#0d0c22',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  applicationDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  paymentAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  paymentAlertContent: {
    flex: 1,
  },
  paymentAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 2,
  },
  paymentAlertText: {
    fontSize: 13,
    color: '#dc2626',
  },
  profileButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});