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
import { router, useFocusEffect } from 'expo-router';
import { DollarSign, TrendingUp, Calendar, Eye, Users, AlertCircle, CheckCircle, ClipboardList, ChevronLeft, ChevronRight, History } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { AdminSettingsManager } from '../../utils/adminSettings';
import { getMockEarnings, EarningsData } from '../../data/mockData';
import { useSafeStyles } from '../../constants/Styles';
import { EarningsManager, MonthlySettlement } from '../../utils/earningsManager';

export default function EarningsScreen() {
  const { user: currentUser } = useAuth();
  const safeStyles = useSafeStyles();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  
  const [earnings, setEarnings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 월별 정산 데이터
  const [currentMonthSettlement, setCurrentMonthSettlement] = useState<MonthlySettlement | null>(null);
  const [unpaidSettlements, setUnpaidSettlements] = useState<MonthlySettlement[]>([]);

  // 월 선택 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 미정산 내역 슬라이더 인덱스
  const [unpaidIndex, setUnpaidIndex] = useState(0);

  // 🔥 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        loadEarnings();
        loadMonthlySettlements();
      }
    }, [currentUser])
  );

  // Supabase에서 수익 데이터 로드
  useEffect(() => {
    loadEarnings();
    loadMonthlySettlements();
  }, [currentUser]);

  // 선택된 월이 변경될 때 데이터 필터링
  useEffect(() => {
    if (currentUser) {
      loadEarnings();
      loadMonthlySettlements();
    }
  }, [selectedYear, selectedMonth]);

  const loadEarnings = async () => {
    if (!currentUser) {
      console.log('⚠️ currentUser가 없습니다.');
      return;
    }

    console.log('🔍 수익 데이터 로드 시작, seller_id:', currentUser.id);
    setIsLoading(true);
    try {
      const data = await EarningsManager.getEarningsBySeller(currentUser.id);
      console.log('✅ 수익 데이터 로드 완료:', data.length, '건');
      console.log('데이터:', data);

      // 선택된 월의 데이터만 필터링
      const filteredData = data.filter((earning: any) => {
        const earningDate = new Date(earning.match_date);
        return (
          earningDate.getFullYear() === selectedYear &&
          earningDate.getMonth() + 1 === selectedMonth
        );
      });

      console.log(`📅 ${selectedYear}년 ${selectedMonth}월 데이터:`, filteredData.length, '건');
      setEarnings(filteredData);
    } catch (error) {
      console.error('❌ 수익 데이터 로드 실패:', error);
      setEarnings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlySettlements = async () => {
    if (!currentUser) {
      console.log('⚠️ currentUser가 없습니다 (월별 정산)');
      return;
    }

    console.log('🔍 월별 정산 데이터 로드 시작, seller_id:', currentUser.id);
    try {
      // 선택된 월의 정산 데이터 조회
      const selectedMonthSettlement = await EarningsManager.getSettlementByMonth(
        currentUser.id,
        selectedYear,
        selectedMonth
      );
      const unpaid = await EarningsManager.getUnpaidSettlements(currentUser.id);

      console.log('✅ 선택된 월 정산:', selectedMonthSettlement);
      console.log('✅ 미정산 내역:', unpaid);

      setCurrentMonthSettlement(selectedMonthSettlement);
      setUnpaidSettlements(unpaid);
      setUnpaidIndex(0); // 인덱스 초기화
    } catch (error) {
      console.error('❌ 월별 정산 데이터 로드 실패:', error);
    }
  };

  // 월 변경 함수
  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedYear(selectedYear - 1);
        setSelectedMonth(12);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedYear(selectedYear + 1);
        setSelectedMonth(1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // 미정산 슬라이더 이동
  const changeUnpaidIndex = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && unpaidIndex > 0) {
      setUnpaidIndex(unpaidIndex - 1);
    } else if (direction === 'next' && unpaidIndex < unpaidSettlements.length - 1) {
      setUnpaidIndex(unpaidIndex + 1);
    }
  };

  const totalEarnings = earnings.reduce((sum, earning) => sum + Number(earning.total_revenue || 0), 0);
  const totalMatchBaseCost = earnings.reduce((sum, earning) => sum + Number(earning.match_base_cost || 0), 0);
  const totalMatchAdditionalRevenue = earnings.reduce((sum, earning) => sum + Number(earning.match_additional_revenue || 0), 0);
  const totalAdRevenue = earnings.reduce((sum, earning) => sum + Number(earning.ad_share || 0), 0);

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
          <Text style={safeStyles.headerTitle}>수익 관리</Text>
          <TouchableOpacity
            onPress={() => router.push('/settlement-history')}
            style={styles.headerHistoryButton}>
            <History size={24} color="#ec4899" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 월 선택 네비게이션 */}
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            onPress={() => changeMonth('prev')}
            style={styles.monthArrowButton}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>

          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>
              {selectedYear}년 {selectedMonth}월
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => changeMonth('next')}
            style={styles.monthArrowButton}>
            <ChevronRight size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        {/* 선택된 월 정산 */}
        <View style={styles.monthlySettlementSection}>
          <Text style={styles.sectionTitle}>
            {selectedYear}년 {selectedMonth}월 수익현황
          </Text>
          
          {currentMonthSettlement ? (
            <>
              <View style={styles.compactSettlementGrid}>
                <View style={styles.compactSettlementCard}>
                  <View style={styles.compactIconWrapper}>
                    <ClipboardList size={16} color="#6b7280" />
                  </View>
                  <View style={styles.compactTextWrapper}>
                    <Text style={styles.compactLabel}>매치 판매 건수</Text>
                    <Text style={styles.compactAmount}>{currentMonthSettlement.match_count}건</Text>
                  </View>
                </View>
                
                <View style={[styles.compactSettlementCard, { backgroundColor: '#faf5ff' }]}>
                  <View style={[styles.compactIconWrapper, { backgroundColor: '#f3e8ff' }]}>
                    <TrendingUp size={16} color="#9333ea" />
                  </View>
                  <View style={styles.compactTextWrapper}>
                    <Text style={styles.compactLabel}>매치 추가 수익</Text>
                    <Text style={[styles.compactAmount, { color: '#9333ea' }]}>
                      {currentMonthSettlement.additional_revenue.toLocaleString()}원
                    </Text>
                    <Text style={styles.compactNote}>코트비+공 값을 제외하고 인기에 따라 추가로 얻은 수익</Text>
                  </View>
                </View>
                
                <View style={[styles.compactSettlementCard, { backgroundColor: '#fff7ed' }]}>
                  <View style={[styles.compactIconWrapper, { backgroundColor: '#ffedd5' }]}>
                    <AlertCircle size={16} color="#f97316" />
                  </View>
                  <View style={styles.compactTextWrapper}>
                    <Text style={styles.compactLabel}>납부할 수수료</Text>
                    <Text style={[styles.compactAmount, { color: '#f97316' }]}>
                      {currentMonthSettlement.commission_due.toLocaleString()}원
                    </Text>
                    <Text style={styles.compactNote}>(추가수익의 15%)</Text>
                  </View>
                </View>
              </View>
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
            <View style={styles.unpaidHeaderRow}>
              <Text style={styles.sectionTitle}>미정산 내역</Text>
              {unpaidSettlements.length > 1 && (
                <Text style={styles.unpaidCounter}>
                  {unpaidIndex + 1} / {unpaidSettlements.length}
                </Text>
              )}
            </View>
            <Text style={styles.unpaidWarningText}>
              매달 말일 까지 추가수익에 대한 수수료가 입금되지 않으면 사용이 중지됩니다.
            </Text>

            {unpaidSettlements.length > 0 && (
              <>
                <View
                  style={[
                    styles.unpaidCard,
                    unpaidSettlements[unpaidIndex].is_blocked && styles.blockedCard,
                    unpaidSettlements[unpaidIndex].payment_status === 'paid' && styles.paidCard
                  ]}
                >
                  <View style={styles.unpaidHeader}>
                    <View>
                      <Text style={styles.unpaidMonth}>
                        {getMonthName(unpaidSettlements[unpaidIndex].year, unpaidSettlements[unpaidIndex].month)}
                      </Text>
                      <Text style={styles.unpaidDetails}>
                        매치 {unpaidSettlements[unpaidIndex].match_count}건
                      </Text>
                      <Text style={styles.unpaidAdditional}>
                        추가수익 {unpaidSettlements[unpaidIndex].additional_revenue.toLocaleString()}원 → 수수료 15%
                      </Text>
                    </View>

                    {/* 납부할 금액 섹션 with 화살표 */}
                    <View style={styles.unpaidAmountContainer}>
                      {unpaidSettlements.length > 1 && unpaidIndex > 0 && (
                        <TouchableOpacity
                          onPress={() => changeUnpaidIndex('prev')}
                          style={styles.unpaidArrowButton}>
                          <ChevronLeft size={20} color="#6b7280" />
                        </TouchableOpacity>
                      )}

                      <View style={styles.unpaidRight}>
                        <Text style={styles.unpaidLabel}>납부할 금액</Text>
                        <Text style={styles.unpaidAmount}>
                          {(unpaidSettlements[unpaidIndex].unpaid_amount || unpaidSettlements[unpaidIndex].commission_due).toLocaleString()}원
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getPaymentStatusColor(unpaidSettlements[unpaidIndex].payment_status, unpaidSettlements[unpaidIndex].is_blocked) }
                        ]}>
                          {unpaidSettlements[unpaidIndex].is_blocked ? (
                            <Text style={styles.statusText}>⚠️ 계정 제한</Text>
                          ) : unpaidSettlements[unpaidIndex].payment_status === 'confirmed' ? (
                            <View style={styles.statusRow}>
                              <CheckCircle size={14} color="#ffffff" />
                              <Text style={styles.statusText}>정산 완료</Text>
                            </View>
                          ) : (
                            <Text style={styles.statusText}>
                              {getPaymentStatusText(unpaidSettlements[unpaidIndex].payment_status)}
                            </Text>
                          )}
                        </View>
                      </View>

                      {unpaidSettlements.length > 1 && unpaidIndex < unpaidSettlements.length - 1 && (
                        <TouchableOpacity
                          onPress={() => changeUnpaidIndex('next')}
                          style={styles.unpaidArrowButton}>
                          <ChevronRight size={20} color="#6b7280" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </>
            )}

            <View style={styles.totalUnpaid}>
              <Text style={styles.totalUnpaidLabel}>총 미정산 금액</Text>
              <Text style={styles.totalUnpaidAmount}>
                {unpaidSettlements
                  .filter(s => s.payment_status !== 'confirmed')
                  .reduce((sum, s) => sum + (s.unpaid_amount || s.commission_due), 0)
                  .toLocaleString()}원
              </Text>
            </View>

            <View style={styles.depositAccountSection}>
              <Text style={styles.depositAccountTitle}>입금 계좌</Text>
              <View style={styles.depositAccountInfo}>
                <View style={styles.depositAccountRow}>
                  <Text style={styles.depositAccountLabel}>은행명</Text>
                  <Text style={styles.depositAccountValue}>국민은행</Text>
                </View>
                <View style={styles.depositAccountRow}>
                  <Text style={styles.depositAccountLabel}>계좌번호</Text>
                  <Text style={styles.depositAccountValue}>123-456-789012</Text>
                </View>
                <View style={styles.depositAccountRow}>
                  <Text style={styles.depositAccountLabel}>예금주</Text>
                  <Text style={styles.depositAccountValue}>매치마켓</Text>
                </View>
              </View>
            </View>
          </View>
        )}

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
                  
                  {/* 광고 조회수/클릭 - 나중에 다시 살릴 예정 */}
{/* <View style={styles.detailRow}>
  <Eye size={14} color="#6b7280" />
  <Text style={styles.detailText}>
    광고 조회수: {earning.ad_views?.toLocaleString() || 0}회 / 
    클릭: {earning.ad_clicks?.toLocaleString() || 0}회
  </Text>
</View> */}
                  
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  headerHistoryButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fdf2f8',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  monthArrowButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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
  // 🔥 컴팩트 정산 그리드
  compactSettlementGrid: {
    gap: 8,
  },
  compactSettlementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  compactNote: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  // 기존 스타일 유지
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
    marginTop: 10,
    borderRadius: 8,
    padding: 10,
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
  unpaidHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  unpaidCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unpaidAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unpaidArrowButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unpaidWarningText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
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
  depositAccountSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  depositAccountTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  depositAccountInfo: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  depositAccountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  depositAccountLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  depositAccountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
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
    marginBottom: 12,
  },
  // 🔥 컴팩트한 그리드 스타일
  compactSummaryGrid: {
    gap: 8,
  },
  compactSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  compactIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  compactTextWrapper: {
    flex: 1,
  },
  compactLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  compactAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  // 기존 스타일 유지 (사용하지 않지만 혹시 모를 에러 방지)
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
});