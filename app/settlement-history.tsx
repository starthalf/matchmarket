import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Receipt,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSafeStyles } from '../constants/Styles';
import { EarningsManager, MonthlySettlement } from '../utils/earningsManager';

export default function SettlementHistoryScreen() {
  const { user: currentUser } = useAuth();
  const safeStyles = useSafeStyles();
  const [settlements, setSettlements] = useState<MonthlySettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPayments, setExpandedPayments] = useState<{[key: string]: boolean}>({});
  const [paymentHistories, setPaymentHistories] = useState<{[key: string]: any[]}>({});

  useEffect(() => {
    if (currentUser) {
      loadAllSettlements();
    }
  }, [currentUser]);

  const loadAllSettlements = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const data = await EarningsManager.getAllSettlementsBySeller(currentUser.id, {
        statusFilter: 'all'
      });
      setSettlements(data);
    } catch (error) {
      console.error('정산 내역 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePaymentHistory = async (settlementId: string) => {
    setExpandedPayments(prev => ({
      ...prev,
      [settlementId]: !prev[settlementId]
    }));

    if (!paymentHistories[settlementId]) {
      try {
        const payments = await EarningsManager.getPaymentsBySettlementId(settlementId);
        setPaymentHistories(prev => ({
          ...prev,
          [settlementId]: payments
        }));
      } catch (error) {
        console.error('입금 내역 조회 실패:', error);
      }
    }
  };

  const getStatusIcon = (status: string, isBlocked: boolean) => {
    if (isBlocked) return <AlertCircle size={20} color="#dc2626" />;

    switch (status) {
      case 'confirmed':
        return <CheckCircle size={20} color="#16a34a" />;
      case 'paid':
        return <Clock size={20} color="#3b82f6" />;
      case 'pending':
      default:
        return <AlertCircle size={20} color="#f59e0b" />;
    }
  };

  const getStatusText = (status: string, isBlocked: boolean) => {
    if (isBlocked) return '계정 제한';

    switch (status) {
      case 'confirmed':
        return '정산 완료';
      case 'paid':
        return '관리자 확인 대기';
      case 'pending':
      default:
        return '입금 대기';
    }
  };

  const getStatusColor = (status: string, isBlocked: boolean) => {
    if (isBlocked) return '#dc2626';

    switch (status) {
      case 'confirmed':
        return '#16a34a';
      case 'paid':
        return '#3b82f6';
      case 'pending':
      default:
        return '#f59e0b';
    }
  };

  const getCardBackgroundColor = (status: string, isBlocked: boolean) => {
    if (isBlocked) return '#fef2f2';

    switch (status) {
      case 'confirmed':
        return '#f0fdf4';
      case 'paid':
        return '#eff6ff';
      case 'pending':
      default:
        return '#fffbeb';
    }
  };

  const getCardBorderColor = (status: string, isBlocked: boolean) => {
    if (isBlocked) return '#fca5a5';

    switch (status) {
      case 'confirmed':
        return '#86efac';
      case 'paid':
        return '#93c5fd';
      case 'pending':
      default:
        return '#fcd34d';
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={safeStyles.headerTitle}>정산 내역</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.loadingText}>로딩 중...</Text>
          </View>
        ) : settlements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>정산 내역이 없습니다</Text>
            <Text style={styles.emptySubtext}>매치 완료 후 자동으로 정산됩니다</Text>
          </View>
        ) : (
          <View style={styles.settlementsContainer}>
            {settlements.map((settlement) => (
              <View
                key={settlement.id}
                style={[
                  styles.settlementCard,
                  {
                    backgroundColor: getCardBackgroundColor(settlement.payment_status, settlement.is_blocked),
                    borderColor: getCardBorderColor(settlement.payment_status, settlement.is_blocked),
                  }
                ]}
              >
                <View style={styles.settlementHeader}>
                  <View style={styles.settlementHeaderLeft}>
                    <Text style={styles.settlementMonth}>
                      {settlement.year}년 {settlement.month}월
                    </Text>
                    <View style={styles.statusBadgeContainer}>
                      {getStatusIcon(settlement.payment_status, settlement.is_blocked)}
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusColor(settlement.payment_status, settlement.is_blocked) }
                        ]}
                      >
                        {getStatusText(settlement.payment_status, settlement.is_blocked)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.settlementDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrapper}>
                      <DollarSign size={16} color="#6b7280" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>매치 판매 건수</Text>
                      <Text style={styles.detailValue}>{settlement.match_count}건</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrapper}>
                      <TrendingUp size={16} color="#9333ea" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>추가 수익</Text>
                      <Text style={[styles.detailValue, { color: '#9333ea' }]}>
                        {settlement.additional_revenue.toLocaleString()}원
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrapper}>
                      <AlertCircle size={16} color="#f97316" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>납부할 수수료 (15%)</Text>
                      <Text style={[styles.detailValue, { color: '#f97316' }]}>
                        {settlement.commission_due.toLocaleString()}원
                      </Text>
                    </View>
                  </View>

                  {settlement.payment_status !== 'pending' && (
                    <View style={styles.paidAmountRow}>
                      <View style={styles.detailIconWrapper}>
                        <CheckCircle size={16} color="#16a34a" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>입금된 금액</Text>
                        <Text style={[styles.detailValue, { color: '#16a34a' }]}>
                          {(settlement.total_paid_amount || 0).toLocaleString()}원
                        </Text>
                      </View>
                    </View>
                  )}

                  {settlement.payment_status !== 'confirmed' && (
                    <View style={styles.unpaidAmountRow}>
                      <Text style={styles.unpaidLabel}>미정산 금액</Text>
                      <Text style={styles.unpaidAmount}>
                        {(settlement.unpaid_amount || settlement.commission_due).toLocaleString()}원
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => togglePaymentHistory(settlement.id)}
                  style={styles.paymentHistoryButton}
                >
                  <Receipt size={18} color="#374151" />
                  <Text style={styles.paymentHistoryButtonText}>입금 내역 보기</Text>
                  {expandedPayments[settlement.id] ? (
                    <ChevronUp size={18} color="#374151" />
                  ) : (
                    <ChevronDown size={18} color="#374151" />
                  )}
                </TouchableOpacity>

                {expandedPayments[settlement.id] && (
                  <View style={styles.paymentHistoryList}>
                    {paymentHistories[settlement.id]?.length > 0 ? (
                      paymentHistories[settlement.id].map((payment: any) => (
                        <View key={payment.id} style={styles.paymentHistoryItem}>
                          <View style={styles.paymentHistoryHeader}>
                            <Text style={styles.paymentDate}>
                              {new Date(payment.payment_date).toLocaleDateString('ko-KR')}
                            </Text>
                            <Text style={styles.paymentAmount}>
                              {Number(payment.paid_amount).toLocaleString()}원
                            </Text>
                          </View>
                          <Text style={styles.paymentMethod}>
                            결제수단: {payment.payment_method}
                          </Text>
                          {payment.notes && (
                            <Text style={styles.paymentNotes}>메모: {payment.notes}</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyPaymentHistory}>
                        <Text style={styles.emptyPaymentText}>입금 내역이 없습니다</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  settlementsContainer: {
    padding: 16,
    gap: 12,
  },
  settlementCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settlementHeaderLeft: {
    flex: 1,
  },
  settlementMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  settlementDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  paidAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  unpaidAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  unpaidLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  unpaidAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  paymentHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  paymentHistoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  paymentHistoryList: {
    marginTop: 12,
    gap: 8,
  },
  paymentHistoryItem: {
    backgroundColor: 'rgba(240, 253, 244, 0.8)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  paymentHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paymentDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803d',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#16a34a',
    marginBottom: 2,
  },
  paymentNotes: {
    fontSize: 12,
    color: '#059669',
    fontStyle: 'italic',
  },
  emptyPaymentHistory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyPaymentText: {
    fontSize: 13,
    color: '#6b7280',
  },
  bottomPadding: {
    height: 40,
  },
});
