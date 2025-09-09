import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, Users, Calendar, TrendingUp, CreditCard, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';

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
  const [pendingPayments, setPendingPayments] = React.useState(mockPendingPayments);

  // Mock 데이터
  const stats = {
    totalRevenue: 2450000,
    totalUsers: 1247,
    activeMatches: 23,
    pendingWithdrawals: 8,
    totalWithdrawals: 1850000,
    monthlyGrowth: 15.3,
    pendingPayments: pendingPayments.length,
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
          // 입금 확정 처리
          setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
          Alert.alert('입금 확정 완료', `${payment.userName}님의 매치 참가가 확정되었습니다.`);
          
          // 실제로는 여기서 서버 API 호출하여 참가자 상태 업데이트
          console.log(`✅ 입금 확정: ${payment.userName}님 - ${payment.amount.toLocaleString()}원`);
        }}
      ]
    );
  };

  const handleViewAllPayments = () => {
    router.push('/(admin)/payments');
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
          <Text style={styles.title}>관리자 대시보드</Text>
          <Text style={styles.subtitle}>MatchMarket 운영 현황</Text>
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

        {/* 입금 확인 대기 섹션 */}
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