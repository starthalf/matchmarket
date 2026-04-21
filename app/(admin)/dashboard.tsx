import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, Users, Calendar, TrendingUp, CreditCard, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, User, ArrowLeft, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';
import { useMatches } from '../../contexts/MatchContext';
import { supabaseAdmin } from '../../lib/supabase';

// Mock 입금 확인 대기 데이터
const mockPendingPayments = [
  {
    id: 'pp1',
    userId: '1',
    userName: '김테니스',
    matchId: 'm1',
    matchTitle: '강남 테니스 클럽 - 초급자 매치',
    amount: 25000,
    depositorName: '김테니스',
    submittedAt: '2024-12-27T10:30:00Z',
  },
  {
    id: 'pp2',
    userId: '2',
    userName: '박라켓',
    matchId: 'm2',
    matchTitle: '서초 테니스장 - 중급자 매치',
    amount: 30000,
    depositorName: '박라켓',
    submittedAt: '2024-12-27T15:45:00Z',
  },
  {
    id: 'pp3',
    userId: '3',
    userName: '최스매시',
    matchId: 'm3',
    matchTitle: '잠실 테니스장 - 중급자 매치',
    amount: 35000,
    depositorName: '최스매시',
    submittedAt: '2024-12-27T16:20:00Z',
  },
];

