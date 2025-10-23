import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Eye, Users, CreditCard, Building, Clock, AlertCircle, CheckCircle } from 'lucide-react-native';
import { getCurrentUser } from '../data/mockData';
import { AdminSettingsManager } from '../utils/adminSettings';
import { getMockEarnings, EarningsData } from '../data/mockData';
import { useSafeStyles } from '../constants/Styles';
import { EarningsManager, MonthlySettlement } from '../utils/earningsManager';

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

export default function EarningsScreen() {
  const currentUser = getCurrentUser();
  const safeStyles = useSafeStyles();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  
  // 모의 데이터 - 실제로는 서버에서 가져와야 함
  const [hasRegisteredAccount, setHasRegisteredAccount] = useState(false);
  const [lastWithdrawalDate, setLastWithdrawalDate] = useState<string | null>('2024-12-10');
  const [registeredAccount, setRegisteredAccount] = useState({
    bankName: '국민은행',
    accountNumber: '123-456-789012',
    accountHolder: '이서브',
  });
  const [earnings, setEarnings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 월별 정산 데이터
  const [currentMonthSettlement, setCurrentMonthSettlement] = useState<MonthlySettlement | null>(null);
  const [unpaidSettlements, setUnpaidSettlements] = useState<MonthlySettlement[]>([]);

  // Supabase에서 수익 데이터 로드
  useEffect(() => {
    loadEarnings();
    loadMonthlySettlements();
  }, [currentUser]);

  const loadEarnings = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const data = await EarningsManager.getEarningsBySeller(currentUser.id);
      setEarnings(data);
    } catch (error) {
      console.error('수익 데이터 로드 실패:', error);
      // 에러 시 mock 데이터 사용
      setEarnings(getMockEarnings());
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlySettlements = async () => {
    if (!currentUser) return;
    
    try {
      const current = await EarningsManager.getCurrentMonthSettlement(currentUser.id);
      const unpaid = await EarningsManager.getUnpaidSettlements(currentUser.id);
      
      setCurrentMonthSettlement(current);
      setUnpaidSettlements(unpaid);
    } catch (error) {
      console.error('월별 정산 데이터 로드 실패:', error);
    }
  };

  const totalEarnings = earnings.reduce((sum, earning) => sum + Number(earning.total_revenue || 0), 0);
  const totalMatchBaseCost = earnings.reduce((sum, earning) => sum + Number(earning.match_base_cost || 0), 0);
  const totalMatchAdditionalRevenue = earnings.reduce((sum, earning) => sum + Number(earning.match_additional_revenue || 0), 0);
  const totalAdRevenue = earnings.reduce((sum, earning) => sum + Number(earning.ad_share || 0), 0);
  
  const totalWithdrawn = mockWithdrawalHistory
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + w.amount, 0);
  const availableForWithdrawal = totalEarnings - totalWithdrawn;

  // 출금 가능 여부 확인 (2주일 = 14일)
  const canWithdraw = async () => {
    if (!lastWithdrawalDate) return true;
    const withdrawalPeriod = await AdminSettingsManager.getWithdrawalPeriod();
    const lastDate = new Date(lastWithdrawalDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= withdrawalPeriod;
  };

  const getDaysUntilNextWithdrawal = async () => {
    if (!lastWithdrawalDate) return 0;
    const withdrawalPeriod = await AdminSettingsManager.getWithdrawalPeriod();
    const lastDate = new Date(lastWithdrawalDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, withdrawalPeriod - daysDiff);
  };

  const handleWithdrawalHistoryPress = () => {
    router.push('/withdrawal-history');
  };

  const handleWithdrawal = async () => {
    const canWithdrawResult = await canWithdraw();
    if (!canWithdrawResult) {
      const daysLeft = await getDaysUntilNextWithdrawal();
      const withdrawalPeriod = await AdminSettingsManager.getWithdrawalPeriod();
      Alert.alert(
        '출금 제한',
        `출금은 ${withdrawalPeriod}일에 1번만 가능합니다.\n${daysLeft}일 후에 출금할 수 있습니다.`
      );
      return;
    }

    if (availableForWithdrawal === 0) {
      Alert.alert('출금 불가', '출금 가능한 금액이 없습니다.');
      return;
    }

    if (!hasRegisteredAccount) {
      setShowAccountModal(true);
      return;
    }

    // 기존 계좌로 출금
    Alert.alert(
      '출금 신청',
      `${availableForWithdrawal.toLocaleString()}원을 출금하시겠습니까?\n\n출금 계좌: ${registeredAccount.bankName} ${registeredAccount.accountNumber}\n예금주: ${registeredAccount.accountHolder}`,
      [
        { text: '취소', style: 'cancel' },
        { text: '출금 신청', onPress: processWithdrawal }
      ]
    );
  };

  const processWithdrawal = () => {
    setLastWithdrawalDate(new Date().toISOString().split('T')[0]);
    Alert.alert(
      '출금 신청 완료',
      `${availableForWithdrawal.toLocaleString()}원 출금 신청이 완료되었습니다.\n영업일 기준 1-2일 내에 입금됩니다.`
    );
  };

  const handleAccountRegistration = () => {
    if (!accountInfo.bankName || !accountInfo.accountNumber || !accountInfo.accountHolder) {
      Alert.alert('입력 오류', '모든 계좌 정보를 입력해주세요.');
      return;
    }

    setRegisteredAccount(accountInfo);
    setHasRegisteredAccount(true);
    setShowAccountModal(false);
    
    Alert.alert(
      '계좌 등록 완료',
      `계좌가 등록되었습니다.\n${accountInfo.bankName} ${accountInfo.accountNumber}`,
      [
        { text: '확인', onPress: () => {
          // 계좌 등록 후 바로 출금 진행
          setTimeout(() => handleWithdrawal(), 500);
        }}
      ]
    );
  };

  const getMonthName = (year: number, month: number) => {
    return `${year}년 ${month}월`;
  };

  const getCurrentMonthDeadline = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${lastDay.getMonth() + 1}월 ${lastDay.getDate()}일`;
  };

  const getPaymentStatusText = (status: string) => {
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

  const getPaymentStatusColor = (status: string, isBlocked: boolean) => {
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
          <Text style={safeStyles.headerTitle}>수익 정산</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 이번 달 월별 정산 */}
        <View style={styles.monthlySettlementSection}>
          <Text style={styles.sectionTitle}>
            이번 달 정산 ({new Date().getFullYear()}년 {new Date().getMonth() + 1}월)
          </Text>
          
          {currentMonthSettlement ? (
            <>
              <View style={styles.settlementCards}>
                <View style={styles.settlementCard}>
                  <Text style={styles.settlementLabel}>매치 판매 건수</Text>
                  <Text style={styles.settlementValue}>{currentMonthSettlement.match_count}건</Text>
                </View>
                
                <View style={styles.settlementCard}>
                  <Text style={styles.settlementLabel}>매치 판매 총수익</Text>
                  <Text style={[styles.settlementValue, { color: '#16a34a' }]}>
                    {currentMonthSettlement.total_revenue.toLocaleString()}원
                  </Text>
                </View>
                
                <View style={[styles.settlementCard, styles.highlightCard]}>
                  <Text style={styles.settlementLabel}>추가 수익 (인기도)</Text>
                  <Text style={[styles.settlementValue, { color: '#9333ea' }]}>
                    {currentMonthSettlement.additional_revenue.toLocaleString()}원
                  </Text>
                  <Text style={styles.settlementNote}>※ 이 중 15% 수수료 납부</Text>
                </View>
                
                <View style={[styles.settlementCard, styles.commissionCard]}>
                  <Text style={styles.settlementLabel}>납부할 수수료</Text>
                  <Text style={[styles.settlementValue, { color: '#f97316' }]}>
                    {currentMonthSettlement.commission_due.toLocaleString()}원
                  </Text>
                  <Text style={styles.settlementNote}>(추가수익의 15%)</Text>
                </View>
              </View>

              {currentMonthSettlement.commission_due > 0 && (
                <View style={styles.paymentNotice}>
                  <AlertCircle size={20} color="#f59e0b" />
                  <View style={styles.noticeContent}>
                    <Text style={styles.noticeTitle}>수수료 납부 안내</Text>
                    <Text style={styles.noticeText}>
                      • 추가 수익: {currentMonthSettlement.additional_revenue.toLocaleString()}원 중 15% 납부
                    </Text>
                    <Text style={styles.noticeText}>
                      • 납부 기한: {getCurrentMonthDeadline()}까지
                    </Text>
                    <Text style={styles.noticeText}>
                      • 입금 계좌: 매치마켓 000-0000
                    </Text>
                    <Text style={styles.noticeText}>
                      • 입금자명: 판매자명 + {new Date().getMonth() + 1}월 수수료
                    </Text>
                    <Text style={[styles.noticeText, styles.warningText]}>
                      ⚠️ 관리자 확인 전까지 매치 판매 및 참가가 제한됩니다.
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptySettlement}>
              <Text style={styles.emptyText}>이번 달 판매 내역이 없습니다.</Text>
            </View>
          )}
        </View>

        {/* 미정산 내역 */}
        {unpaidSettlements.length > 0 && (
          <View style={styles.unpaidSection}>
            <Text style={styles.sectionTitle}>미정산 내역</Text>
            
            {unpaidSettlements.map((settlement) => (
              <View 
                key={settlement.id} 
                style={[
                  styles.unpaidCard,
                  settlement.is_blocked && styles.blockedCard,
                  settlement.payment_status === 'paid' && styles.paidCard
                ]}
              >
                <View style={styles.unpaidHeader}>
                  <View>
                    <Text style={styles.unpaidMonth}>
                      {getMonthName(settlement.year, settlement.month)}
                    </Text>
                    <Text style={styles.unpaidDetails}>
                      매치 {settlement.match_count}건
                    </Text>
                    <Text style={styles.unpaidAdditional}>
                      추가수익 {settlement.additional_revenue.toLocaleString()}원 → 수수료 15%
                    </Text>
                  </View>
                  <View style={styles.unpaidRight}>
                    <Text style={styles.unpaidLabel}>납부할 금액</Text>
                    <Text style={styles.unpaidAmount}>
                      {settlement.commission_due.toLocaleString()}원
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getPaymentStatusColor(settlement.payment_status, settlement.is_blocked) }
                    ]}>
                      {settlement.is_blocked ? (
                        <Text style={styles.statusText}>⚠️ 계정 제한</Text>
                      ) : settlement.payment_status === 'confirmed' ? (
                        <View style={styles.statusRow}>
                          <CheckCircle size={14} color="#ffffff" />
                          <Text style={styles.statusText}>정산 완료</Text>
                        </View>
                      ) : (
                        <Text style={styles.statusText}>
                          {getPaymentStatusText(settlement.payment_status)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.totalUnpaid}>
              <Text style={styles.totalUnpaidLabel}>총 미정산 금액</Text>
              <Text style={styles.totalUnpaidAmount}>
                {unpaidSettlements
                  .filter(s => s.payment_status !== 'confirmed')
                  .reduce((sum, s) => sum + s.commission_due, 0)
                  .toLocaleString()}원
              </Text>
            </View>
          </View>
        )}

        {/* 수익 요약 */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>전체 수익 현황</Text>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <DollarSign size={24} color="#16a34a" />
              <Text style={styles.summaryAmount}>{totalEarnings.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>총 수익</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Users size={24} color="#16a34a" />
              <Text style={styles.summaryAmount}>{totalMatchBaseCost.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>매치 기본비용</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <TrendingUp size={24} color="#3b82f6" />
              <Text style={styles.summaryAmount}>{totalMatchAdditionalRevenue.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>매치 추가수익</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Eye size={24} color="#f59e0b" />
              <Text style={styles.summaryAmount}>{totalAdRevenue.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>광고 수익</Text>
            </View>
          </View>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Calendar size={24} color="#16a34a" />
              <Text style={styles.summaryAmount}>{availableForWithdrawal.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>출금가능</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Clock size={24} color="#6b7280" />
              <Text style={styles.summaryAmount}>{totalWithdrawn.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>출금완료</Text>
            </View>
          </View>
        </View>

        {/* 기간 선택 */}
        <View style={styles.periodSection}>
          <View style={styles.periodButtons}>
            {[
              { key: 'week', label: '최근 1주' },
              { key: 'month', label: '최근 1개월' },
              { key: 'all', label: '전체' },
            ].map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.key as any)}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === period.key && styles.periodTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 수익 내역 */}
        <View style={styles.earningsSection}>
          <Text style={styles.sectionTitle}>수익 내역</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
          ) : earnings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>아직 정산된 수익이 없습니다</Text>
              <Text style={styles.emptySubtext}>매치 완료 후 수익이 자동으로 정산됩니다</Text>
            </View>
          ) : (
            earnings.map((earning) => (
              <View key={earning.id} style={styles.earningCard}>
                <View style={styles.earningHeader}>
                  <Text style={styles.matchTitle} numberOfLines={1}>
                    {earning.match_title}
                  </Text>
                </View>
                
                <View style={styles.earningDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={styles.detailText}>매치일: {earning.match_date}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Eye size={14} color="#6b7280" />
                    <Text style={styles.detailText}>
                      광고 조회수: {earning.ad_views?.toLocaleString() || 0}회 / 
                      클릭: {earning.ad_clicks?.toLocaleString() || 0}회
                    </Text>
                  </View>
                  
                  <View style={styles.revenueRow}>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>기본비용</Text>
                      <Text style={styles.revenueAmount}>
                        {Number(earning.match_base_cost || 0).toLocaleString()}원
                      </Text>
                    </View>
                    
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>추가수익</Text>
                      <Text style={styles.revenueAmount}>
                        {Number(earning.match_additional_revenue || 0).toLocaleString()}원
                      </Text>
                    </View>
                    
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>광고수익</Text>
                      <Text style={styles.revenueAmount}>
                        {Number(earning.ad_share || 0).toLocaleString()}원
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.totalRevenueRow}>
                    <View style={styles.totalRevenueItem}>
                      <Text style={styles.totalRevenueLabel}>총 수익</Text>
                      <Text style={styles.myShareAmount}>
                        {Number(earning.total_revenue || 0).toLocaleString()}원
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 정산 안내 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 정산 안내</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              • 매치 완료 후 수익이 자동으로 정산됩니다
            </Text>
            <Text style={styles.infoText}>
              • 인기도에 따른 추가 수익의 15%를 수수료로 납부합니다
            </Text>
            <Text style={styles.infoText}>
              • 수수료는 매월 말일까지 입금해야 합니다
            </Text>
            <Text style={styles.infoText}>
              • 관리자 확인 전까지 매치 판매 및 참가가 제한될 수 있습니다
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 하단 출금 바 */}
      <View style={styles.withdrawalBar}>
        <View style={styles.withdrawalInfo}>
          <Text style={styles.withdrawalAmount}>
            출금 가능: {availableForWithdrawal.toLocaleString()}원
          </Text>
          <TouchableOpacity 
            style={styles.historyLink}
            onPress={handleWithdrawalHistoryPress}
          >
            <Text style={styles.historyLinkText}>출금 내역 보기</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.withdrawalButtons}>
          {!canWithdraw() && (
            <Text style={styles.withdrawalLimit}>
              {getDaysUntilNextWithdrawal()}일 후 출금 가능
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.withdrawalButton,
              availableForWithdrawal === 0 && styles.withdrawalButtonDisabled
            ]}
            onPress={handleWithdrawal}
            disabled={availableForWithdrawal === 0}
          >
            <CreditCard size={20} color="#ffffff" />
            <Text style={styles.withdrawalButtonText}>출금하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 계좌 등록 모달 */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>계좌 등록</Text>
            <TouchableOpacity onPress={handleAccountRegistration}>
              <Text style={styles.modalSaveText}>저장</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>출금 계좌 정보</Text>
              <Text style={styles.modalDescription}>
                출금을 위해 계좌 정보를 등록해주세요. 등록된 계좌는 본인 명의의 계좌만 사용 가능합니다.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>은행명</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="은행을 선택하세요"
                  value={accountInfo.bankName}
                  onChangeText={(text) => setAccountInfo({ ...accountInfo, bankName: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>계좌번호</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="- 없이 숫자만 입력"
                  value={accountInfo.accountNumber}
                  onChangeText={(text) => setAccountInfo({ ...accountInfo, accountNumber: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>예금주</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="예금주명을 입력하세요"
                  value={accountInfo.accountHolder}
                  onChangeText={(text) => setAccountInfo({ ...accountInfo, accountHolder: text })}
                />
              </View>
            </View>

            <View style={styles.modalNotice}>
              <AlertCircle size={20} color="#f59e0b" />
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>주의사항</Text>
                <Text style={styles.noticeText}>
                  • 타인 명의의 계좌는 등록할 수 없습니다{'\n'}
                  • 잘못된 계좌 정보로 인한 출금 오류는 판매자 책임입니다{'\n'}
                  • 계좌 정보는 언제든 변경할 수 있습니다
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  monthlySettlementSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
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
  settlementCards: {
    gap: 12,
    marginTop: 12,
  },
  settlementCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  highlightCard: {
    backgroundColor: '#faf5ff',
    borderColor: '#d8b4fe',
    borderWidth: 2,
  },
  commissionCard: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
    borderWidth: 2,
  },
  settlementLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  settlementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  settlementNote: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  paymentNotice: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    gap: 8,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
    marginBottom: 2,
  },
  warningText: {
    color: '#dc2626',
    fontWeight: '700',
    marginTop: 4,
  },
  emptySettlement: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  unpaidSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
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
  unpaidCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  blockedCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  paidCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  unpaidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  unpaidMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  unpaidDetails: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  unpaidAdditional: {
    fontSize: 12,
    color: '#9333ea',
    fontWeight: '600',
  },
  unpaidRight: {
    alignItems: 'flex-end',
  },
  unpaidLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  unpaidAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  totalUnpaid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalUnpaidLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  totalUnpaidAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#dc2626',
  },
  summarySection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  periodSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodTextActive: {
    color: '#ffffff',
  },
  earningsSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  earningCard: {
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
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  earningDetails: {
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
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  revenueItem: {
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  myShareAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ec4899',
  },
  totalRevenueRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fdf2f8',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  totalRevenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRevenueLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
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
  withdrawalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 16,
  },
  withdrawalInfo: {
    flex: 1,
  },
  withdrawalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  historyLink: {
    marginTop: 4,
  },
  historyLinkText: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  withdrawalButtons: {
    alignItems: 'flex-end',
  },
  withdrawalLimit: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 8,
  },
  withdrawalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  withdrawalButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  withdrawalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
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
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  modalContent: {
    flex: 1,
    paddingTop: 16,
  },
  modalSection: {
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
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  modalNotice: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
    gap: 12,
  },
});