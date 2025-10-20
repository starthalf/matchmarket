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
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Eye, Users, CreditCard, Building, Clock } from 'lucide-react-native';
import { getCurrentUser } from '../data/mockData';
import { AdminSettingsManager } from '../utils/adminSettings';
import { getMockEarnings, EarningsData } from '../data/mockData';
import { useSafeStyles } from '../constants/Styles';
import { EarningsManager } from '../utils/earningsManager';

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

  // Supabase에서 수익 데이터 로드
  useEffect(() => {
    loadEarnings();
  }, [currentUser]);

  const loadEarnings = async () => {
    console.log('=== loadEarnings 시작 ===');
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
  setIsLoading(false); // 👈 이게 추가되어서 해결됨!
  return;
}
    
    setIsLoading(true);
    try {
      console.log('📡 Supabase에서 수익 데이터 조회 중...');
      const data = await EarningsManager.getEarningsBySeller(currentUser.id);
      console.log('✅ 수익 데이터 조회 완료:', data);
      setEarnings(data);
    } catch (error) {
      console.error('❌ 수익 데이터 로드 실패:', error);
      // 에러 시 빈 배열 사용 (아직 수익 없음)
      setEarnings([]);
    } finally {
      console.log('로딩 종료');
      setIsLoading(false);
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
        {/* 수익 요약 */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>수익 현황</Text>
          
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
                      조회 {Number(earning.ad_views || 0).toLocaleString()} · 클릭 {Number(earning.ad_clicks || 0)}
                    </Text>
                  </View>
                  
                  <View style={styles.revenueRow}>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>매치 기본비용</Text>
                      <Text style={styles.revenueAmount}>
                        {Number(earning.match_base_cost || 0).toLocaleString()}원
                      </Text>
                    </View>
                    
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>매치 추가수익</Text>
                      <Text style={styles.revenueAmount}>
                        {Number(earning.match_additional_revenue || 0).toLocaleString()}원
                      </Text>
                    </View>
                    
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>광고 수익 (50%)</Text>
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
              • 매치 기본비용: 판매자가 설정한 기본가격 전액 지급
            </Text>
            <Text style={styles.infoText}>
              • 매치 추가수익: 기본가격 초과분에서 플랫폼 수수료 15% 제외 후 지급
            </Text>
            <Text style={styles.infoText}>
              • 광고 수익의 50%가 호스트에게 배분됩니다
            </Text>
            <Text style={styles.infoText}>
              • 2주일에 1번 출금 가능합니다
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 출금 버튼 */}
      <View style={styles.withdrawalBar}>
        <View style={styles.withdrawalInfo}>
          <Text style={styles.withdrawalAmount}>
            출금 가능: {availableForWithdrawal.toLocaleString()}원
          </Text>
          <TouchableOpacity 
            style={styles.historyLink}
            onPress={handleWithdrawalHistoryPress}
          >
            <Text style={styles.historyLinkText}>출금내역 보기</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.withdrawalButtons}>
          {!canWithdraw() && (
            <Text style={styles.withdrawalLimit}>
              {getDaysUntilNextWithdrawal()}일 후 출금 가능
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={[
            styles.withdrawalButton,
            (!canWithdraw() || availableForWithdrawal === 0) && styles.withdrawalButtonDisabled
          ]}
          onPress={handleWithdrawal}
          disabled={!canWithdraw() || availableForWithdrawal === 0}
        >
          <CreditCard size={18} color="#ffffff" />
          <Text style={styles.withdrawalButtonText}>출금</Text>
        </TouchableOpacity>
      </View>

      {/* 계좌 등록 모달 */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAccountModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>출금 계좌 등록</Text>
            <TouchableOpacity onPress={handleAccountRegistration}>
              <Text style={styles.modalSaveText}>저장</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>계좌 정보</Text>
              <Text style={styles.modalDescription}>
                출금받을 계좌를 등록해주세요. 등록된 계좌는 보안상 수정이 제한됩니다.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>은행명 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountInfo.bankName}
                  onChangeText={(text) => setAccountInfo({...accountInfo, bankName: text})}
                  placeholder="예) 국민은행"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>계좌번호 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountInfo.accountNumber}
                  onChangeText={(text) => setAccountInfo({...accountInfo, accountNumber: text})}
                  placeholder="예) 123-456-789012"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>예금주 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountInfo.accountHolder}
                  onChangeText={(text) => setAccountInfo({...accountInfo, accountHolder: text})}
                  placeholder="예) 홍길동"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.modalNotice}>
              <Building size={20} color="#f59e0b" />
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>안전한 출금을 위한 안내</Text>
                <Text style={styles.noticeText}>
                  • 계좌 정보는 암호화되어 안전하게 보관됩니다{'\n'}
                  • 출금은 2주일에 1번만 가능합니다{'\n'}
                  • 영업일 기준 1-2일 내에 입금됩니다{'\n'}
                  • 계좌 변경은 고객센터를 통해 가능합니다
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
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  periodSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#ec4899',
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
    marginBottom: 16,
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
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});