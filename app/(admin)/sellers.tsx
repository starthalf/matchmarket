import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Store,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Ban,
  Calendar,
  TrendingUp,
  FileText,
  X,
  User as UserIcon,
  Check,
  UnlockKeyhole,
  CheckSquare,
  Square,
} from 'lucide-react-native';
import { useSafeStyles } from '../../constants/Styles';
import { SettlementManager, AggregatedSellerStats } from '../../utils/settlementManager';
import { CrossPlatformAlert } from '../../utils/crossPlatformAlert';

type SortKey = 'unpaid' | 'revenue' | 'matches' | 'name';
type FilterKey = 'all' | 'unpaid' | 'suspended' | 'completed';

export default function AdminSellersScreen() {
  const safeStyles = useSafeStyles();
  const [sellers, setSellers] = useState<AggregatedSellerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('unpaid');
  const [filterBy, setFilterBy] = useState<FilterKey>('all');
  const [selectedSeller, setSelectedSeller] = useState<AggregatedSellerStats | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  // 선택 모드 / 일괄 액션
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await SettlementManager.getAggregatedSellerStats();
      setSellers(data);
    } catch (error) {
      console.error('판매자 통합 통계 로드 실패:', error);
      CrossPlatformAlert.alert('오류', '판매자 통계를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링
  const filteredSellers = sellers
    .filter((s) => {
      const matchesSearch = s.seller_name.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (filterBy === 'unpaid') {
        matchesFilter = s.total_unpaid_amount > 0;
      } else if (filterBy === 'suspended') {
        matchesFilter = s.is_currently_suspended;
      } else if (filterBy === 'completed') {
        matchesFilter = s.total_unpaid_amount === 0;
      }

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'unpaid':
          return b.total_unpaid_amount - a.total_unpaid_amount;
        case 'revenue':
          return b.total_revenue - a.total_revenue;
        case 'matches':
          return b.total_match_count - a.total_match_count;
        case 'name':
          return a.seller_name.localeCompare(b.seller_name);
        default:
          return 0;
      }
    });

  // 전체 통계
  const stats = {
    totalSellers: sellers.length,
    totalRevenue: sellers.reduce((sum, s) => sum + s.total_revenue, 0),
    totalCommission: sellers.reduce((sum, s) => sum + s.total_commission_due, 0),
    totalPaid: sellers.reduce((sum, s) => sum + s.total_paid_amount, 0),
    totalUnpaid: sellers.reduce((sum, s) => sum + s.total_unpaid_amount, 0),
    suspendedCount: sellers.filter((s) => s.is_currently_suspended).length,
    unpaidCount: sellers.filter((s) => s.total_unpaid_amount > 0).length,
  };

  const formatMonth = (key: string) => {
    const [y, m] = key.split('-');
    return `${y}년 ${parseInt(m, 10)}월`;
  };

  const openBreakdown = (seller: AggregatedSellerStats) => {
    setSelectedSeller(seller);
    setShowBreakdownModal(true);
  };

  const getSellerStatusColor = (s: AggregatedSellerStats) => {
    if (s.is_currently_suspended) return '#dc2626';
    if (s.total_unpaid_amount > 0) return '#f59e0b';
    return '#16a34a';
  };

  const getSellerStatusText = (s: AggregatedSellerStats) => {
    if (s.is_currently_suspended) return '정지';
    if (s.total_unpaid_amount > 0) return '미납';
    return '완납';
  };

  // ====== 선택 모드 핸들러 ======
  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllFilteredSelected =
    filteredSellers.length > 0 &&
    filteredSellers.every((s) => selectedIds.has(s.seller_id));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      // 현재 필터된 항목들만 해제
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredSellers.forEach((s) => next.delete(s.seller_id));
        return next;
      });
    } else {
      // 현재 필터된 항목들 전부 추가
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredSellers.forEach((s) => next.add(s.seller_id));
        return next;
      });
    }
  };

  const handleBulkAction = (suspend: boolean) => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    const targetSellers = sellers.filter((s) => selectedIds.has(s.seller_id));
    const names = targetSellers.map((s) => s.seller_name);
    const action = suspend ? '정지' : '해제';
    const preview =
      names.slice(0, 3).join(', ') +
      (names.length > 3 ? ` 외 ${names.length - 3}명` : '');

    CrossPlatformAlert.alert(
      `일괄 ${action}`,
      `${preview}\n총 ${ids.length}명의 모든 월 정산을 ${action}합니다. 진행하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: action,
          style: suspend ? 'destructive' : 'default',
          onPress: async () => {
            setIsBulkProcessing(true);
            const result = await SettlementManager.bulkSetSuspendBySellerIds(
              ids,
              suspend
            );
            setIsBulkProcessing(false);

            if (result.success) {
              CrossPlatformAlert.alert(
                '완료',
                `${ids.length}명(${result.affectedCount}건)의 정산이 ${action} 처리되었습니다.`
              );
              exitSelectionMode();
              await loadData();
            } else {
              CrossPlatformAlert.alert(
                '오류',
                result.error || `${action} 처리에 실패했습니다.`
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <Text style={styles.title}>판매자 관리</Text>
          <Text style={styles.subtitle}>누적 매출 및 정산 통합 현황</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>판매자 데이터 로딩 중...</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 전체 통계 */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>전체 현황</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Store size={20} color="#6b7280" />
                  <Text style={styles.statValue}>{stats.totalSellers}명</Text>
                  <Text style={styles.statLabel}>총 판매자</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
                  <TrendingUp size={20} color="#16a34a" />
                  <Text style={[styles.statValue, { color: '#16a34a' }]}>
                    {stats.totalRevenue.toLocaleString()}원
                  </Text>
                  <Text style={styles.statLabel}>누적 매출</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                  <DollarSign size={20} color="#f59e0b" />
                  <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                    {stats.totalCommission.toLocaleString()}원
                  </Text>
                  <Text style={styles.statLabel}>누적 수수료</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
                  <AlertCircle size={20} color="#dc2626" />
                  <Text style={[styles.statValue, { color: '#dc2626' }]}>
                    {stats.totalUnpaid.toLocaleString()}원
                  </Text>
                  <Text style={styles.statLabel}>총 미납액</Text>
                </View>
              </View>

              {(stats.unpaidCount > 0 || stats.suspendedCount > 0) && (
                <View style={styles.warningBanner}>
                  <Ban size={18} color="#dc2626" />
                  <Text style={styles.warningText}>
                    미납 {stats.unpaidCount}명 · 정지 {stats.suspendedCount}명
                  </Text>
                </View>
              )}
            </View>

            {/* 검색 */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={20} color="#6b7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="판매자 이름 검색..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* 정렬 */}
            <View style={styles.filterSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {([
                  { key: 'unpaid', label: '미납액순' },
                  { key: 'revenue', label: '매출순' },
                  { key: 'matches', label: '매치순' },
                  { key: 'name', label: '이름순' },
                ] as Array<{ key: SortKey; label: string }>).map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.filterButton,
                      sortBy === s.key && styles.filterButtonActive,
                    ]}
                    onPress={() => setSortBy(s.key)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        sortBy === s.key && styles.filterTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 필터 */}
            <View style={styles.filterSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {([
                  { key: 'all', label: '전체' },
                  { key: 'unpaid', label: '미납 있음' },
                  { key: 'suspended', label: '정지됨' },
                  { key: 'completed', label: '완납' },
                ] as Array<{ key: FilterKey; label: string }>).map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.statusFilterButton,
                      filterBy === f.key && styles.statusFilterButtonActive,
                    ]}
                    onPress={() => setFilterBy(f.key)}
                  >
                    <Text
                      style={[
                        styles.statusFilterText,
                        filterBy === f.key && styles.statusFilterTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 판매자 목록 - 헤더 */}
            <View style={styles.sellersSection}>
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>
                  판매자 목록 ({filteredSellers.length})
                </Text>

                {!selectionMode ? (
                  <TouchableOpacity
                    style={styles.selectModeButton}
                    onPress={enterSelectionMode}
                  >
                    <CheckSquare size={14} color="#ec4899" />
                    <Text style={styles.selectModeButtonText}>선택</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.selectModeActions}>
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={toggleSelectAllFiltered}
                    >
                      <Text style={styles.selectAllButtonText}>
                        {isAllFilteredSelected ? '전체 해제' : '전체 선택'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={exitSelectionMode}
                    >
                      <Text style={styles.cancelButtonText}>취소</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {filteredSellers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Store size={48} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>판매자가 없습니다</Text>
                  <Text style={styles.emptyText}>
                    {searchQuery || filterBy !== 'all'
                      ? '조건에 맞는 판매자가 없습니다'
                      : '아직 정산이 발생한 판매자가 없습니다'}
                  </Text>
                </View>
              ) : (
                filteredSellers.map((seller) => {
                  const completionRate =
                    seller.settlement_months_count > 0
                      ? (seller.completed_months_count /
                          seller.settlement_months_count) *
                        100
                      : 0;
                  const isSelected = selectedIds.has(seller.seller_id);

                  return (
                    <TouchableOpacity
                      key={seller.seller_id}
                      activeOpacity={selectionMode ? 0.7 : 1}
                      onPress={() => {
                        if (selectionMode) toggleSelection(seller.seller_id);
                      }}
                      style={[
                        styles.sellerCard,
                        seller.is_currently_suspended && styles.suspendedCard,
                        selectionMode && isSelected && styles.selectedCard,
                      ]}
                    >
                      {/* 헤더 */}
                      <View style={styles.sellerHeader}>
                        <View style={styles.sellerInfo}>
                          {selectionMode && (
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && styles.checkboxChecked,
                              ]}
                            >
                              {isSelected && <Check size={14} color="#ffffff" />}
                            </View>
                          )}
                          <UserIcon size={20} color="#ec4899" />
                          <Text style={styles.sellerName}>{seller.seller_name}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getSellerStatusColor(seller) },
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {getSellerStatusText(seller)}
                          </Text>
                        </View>
                      </View>

                      {/* 누적 통계 */}
                      <View style={styles.metricsGrid}>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricValue}>
                            {seller.total_match_count}
                          </Text>
                          <Text style={styles.metricLabel}>누적 매치</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                          <Text style={styles.metricValue}>
                            {seller.total_revenue.toLocaleString()}
                          </Text>
                          <Text style={styles.metricLabel}>누적 매출(원)</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                          <Text style={styles.metricValue}>
                            {seller.total_commission_due.toLocaleString()}
                          </Text>
                          <Text style={styles.metricLabel}>누적 수수료(원)</Text>
                        </View>
                      </View>

                      {/* 입금/미납 */}
                      <View style={styles.paymentSummary}>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>정산 완료</Text>
                          <Text style={[styles.paymentValue, { color: '#3b82f6' }]}>
                            {seller.total_paid_amount.toLocaleString()}원
                          </Text>
                        </View>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>미정산</Text>
                          <Text
                            style={[
                              styles.paymentValue,
                              {
                                color:
                                  seller.total_unpaid_amount > 0
                                    ? '#dc2626'
                                    : '#9ca3af',
                              },
                            ]}
                          >
                            {seller.total_unpaid_amount.toLocaleString()}원
                          </Text>
                        </View>
                      </View>

                      {/* 정산 완료율 */}
                      <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>정산 완료율</Text>
                          <Text style={styles.progressValue}>
                            {seller.completed_months_count}/
                            {seller.settlement_months_count}개월 (
                            {completionRate.toFixed(0)}%)
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${completionRate}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* 정산 기간 */}
                      <View style={styles.periodRow}>
                        <Calendar size={14} color="#9ca3af" />
                        <Text style={styles.periodText}>
                          {formatMonth(seller.first_settlement)} ~{' '}
                          {formatMonth(seller.last_settlement)}
                        </Text>
                      </View>

                      {/* 액션 - 선택 모드 아닐 때만 표시 */}
                      {!selectionMode && (
                        <TouchableOpacity
                          style={styles.detailButton}
                          onPress={() => openBreakdown(seller)}
                        >
                          <FileText size={14} color="#ffffff" />
                          <Text style={styles.detailButtonText}>월별 내역 보기</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* 일괄 액션 바 */}
          {selectionMode && (
            <View style={styles.bulkActionBar}>
              <View style={styles.bulkSelectionInfo}>
                <Text style={styles.bulkSelectionCount}>
                  {selectedIds.size}명 선택
                </Text>
              </View>
              <View style={styles.bulkButtons}>
                <TouchableOpacity
                  style={[
                    styles.bulkButton,
                    styles.bulkUnsuspendButton,
                    (selectedIds.size === 0 || isBulkProcessing) &&
                      styles.bulkButtonDisabled,
                  ]}
                  disabled={selectedIds.size === 0 || isBulkProcessing}
                  onPress={() => handleBulkAction(false)}
                >
                  <UnlockKeyhole size={16} color="#ffffff" />
                  <Text style={styles.bulkButtonText}>해제</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.bulkButton,
                    styles.bulkSuspendButton,
                    (selectedIds.size === 0 || isBulkProcessing) &&
                      styles.bulkButtonDisabled,
                  ]}
                  disabled={selectedIds.size === 0 || isBulkProcessing}
                  onPress={() => handleBulkAction(true)}
                >
                  {isBulkProcessing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ban size={16} color="#ffffff" />
                      <Text style={styles.bulkButtonText}>정지</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      {/* 월별 내역 모달 */}
      <Modal
        visible={showBreakdownModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBreakdownModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSeller?.seller_name} 월별 내역
              </Text>
              <TouchableOpacity
                onPress={() => setShowBreakdownModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedSeller?.monthly_breakdown.map((m) => (
                <View key={m.id} style={styles.monthCard}>
                  <View style={styles.monthCardHeader}>
                    <Text style={styles.monthCardTitle}>
                      {m.year}년 {m.month}월
                    </Text>
                    {m.unpaid_amount === 0 ? (
                      <View style={[styles.miniBadge, { backgroundColor: '#dcfce7' }]}>
                        <CheckCircle size={12} color="#16a34a" />
                        <Text style={[styles.miniBadgeText, { color: '#16a34a' }]}>
                          완납
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.miniBadge, { backgroundColor: '#fee2e2' }]}>
                        <AlertCircle size={12} color="#dc2626" />
                        <Text style={[styles.miniBadgeText, { color: '#dc2626' }]}>
                          미납
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.monthDetailRow}>
                    <Text style={styles.monthDetailLabel}>매치</Text>
                    <Text style={styles.monthDetailValue}>{m.match_count}건</Text>
                  </View>
                  <View style={styles.monthDetailRow}>
                    <Text style={styles.monthDetailLabel}>수수료</Text>
                    <Text style={styles.monthDetailValue}>
                      {m.commission_due.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.monthDetailRow}>
                    <Text style={styles.monthDetailLabel}>입금</Text>
                    <Text style={[styles.monthDetailValue, { color: '#3b82f6' }]}>
                      {m.total_paid_amount.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.monthDetailRow}>
                    <Text style={styles.monthDetailLabel}>미납</Text>
                    <Text
                      style={[
                        styles.monthDetailValue,
                        {
                          color: m.unpaid_amount > 0 ? '#dc2626' : '#9ca3af',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {m.unpaid_amount.toLocaleString()}원
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseFullButton}
              onPress={() => setShowBreakdownModal(false)}
            >
              <Text style={styles.modalCloseFullButtonText}>닫기</Text>
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
    backgroundColor: '#f9fafb',
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
  loadingContainer: {
    flex: 1,
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  statusFilterButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusFilterTextActive: {
    color: '#ffffff',
  },
  sellersSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fce7f3',
    borderWidth: 1,
    borderColor: '#ec4899',
  },
  selectModeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ec4899',
  },
  selectModeActions: {
    flexDirection: 'row',
    gap: 6,
  },
  selectAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ec4899',
  },
  selectAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  sellerCard: {
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
  selectedCard: {
    borderWidth: 2,
    borderColor: '#ec4899',
    backgroundColor: '#fdf2f8',
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
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
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e5e7eb',
  },
  paymentSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
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
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ec4899',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ec4899',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  periodText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ec4899',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 40,
  },
  // 일괄 액션 바
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  bulkSelectionInfo: {
    flex: 1,
  },
  bulkSelectionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  bulkSuspendButton: {
    backgroundColor: '#dc2626',
  },
  bulkUnsuspendButton: {
    backgroundColor: '#16a34a',
  },
  bulkButtonDisabled: {
    opacity: 0.5,
  },
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 500,
  },
  monthCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  monthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  monthDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  monthDetailLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  monthDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  modalCloseFullButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  modalCloseFullButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});