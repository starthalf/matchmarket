import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CreditCard, Calendar, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import { AdminSettingsManager } from '../utils/adminSettings';
import { useSafeStyles } from '../constants/Styles';

interface WithdrawalHistory {
  id: string;
  amount: number;
  requestedAt: string;
  processedAt?: string;
  status: 'pending' | 'completed' | 'failed';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

const mockWithdrawalHistory: WithdrawalHistory[] = [];

export default function WithdrawalHistoryScreen() {
  const safeStyles = useSafeStyles();
  const totalWithdrawn = mockWithdrawalHistory
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingAmount = mockWithdrawalHistory
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#16a34a" />;
      case 'pending':
        return <Clock size={16} color="#f59e0b" />;
      case 'failed':
        return <AlertCircle size={16} color="#dc2626" />;
      default:
        return <Clock size={16} color="#6b7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '출금완료';
      case 'pending': return '처리중';
      case 'failed': return '출금실패';
      default: return '알 수 없음';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'pending': return '#f59e0b';
      case 'failed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    const start = accountNumber.slice(0, 3);
    const end = accountNumber.slice(-3);
    const middle = '*'.repeat(accountNumber.length - 6);
    return `${start}${middle}${end}`;
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
          <Text style={safeStyles.headerTitle}>출금 내역</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 출금 요약 */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>출금 현황</Text>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <CreditCard size={24} color="#16a34a" />
              <Text style={styles.summaryAmount}>{totalWithdrawn.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>총 출금액</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Clock size={24} color="#f59e0b" />
              <Text style={styles.summaryAmount}>{pendingAmount.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>처리중</Text>
            </View>
          </View>
        </View>

        {/* 출금 내역 */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>출금 내역</Text>
          
          {mockWithdrawalHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <CreditCard size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>출금 내역이 없습니다</Text>
              <Text style={styles.emptyText}>
                첫 출금을 신청해보세요
              </Text>
            </View>
          ) : (
            mockWithdrawalHistory.map((withdrawal) => (
              <View key={withdrawal.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.amountSection}>
                    <Text style={styles.withdrawalAmount}>
                      {withdrawal.amount.toLocaleString()}원
                    </Text>
                    <View style={styles.statusRow}>
                      {getStatusIcon(withdrawal.status)}
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(withdrawal.status) }
                      ]}>
                        {getStatusText(withdrawal.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.historyDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.detailText}>
                      신청일: {formatDate(withdrawal.requestedAt)}
                    </Text>
                  </View>
                  
                  {withdrawal.processedAt && (
                    <View style={styles.detailRow}>
                      <CheckCircle size={14} color="#6b7280" />
                      <Text style={styles.detailText}>
                        완료일: {formatDate(withdrawal.processedAt)}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountText}>
                      {withdrawal.bankName} {maskAccountNumber(withdrawal.accountNumber)}
                    </Text>
                    <Text style={styles.accountHolder}>
                      {withdrawal.accountHolder}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 출금 안내 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 출금 안내</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              • 출금은 14일에 1번만 가능합니다
            </Text>
            <Text style={styles.infoText}>
              • 영업일 기준 1-2일 내에 입금됩니다
            </Text>
            <Text style={styles.infoText}>
              • 출금 수수료는 없습니다
            </Text>
            <Text style={styles.infoText}>
              • 계좌 변경은 고객센터를 통해 가능합니다
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
  historySection: {
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
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  historyCard: {
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
  },
  historyHeader: {
    marginBottom: 12,
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  withdrawalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyDetails: {
    gap: 8,
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
  accountInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  accountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  accountHolder: {
    fontSize: 12,
    color: '#6b7280',
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