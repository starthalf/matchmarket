// app/(tabs)/match-management.tsx - 완전 구현 버전
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, Users, Check, X, Clock, Calendar, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { Match, MatchApplication } from '../../types/tennis';
import { useSafeStyles } from '../../constants/Styles';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MatchManagementScreen() {
  const { user } = useAuth();
  const { matches, updateMatch } = useMatches();
  const safeStyles = useSafeStyles();
  const [selectedTab, setSelectedTab] = useState<'my-matches' | 'applications'>('my-matches');

  // 내가 등록한 매치들
  const myMatches = matches.filter(match => match.sellerId === user?.id);
  
  // 내가 신청한 매치들
  const myApplications = matches.filter(match => 
    match.applications?.some(app => app.userId === user?.id)
  );

  // 페이지 진입 시 알림 제거
  useEffect(() => {
    AsyncStorage.removeItem('hasNewMatchApplication');
  }, []);

  // 매치 시간이 지났는지 체크하여 자동 마감
  useEffect(() => {
    const checkAndCloseExpiredMatches = () => {
      const now = new Date();
      
      myMatches.forEach(match => {
        if (!match.isClosed) {
          // 매치 날짜와 시간을 파싱
          const matchDateTime = new Date(`${match.date} ${match.time}`);
          
          // 현재 시간이 매치 시간을 넘었으면 자동 마감
          if (now > matchDateTime) {
            updateMatch({
              ...match,
              isClosed: true
            });
          }
        }
      });
    };

    // 컴포넌트 마운트 시 체크
    checkAndCloseExpiredMatches();

    // 1분마다 체크
    const interval = setInterval(checkAndCloseExpiredMatches, 60000);

    return () => clearInterval(interval);
  }, [myMatches]);

  const handleApproveApplication = (matchId: string, applicationId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || !match.applications) return;

    const application = match.applications.find(app => app.id === applicationId);
    if (!application) return;

    const executeApproval = () => {
      const updatedApplications = match.applications!.map(app =>
        app.id === applicationId 
          ? { 
              ...app, 
              status: 'approved' as const,
              approvedAt: new Date().toISOString()
            }
          : app
      );

      updateMatch({
        ...match,
        applications: updatedApplications
      });
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

    const executeRejection = () => {
      const updatedApplications = match.applications!.map(app =>
        app.id === applicationId 
          ? { ...app, status: 'rejected' as const }
          : app
      );

      updateMatch({
        ...match,
        applications: updatedApplications
      });
    };

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`${application.userName}님의 참여신청을 거절하시겠습니까?`)) {
        executeRejection();
        window.alert('참여신청이 거절되었습니다.');
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
            onPress: () => {
              executeRejection();
              Alert.alert('거절 완료', '참여신청이 거절되었습니다.');
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

  // 경기완료 처리
  const handleCompleteMatch = (match: Match) => {
    const executeComplete = () => {
      updateMatch({
        ...match,
        isCompleted: true,
        completedAt: new Date().toISOString()
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#3b82f6';
      case 'rejected': return '#ef4444';
      case 'confirmed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '입금대기';
      case 'rejected': return '거절됨';
      case 'confirmed': return '입금완료';
      default: return status;
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>매치관리</Text>
          <Text style={styles.headerSubtitle}>
            등록한 매치와 참여신청을 관리하세요
          </Text>
        </View>

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
                myMatches.map((match) => (
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

                    {/* 모집중/마감 토글 & 경기완료 버튼 */}
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
                      
                      {match.isClosed && !match.isCompleted && (
                        <TouchableOpacity
                          style={styles.completeButton}
                          onPress={() => handleCompleteMatch(match)}
                          activeOpacity={0.7}
                        >
                          <CheckCircle size={18} color="#ffffff" />
                          <Text style={styles.completeButtonText}>경기완료</Text>
                        </TouchableOpacity>
                      )}

                      {match.isCompleted && (
                        <View style={styles.completedBadge}>
                          <CheckCircle size={16} color="#16a34a" />
                          <Text style={styles.completedBadgeText}>완료됨</Text>
                        </View>
                      )}
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
                                  NTRP {application.userNtrp} · {application.userGender}
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
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
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
                myApplications.map((match) => {
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
                })
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
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0d0c22',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6e6d7a',
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
});
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
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
  },
  completeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
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
    borderRadius: 8,
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