export default function AdminDashboardScreen() {
  const safeStyles = useSafeStyles();
  const { matches, refreshMatches } = useMatches();
  const [pendingPayments, setPendingPayments] = React.useState(mockPendingPayments);
  const [showMatchList, setShowMatchList] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  // Mock 데이터
  const stats = {
    totalRevenue: 2450000,
    totalUsers: 1247,
    activeMatches: matches.filter(m => !m.isClosed).length,
    pendingWithdrawals: 8,
    totalWithdrawals: 1850000,
    monthlyGrowth: 15.3,
    pendingPayments: pendingPayments.length,
    totalMatches: matches.length,
  };

  const recentActivity = [
    { id: '1', type: 'withdrawal', user: '김테니스', amount: 125000, time: '10분 전' },
    { id: '2', type: 'match', user: '박라켓', action: '매치 등록', time: '25분 전' },
    { id: '3', type: 'signup', user: '이서브', action: '회원가입', time: '1시간 전' },
    { id: '4', type: 'withdrawal', user: '최스매시', amount: 89000, time: '2시간 전' },
  ];

  const handleConfirmPayment = (payment: any) => {
    Alert.alert(
      '입금 확정',
      `${payment.userName}님의 ${payment.amount.toLocaleString()}원 입금을 확정하시겠습니까?\n\n매치: ${payment.matchTitle}`,
      [
        { text: '취소', style: 'cancel' },
        { text: '확정', onPress: () => {
          setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
          Alert.alert('입금 확정 완료', `${payment.userName}님의 매치 참가가 확정되었습니다.`);
          console.log(`✅ 입금 확정: ${payment.userName}님 - ${payment.amount.toLocaleString()}원`);
        }}
      ]
    );
  };

  const handleViewAllPayments = () => {
    router.push('/(admin)/payments');
  };

  // 🆕 매치 삭제 처리
  const handleDeleteMatch = async (matchId: string, matchTitle: string) => {
    const confirmMessage = `"${matchTitle}" 매치를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
    
    const doDelete = async () => {
      setDeletingMatchId(matchId);
      try {
        // Supabase에서 삭제
        const { error } = await supabaseAdmin
          .from('matches')
          .delete()
          .eq('id', matchId);
        
        if (error) {
          console.error('매치 삭제 실패:', error);
          if (typeof window !== 'undefined') {
            window.alert('매치 삭제에 실패했습니다.');
          }
          return;
        }
        
        // 로컬 상태 새로고침
        await refreshMatches();
        
        if (typeof window !== 'undefined') {
          window.alert('매치가 삭제되었습니다.');
        }
        console.log(`🗑️ 매치 삭제 완료: ${matchTitle}`);
      } catch (error) {
        console.error('매치 삭제 중 오류:', error);
        if (typeof window !== 'undefined') {
          window.alert('매치 삭제 중 오류가 발생했습니다.');
        }
      } finally {
        setDeletingMatchId(null);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(confirmMessage)) {
        await doDelete();
      }
    } else {
      Alert.alert(
        '매치 삭제',
        confirmMessage,
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: doDelete }
        ]
      );
    }
  };

  // 🆕 전체 매치 삭제
  const handleDeleteAllMatches = async () => {
    const confirmMessage = `모든 매치(${matches.length}개)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`;
    
    const doDeleteAll = async () => {
      setDeletingMatchId('all');
      try {
        const { error } = await supabaseAdmin
          .from('matches')
          .delete()
          .neq('id', '0');
        
        if (error) {
          console.error('전체 매치 삭제 실패:', error);
          if (typeof window !== 'undefined') {
            window.alert('전체 매치 삭제에 실패했습니다.');
          }
          return;
        }
        
        await refreshMatches();
        
        if (typeof window !== 'undefined') {
          window.alert('모든 매치가 삭제되었습니다.');
        }
      } catch (error) {
        console.error('전체 매치 삭제 중 오류:', error);
      } finally {
        setDeletingMatchId(null);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(confirmMessage)) {
        await doDeleteAll();
      }
    } else {
      Alert.alert(
        '⚠️ 전체 매치 삭제',
        confirmMessage,
        [
          { text: '취소', style: 'cancel' },
          { text: '전체 삭제', style: 'destructive', onPress: doDeleteAll }
        ]
      );
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'withdrawal': return <CreditCard size={16} color="#dc2626" />;
      case 'match': return <Calendar size={16} color="#16a34a" />;
      case 'signup': return <Users size={16} color="#3b82f6" />;
      default: return <AlertTriangle size={16} color="#f59e0b" />;
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
            >
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>관리자 대시보드</Text>
              <Text style={styles.subtitle}>MatchMarket 운영 현황</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 주요 지표 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>주요 지표</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <DollarSign size={24} color="#16a34a" />
              <Text style={styles.statNumber}>{stats.totalRevenue.toLocaleString()}원</Text>
              <Text style={styles.statLabel}>총 수익</Text>
            </View>
            
            <View style={styles.statCard}>
              <Users size={24} color="#3b82f6" />
              <Text style={styles.statNumber}>{stats.totalUsers.toLocaleString()}명</Text>
              <Text style={styles.statLabel}>총 사용자</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Calendar size={24} color="#ec4899" />
              <Text style={styles.statNumber}>{stats.activeMatches}개</Text>
              <Text style={styles.statLabel}>활성 매치</Text>
            </View>
            
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#f59e0b" />
              <Text style={styles.statNumber}>+{stats.monthlyGrowth}%</Text>
              <Text style={styles.statLabel}>월간 성장률</Text>
            </View>
            
            <View style={styles.statCard}>
              <AlertTriangle size={24} color="#ec4899" />
              <Text style={styles.statNumber}>{stats.pendingPayments}건</Text>
              <Text style={styles.statLabel}>입금확인대기</Text>
            </View>
          </View>
        </View>

        {/* 🆕 매치 관리 섹션 */}
        <View style={styles.matchManageSection}>
          <TouchableOpacity 
            style={styles.matchManageHeader}
            onPress={() => setShowMatchList(!showMatchList)}
            activeOpacity={0.7}
          >
            <View style={styles.matchManageHeaderLeft}>
              <Calendar size={20} color="#dc2626" />
              <Text style={styles.sectionTitle}>매치 관리 ({matches.length})</Text>
            </View>
            {showMatchList ? (
              <ChevronUp size={20} color="#6b7280" />
            ) : (
              <ChevronDown size={20} color="#6b7280" />
            )}
          </TouchableOpacity>

          {showMatchList && (
            <View style={styles.matchListContainer}>
              {/* 전체 삭제 버튼 */}
              {matches.length > 0 && (
                <TouchableOpacity 
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAllMatches}
                  disabled={deletingMatchId === 'all'}
                >
                  <Trash2 size={16} color="#dc2626" />
                  <Text style={styles.deleteAllButtonText}>
                    {deletingMatchId === 'all' ? '삭제 중...' : `전체 삭제 (${matches.length}개)`}
                  </Text>
                </TouchableOpacity>
              )}

              {matches.length === 0 ? (
                <Text style={styles.emptyMatchText}>등록된 매치가 없습니다</Text>
              ) : (
                matches.map((match) => (
                  <View key={match.id} style={styles.matchItem}>
                    <TouchableOpacity 
                      style={styles.matchItemContent}
                      onPress={() => router.push(`/match/${match.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.matchItemHeader}>
                        <Text style={styles.matchItemTitle} numberOfLines={1}>
                          {match.title}
                        </Text>
                        <View style={[
                          styles.matchStatusBadge,
                          { backgroundColor: match.isClosed ? '#fee2e2' : '#dcfce7' }
                        ]}>
                          <Text style={[
                            styles.matchStatusText,
                            { color: match.isClosed ? '#dc2626' : '#16a34a' }
                          ]}>
                            {match.isClosed ? '마감' : '모집중'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.matchItemMeta}>
                        {match.date} {match.time} · {match.seller?.name || '알 수 없음'} · {match.basePrice.toLocaleString()}원
                      </Text>
                      <Text style={styles.matchItemId} numberOfLines={1}>
                        ID: {match.id}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteMatch(match.id, match.title)}
                      disabled={deletingMatchId === match.id}
                    >
                      {deletingMatchId === match.id ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <Trash2 size={18} color="#dc2626" />
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* 입금 확인 대기 요약 */}
        {pendingPayments.length > 0 && (
          <View style={styles.pendingPaymentsSummary}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ 입금 확인 필요</Text>
              <TouchableOpacity onPress={handleViewAllPayments}>
                <Text style={styles.viewAllText}>처리하기</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                <AlertTriangle size={24} color="#dc2626" />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>
                    {pendingPayments.length}건의 입금 확인 대기
                  </Text>
                  <Text style={styles.summarySubtitle}>
                    총 {pendingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}원
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={handleViewAllPayments}
              >
                <Text style={styles.quickActionText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 출금 현황 */}
        <View style={styles.withdrawalSection}>
          <Text style={styles.sectionTitle}>출금 현황</Text>
          
          <View style={styles.withdrawalCard}>
            <View style={styles.withdrawalRow}>
              <View style={styles.withdrawalItem}>
                <Text style={styles.withdrawalNumber}>{stats.pendingWithdrawals}</Text>
                <Text style={styles.withdrawalLabel}>대기중</Text>
              </View>
              <View style={styles.withdrawalItem}>
                <Text style={styles.withdrawalNumber}>{stats.totalWithdrawals.toLocaleString()}원</Text>
                <Text style={styles.withdrawalLabel}>총 출금액</Text>
              </View>
            </View>
            
            <View style={styles.urgentNotice}>
              <AlertTriangle size={16} color="#dc2626" />
              <Text style={styles.urgentText}>
                {stats.pendingWithdrawals}건의 출금 신청이 처리 대기중입니다
              </Text>
            </View>
          </View>
        </View>

        {/* 최근 활동 */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>최근 활동</Text>
          
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  {getActivityIcon(activity.type)}
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityUser}>{activity.user}</Text>
                  <Text style={styles.activityAction}>
                    {activity.type === 'withdrawal' 
                      ? `${activity.amount?.toLocaleString()}원 출금 신청`
                      : activity.action
                    }
                  </Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 시스템 상태 */}
        <View style={styles.systemSection}>
          <Text style={styles.sectionTitle}>시스템 상태</Text>
          
          <View style={styles.systemCard}>
            <View style={styles.systemItem}>
              <View style={[styles.statusDot, styles.statusGreen]} />
              <Text style={styles.systemText}>서버 상태: 정상</Text>
            </View>
            <View style={styles.systemItem}>
              <View style={[styles.statusDot, styles.statusGreen]} />
              <Text style={styles.systemText}>결제 시스템: 정상</Text>
            </View>
            <View style={styles.systemItem}>
              <View style={[styles.statusDot, styles.statusYellow]} />
              <Text style={styles.systemText}>알림 서비스: 지연</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  // 🆕 매치 관리 스타일
  matchManageSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  matchManageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  matchManageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 12,
  },
  deleteAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  emptyMatchText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  matchItemContent: {
    flex: 1,
    padding: 12,
  },
  matchItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  matchStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  matchItemMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  matchItemId: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  // 기존 스타일
  pendingPaymentsSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  quickActionButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  withdrawalSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  withdrawalCard: {
    backgroundColor: '#ffffff',
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
  withdrawalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  withdrawalItem: {
    alignItems: 'center',
  },
  withdrawalNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 4,
  },
  withdrawalLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  urgentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  urgentText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
    flex: 1,
  },
  activitySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activityAction: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  systemSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  systemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  systemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusGreen: {
    backgroundColor: '#16a34a',
  },
  statusYellow: {
    backgroundColor: '#f59e0b',
  },
  systemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});