import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert as AlertTriangle, User, Calendar, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';
import { WaitlistManager } from '../../utils/waitlistManager';
import { mockMatches } from '../../data/mockData';
import { useMatches } from '../../contexts/MatchContext';
import { useSafeStyles } from '../../constants/Styles';

interface PendingPayment {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  matchTitle: string;
  amount: number;
  depositorName: string;
  submittedAt: string;
}

const mockPendingPayments: PendingPayment[] = [
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
  {
    id: 'pp4',
    userId: '4',
    userName: '이서브',
    matchId: 'm4',
    matchTitle: '홍대 테니스장 - 복식 매치',
    amount: 28000,
    depositorName: '이서브',
    submittedAt: '2024-12-27T17:10:00Z',
  },
  {
    id: 'pp5',
    userId: '5',
    userName: '정볼리',
    matchId: 'm5',
    matchTitle: '신촌 테니스장 - 단식 매치',
    amount: 32000,
    depositorName: '정볼리',
    submittedAt: '2024-12-27T18:30:00Z',
  },
];

export default function AdminPaymentsScreen() {
  const safeStyles = useSafeStyles();
  const [pendingPayments, setPendingPayments] = useState(mockPendingPayments);
  const { refreshMatches } = useMatches();

  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleConfirmPayment = async (payment: PendingPayment) => {
    try {
      // 해당 매치 찾기
      const match = mockMatches.find(m => m.id === payment.matchId);
      if (!match) {
        Alert.alert('오류', '매치 정보를 찾을 수 없습니다.');
        return;
      }

      // 관리자 입금 확정 처리
      const result = await WaitlistManager.handleAdminPaymentConfirmation(payment.id, match);
      
      if (result.success) {
        // 입금 확인 목록에서 제거
        setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
        
        Alert.alert(
          '입금 확정 완료',
          `${payment.userName}님의 입금이 확정되어 매치 참가가 완료되었습니다.`
        );
        
        // 사용자에게 푸시 알림 발송 시뮬레이션
        console.log(`📱 참가 확정 알림 발송 to ${payment.userName}: 매치 참가가 확정되었습니다!`);
        
        // MatchContext의 매치 데이터를 새로고침하여 사용자 UI 업데이트
        await refreshMatches();
      } else {
        Alert.alert('처리 실패', result.error || '입금 확정 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('입금 확정 처리 중 오류:', error);
      Alert.alert('오류', '시스템 오류가 발생했습니다.');
    }
  };

  const handleCancelPayment = (payment: PendingPayment) => {
    Alert.alert(
      '입금 신고 취소',
      `${payment.userName}님의 입금 신고를 취소하시겠습니까?\n\n매치: ${payment.matchTitle}\n금액: ${payment.amount.toLocaleString()}원\n\n취소 시 사용자는 대기자 목록에서 제거됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '신고 취소', style: 'destructive', onPress: async () => {
          try {
            // 해당 매치 찾기
            const match = mockMatches.find(m => m.id === payment.matchId);
            if (!match) {
              Alert.alert('오류', '매치 정보를 찾을 수 없습니다.');
              return;
            }

            // 대기자 목록에서 제거
            const waiterIndex = match.waitingList.findIndex(w => w.userId === payment.userId);
            if (waiterIndex > -1) {
              match.waitingList.splice(waiterIndex, 1);
              match.waitingApplicants = Math.max(0, match.waitingApplicants - 1);
            }

            // 입금 확인 목록에서 제거
            setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
            
            Alert.alert(
              '입금 신고 취소 완료',
              `${payment.userName}님의 입금 신고가 취소되었습니다.`
            );
            
            // 사용자에게 취소 알림 발송
            console.log(`📱 입금 신고 취소 알림 발송 to ${payment.userName}: 입금 신고가 취소되었습니다.`);
            
            // MatchContext의 매치 데이터를 새로고침하여 사용자 UI 업데이트
            await refreshMatches();
          } catch (error) {
            console.error('입금 신고 취소 중 오류:', error);
            Alert.alert('오류', '시스템 오류가 발생했습니다.');
          }
        }}
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <Text style={styles.title}>입금 확인</Text>
          <Text style={styles.subtitle}>사용자 입금 신고 확인 및 처리</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 입금 확인 현황 요약 */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>입금 확인 현황</Text>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <AlertTriangle size={24} color="#dc2626" />
              <Text style={styles.summaryAmount}>{pendingPayments.length}건</Text>
              <Text style={styles.summaryLabel}>확인 대기</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Clock size={24} color="#f59e0b" />
              <Text style={styles.summaryAmount}>{totalPendingAmount.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>대기 금액</Text>
            </View>
          </View>
        </View>

        {/* 입금 확인 대기 목록 */}
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>
            입금 확인 대기 ({pendingPayments.length})
          </Text>
          
          {pendingPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color="#16a34a" />
              <Text style={styles.emptyTitle}>모든 입금이 확인되었습니다</Text>
              <Text style={styles.emptyText}>새로운 입금 신고가 있으면 여기에 표시됩니다</Text>
            </View>
          ) : (
            pendingPayments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.userInfo}>
                    <User size={20} color="#ec4899" />
                    <Text style={styles.userName}>{payment.userName}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Clock size={14} color="#f59e0b" />
                    <Text style={styles.statusText}>확인대기</Text>
                  </View>
                </View>
                
                <View style={styles.paymentDetails}>
                  <Text style={styles.matchTitle} numberOfLines={2}>
                    {payment.matchTitle}
                  </Text>
                  
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>입금 금액</Text>
                    <Text style={styles.amountValue}>
                      {payment.amount.toLocaleString()}원
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.detailText}>
                      신고일: {formatDate(payment.submittedAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.depositorInfo}>
                    <Text style={styles.depositorLabel}>입금자명</Text>
                    <Text style={styles.depositorName}>{payment.depositorName}</Text>
                  </View>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => handleCancelPayment(payment)}
                  >
                    <Text style={styles.cancelButtonText}>신고 취소</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => handleConfirmPayment(payment)}
                  >
                    <CheckCircle size={16} color="#ffffff" />
                    <Text style={styles.confirmButtonText}>입금 확정</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 처리 안내 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 입금 확인 안내</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              • 사용자가 입금 후 "입금 완료 신고"를 하면 이 목록에 표시됩니다
            </Text>
            <Text style={styles.infoText}>
              • 실제 입금 내역을 확인한 후 "입금 확정" 버튼을 클릭하세요
            </Text>
            <Text style={styles.infoText}>
              • 입금 확정 시 사용자에게 자동으로 참가 확정 알림이 발송됩니다
            </Text>
            <Text style={styles.infoText}>
              • 입금이 확인되지 않는 경우 고객센터를 통해 문의하세요
            </Text>
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
  summarySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
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
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  paymentsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#ec4899',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  paymentDetails: {
    gap: 8,
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
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
  depositorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
  },
  depositorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  depositorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoContent: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});