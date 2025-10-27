import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Trash2,
  Ban,
  UnlockKeyhole,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react-native';
import { useSafeStyles } from '../../constants/Styles';
import { SettlementManager, MonthlySettlementWithPayments, SettlementPayment } from '../../utils/settlementManager';

// 플랫폼별 Alert 함수
const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message || title);
  } else {
    Alert.alert(title, message);
  }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: onConfirm }
    ]);
  }
};

export default function AdminSettlementsScreen() {
  const safeStyles = useSafeStyles();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [settlements, setSettlements] = useState<MonthlySettlementWithPayments[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState<MonthlySettlementWithPayments | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentsListModal, setShowPaymentsListModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    loadSettlements();
  }, [selectedYear, selectedMonth]);

  const loadSettlements = async () => {
    setIsLoading(true);
    try {
      const data = await SettlementManager.getAllSettlementsByMonth(selectedYear, selectedMonth);
      const statsData = await SettlementManager.getSettlementStats(selectedYear, selectedMonth);
      setSettlements(data);
      setStats(statsData);
    } catch (error) {
      console.error('정산 데이터 로드 실패:', error);
      showAlert('오류', '정산 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedSettlement || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      showAlert('오류', '입금액을 올바르게 입력해주세요.');
      return;
    }

    const amount = parseFloat(paymentAmount);
    const result = await SettlementManager.addPayment(
      selectedSettlement.id,
      amount,
      paymentDate,
      'bank_transfer',
      paymentNotes
    );

    if (result.success) {
      showAlert('성공', '입금 내역이 추가되었습니다.');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      loadSettlements();
    } else {
      showAlert('오류', result.error || '입금 처리에 실패했습니다.');
    }
  };

  const handleDeletePayment = (payment: SettlementPayment) => {
    showConfirm(
      '입금 내역 삭제',
      `${payment.paid_amount.toLocaleString()}원 입금 내역을 삭제하시겠습니까?`,
      async () => {
        const result = await SettlementManager.deletePayment(payment.id);
        if (result.success) {
          showAlert('성공', '입금 내역이 삭제되었습니다.');
          loadSettlements();
        } else {
          showAlert('오류', result.error || '삭제에 실패했습니다.');
        }
      }
    );
  };

  const handleSuspendAccount = (settlement: MonthlySettlementWithPayments) => {
    const action = settlement.is_account_suspended ? '해제' : '정지';
    showConfirm(
      `계정 ${action}`,
      `${settlement.seller_name} 판매자의 계정을 ${action}하시겠습니까?`,
      async () => {
        const result = await SettlementManager.suspendAccount(
          settlement.id,
          !settlement.is_account_suspended,
          settlement.is_account_suspended ? '계정 정지 해제' : '미정산으로 인한 계정 정지'
        );
        if (result.success) {
          showAlert('성공', `계정이 ${action}되었습니다.`);
          loadSettlements();
        } else {
          showAlert('오류', result.error || `계정 ${action}에 실패했습니다.`);
        }
      }
    );
  };

  const openAddPaymentModal = (settlement: MonthlySettlementWithPayments) => {
    setSelectedSettlement(settlement);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const openPaymentsListModal = (settlement: MonthlySettlementWithPayments) => {
    setSelectedSettlement(settlement);
    setShowPaymentsListModal(true);
  };

  const getStatusColor = (settlement: MonthlySettlementWithPayments) => {
    if (settlement.is_account_suspended) return '#dc2626';
    if (settlement.commission_amount === 0) return '#9ca3af';
    if (settlement.unpaid_amount === 0) return '#16a34a';
    if ((settlement.total_paid_amount || 0) > 0) return '#3b82f6';
    return '#f59e0b';
  };

  const getStatusText = (settlement: MonthlySettlementWithPayments) => {
    if (settlement.is_account_suspended) return '계정 정지';
    if (settlement.commission_amount === 0) return '정산 불필요';
    if (settlement.unpaid_amount === 0) return '정산 완료';
    if ((settlement.total_paid_amount || 0) > 0) return '부분 입금';
    return '미정산';
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <Text style={styles.title}>월별 정산 관리</Text>
          <Text style={styles.subtitle}>판매자 수수료 정산 추적</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthButton}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>

          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>
              {selectedYear}년 {selectedMonth}월
            </Text>
          </View>

          <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
            <ChevronRight size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.loadingText}>데이터 로딩 중...</Text>
          </View>
        ) : (
          <>
            {stats && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>정산 현황</Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <User size={20} color="#6b7280" />
                    <Text style={styles.statValue}>{stats.totalSellers}명</Text>
                    <Text style={styles.statLabel}>총 판매자</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                    <DollarSign size={20} color="#f59e0b" />
                    <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                      {stats.totalCommission.toLocaleString()}원
                    </Text>
                    <Text style={styles.statLabel}>총 수수료</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
                    <CheckCircle size={20} color="#3b82f6" />
                    <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                      {stats.totalPaid.toLocaleString()}원
                    </Text>
                    <Text style={styles.statLabel}>정산 완료</Text>
                  </View>

                  <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
                    <AlertCircle size={20} color="#dc2626" />
                    <Text style={[styles.statValue, { color: '#dc2626' }]}>
                      {stats.totalUnpaid.toLocaleString()}원
                    </Text>
                    <Text style={styles.statLabel}>미정산</Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>정산 완료율</Text>
                    <Text style={styles.progressValue}>
                      {stats.completedCount} / {stats.totalSellers} ({stats.completionRate.toFixed(1)}%)
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${stats.completionRate}%` }]}
                    />
                  </View>
                </View>

                {stats.suspendedCount > 0 && (
                  <View style={styles.warningBanner}>
                    <Ban size={18} color="#dc2626" />
                    <Text style={styles.warningText}>
                      {stats.suspendedCount}명의 판매자가 계정 정지 상태입니다
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.settlementsSection}>
              <Text style={styles.sectionTitle}>
                판매자별 정산 내역 ({settlements.length})
              </Text>

              {settlements.length === 0 ? (
                <View style={styles.emptyState}>
                  <Calendar size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>정산 내역이 없습니다</Text>
                  <Text style={styles.emptyText}>
                    선택한 월에 판매된 매치가 없습니다
                  </Text>
                </View>
              ) : (
                settlements.map((settlement) => (
                  <View
                    key={settlement.id}
                    style={[
                      styles.settlementCard,
                      settlement.is_account_suspended && styles.suspendedCard,
                    ]}
                  >
                    <View style={styles.settlementHeader}>
                      <View style={styles.sellerInfo}>
                        <User size={20} color="#374151" />
                        <Text style={styles.sellerName}>{settlement.seller_name}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(settlement) },
                        ]}
                      >
                        <Text style={styles.statusText}>{getStatusText(settlement)}</Text>
                      </View>
                    </View>

                    <View style={styles.settlementDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>판매 건수</Text>
                        <Text style={styles.detailValue}>{settlement.total_matches}건</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>총 판매액</Text>
                        <Text style={styles.detailValue}>
                          {settlement.total_sales.toLocaleString()}원
                        </Text>
                      </View>

                      <View style={[styles.detailRow, styles.highlightRow]}>
                        <Text style={styles.commissionLabel}>정산 수수료 (30%)</Text>
                        <Text style={styles.commissionValue}>
                          {settlement.commission_amount.toLocaleString()}원
                        </Text>
                      </View>
                    </View>

                    {settlement.commission_amount > 0 && (
                      <View style={styles.paymentSummary}>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>입금 완료</Text>
                          <Text style={[styles.paymentValue, { color: '#3b82f6' }]}>
                            {(settlement.total_paid_amount || 0).toLocaleString()}원
                          </Text>
                        </View>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>미정산 금액</Text>
                          <Text
                            style={[
                              styles.paymentValue,
                              { color: settlement.unpaid_amount > 0 ? '#dc2626' : '#16a34a' },
                            ]}
                          >
                            {settlement.unpaid_amount.toLocaleString()}원
                          </Text>
                        </View>

                        {settlement.payments && settlement.payments.length > 0 && (
                          <TouchableOpacity
                            onPress={() => openPaymentsListModal(settlement)}
                            style={styles.viewPaymentsButton}
                          >
                            <FileText size={14} color="#3b82f6" />
                            <Text style={styles.viewPaymentsText}>
                              입금내역 보기 ({settlement.payments.length}건)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {settlement.commission_amount > 0 && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => handleSuspendAccount(settlement)}
                          style={[
                            styles.actionButton,
                            settlement.is_account_suspended
                              ? styles.unsuspendButton
                              : styles.suspendButton,
                          ]}
                        >
                          {settlement.is_account_suspended ? (
                            <>
                              <UnlockKeyhole
                                size={16}
                                color="#16a34a"
                              />
                              <Text style={[styles.actionButtonText, { color: '#16a34a' }]}>
                                계정 정지 해제
                              </Text>
                            </>
                          ) : (
                            <>
                              <Ban size={16} color="#dc2626" />
                              <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
                                계정 정지
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => openAddPaymentModal(settlement)}
                          style={[styles.actionButton, styles.addPaymentButton]}
                        >
                          <Plus size={16} color="#ffffff" />
                          <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>
                            입금내역 추가
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>💡 정산 관리 안내</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoText}>
                  • 매월 판매자별 수수료(30%)가 자동으로 계산됩니다
                </Text>
                <Text style={styles.infoText}>
                  • 입금내역 추가 시 자동으로 미정산 금액이 차감됩니다
                </Text>
                <Text style={styles.infoText}>
                  • 미정산 금액이 있는 판매자는 계정 정지가 가능합니다
                </Text>
                <Text style={styles.infoText}>
                  • 계정이 정지되면 판매자는 새로운 매치 등록이 불가능합니다
                </Text>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>

      {/* 입금내역 추가 모달 */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>입금내역 추가</Text>

            {selectedSettlement && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  판매자: {selectedSettlement.seller_name}
                </Text>
                <Text style={styles.modalInfoText}>
                  미정산 금액: {selectedSettlement.unpaid_amount.toLocaleString()}원
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>입금액 *</Text>
              <TextInput
                style={styles.input}
                placeholder="입금액을 입력하세요"
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>입금일자 *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={paymentDate}
                onChangeText={setPaymentDate}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>메모 (선택)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="메모를 입력하세요"
                multiline
                numberOfLines={3}
                value={paymentNotes}
                onChangeText={setPaymentNotes}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddPayment}
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={styles.confirmButtonText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 입금내역 목록 모달 */}
      <Modal
        visible={showPaymentsListModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentsListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>입금 내역</Text>

            {selectedSettlement && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  판매자: {selectedSettlement.seller_name}
                </Text>
                <Text style={styles.modalInfoText}>
                  총 입금액: {(selectedSettlement.total_paid_amount || 0).toLocaleString()}원
                </Text>
                <Text style={styles.modalInfoText}>
                  미정산 금액: {selectedSettlement.unpaid_amount.toLocaleString()}원
                </Text>
              </View>
            )}

            <ScrollView style={styles.paymentsListScroll} showsVerticalScrollIndicator={false}>
              {selectedSettlement?.payments && selectedSettlement.payments.length > 0 ? (
                selectedSettlement.payments.map((payment) => (
                  <View key={payment.id} style={styles.paymentItem}>
                    <View style={styles.paymentItemHeader}>
                      <Text style={styles.paymentItemAmount}>
                        {payment.paid_amount.toLocaleString()}원
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeletePayment(payment)}
                        style={styles.deletePaymentButton}
                      >
                        <Trash2 size={18} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.paymentItemDate}>
                      {new Date(payment.payment_date).toLocaleDateString('ko-KR')}
                    </Text>
                    {payment.notes && (
                      <Text style={styles.paymentItemNotes}>{payment.notes}</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyPaymentsText}>입금 내역이 없습니다</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowPaymentsListModal(false)}
              style={[styles.modalButton, styles.confirmButton]}
            >
              <Text style={styles.confirmButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  monthDisplay: {
    marginHorizontal: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ec4899',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  statsSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressValue: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ec4899',
    borderRadius: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  warningText: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '600',
    flex: 1,
  },
  settlementsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
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
  settlementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suspendedCard: {
    borderWidth: 2,
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  settlementDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  highlightRow: {
    backgroundColor: '#fef3c7',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  commissionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  commissionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  paymentSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    gap: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewPaymentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  viewPaymentsText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  suspendButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  unsuspendButton: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  addPaymentButton: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  modalInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 4,
  },
  modalInfoText: {
    fontSize: 13,
    color: '#374151',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#ec4899',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  paymentsListScroll: {
    maxHeight: 300,
    marginVertical: 16,
  },
  paymentItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  deletePaymentButton: {
    padding: 4,
  },
  paymentItemDate: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentItemNotes: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  emptyPaymentsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomPadding: {
    height: 40,
  },
});