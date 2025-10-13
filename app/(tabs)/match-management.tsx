// app/(tabs)/match-management.tsx - 완전 구현 버전
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, Users, Check, X, Clock, Calendar } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { Match, MatchApplication } from '../../types/tennis';
import { useSafeStyles } from '../../constants/Styles';
import { router } from 'expo-router';

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

const handleApproveApplication = (matchId: string, applicationId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || !match.applications) return;

    const application = match.applications.find(app => app.id === applicationId);
    if (!application) return;

    // 웹 환경에서는 바로 실행, 모바일에서는 Alert 표시
   const executeApproval = () => {
  const updatedApplications = match.applications!.map(app =>
    app.id === applicationId 
      ? { 
          ...app, 
          status: 'approved' as const,
          approvedAt: new Date().toISOString() // 승인 시각 기록
        }
      : app
  );

      updateMatch({
        ...match,
        applications: updatedApplications
      });
    };

    // Platform 체크 (웹에서는 confirm 사용)
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

    // 웹 환경에서는 바로 실행, 모바일에서는 Alert 표시
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

    // Platform 체크 (웹에서는 confirm 사용)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '입금대기';
      case 'rejected': return '거절됨';
      case 'confirmed': return '입금완료';
      default: return '알수없음';
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
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>매치관리</Text>
          <Text style={styles.headerSubtitle}>
            등록한 매치와 참여신청을 관리하세요
          </Text>
        </View>

        {/* 탭 버튼 */}
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
            // 내가 등록한 매치들
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
      {/* 참여신청 목록 */}
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
            // 내가 신청한 매치들
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

  // 입금 필요 여부 확인
  const needsPayment = myApplication.status === 'approved' && myApplication.approvedAt;
  let remainingTime = 0;
  
  if (needsPayment) {
    const approvedTime = new Date(myApplication.approvedAt!).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - approvedTime) / 1000);
    remainingTime = Math.max(0, 300 - elapsedSeconds); // 5분 = 300초
  }

  return (
    <TouchableOpacity
      key={match.id}
      style={styles.applicationMatchCard}
      onPress={() => router.push(`/match/${match.id}`)}
    >
      {/* 입금 필요 알림 배너 */}
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
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#ec4899',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#ec4899',
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
    color: '#6b7280',
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
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#ec4899',
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    color: '#111827',
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
    color: '#6b7280',
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
    color: '#111827',
    marginBottom: 12,
  },
  applicationItem: {
    backgroundColor: '#f9fafb',
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
    color: '#111827',
  },
  applicationUserDetails: {
    fontSize: 14,
    color: '#6b7280',
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
    paddingVertical: 8,
    borderRadius: 8,
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
    backgroundColor: '#10b981',
    paddingVertical: 8,
    borderRadius: 8,
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  applicationDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
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