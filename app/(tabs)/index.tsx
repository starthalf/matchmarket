// app/(tabs)/index.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  SlidersHorizontal,
  Shield,
  Database,
  User,
  LogIn,
  X,
  Check,
  MapPin,
  Flame,
} from 'lucide-react-native';
import { MatchCard } from '../../components/MatchCard';
import { PlayerCarousel } from '../../components/PlayerCarousel';
import { DailyDebateMini } from '../../components/DailyDebateMini';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';
import { isToday as isTodayHelper } from '../../utils/dateHelper';
import { PricingCalculator } from '../../types/tennis';
import { Colors, Radius, Type, Shadow, Hairline, IconStroke } from '../../constants/theme';

type MatchTypeFilter = 'womens' | 'mixed' | null;
type LevelFilter = 'pro' | null;
type TimeFilter = 'today' | null;

const LOCATIONS = [
  { label: '전체 지역', value: '' },
  { label: '서울시', value: '서울시' },
  { label: '경기북부', value: '경기북부' },
  { label: '경기남부', value: '경기남부' },
  { label: '경기서부', value: '경기서부' },
  { label: '경기동부', value: '경기동부' },
  { label: '인천시', value: '인천시' },
  { label: '대전시', value: '대전시' },
  { label: '대구시', value: '대구시' },
  { label: '부산시', value: '부산시' },
  { label: '울산시', value: '울산시' },
  { label: '광주시', value: '광주시' },
  { label: '세종시', value: '세종시' },
  { label: '강원도', value: '강원도' },
  { label: '충북', value: '충북' },
  { label: '충남', value: '충남' },
  { label: '경북', value: '경북' },
  { label: '경남', value: '경남' },
  { label: '전북', value: '전북' },
  { label: '전남', value: '전남' },
  { label: '제주도', value: '제주도' },
];

export default function HomeScreen() {
  const { user, login, logout } = useAuth();
  const { isAdmin, adminLogin, adminLogout } = useAdmin();
  const { matches: displayMatches, isLoadingMatches, refreshMatches } = useMatches();
  const safeStyles = useSafeStyles();
  const mounted = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  const isDevelopment = process.env.NODE_ENV === 'development';

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'time' | 'ntrp'>('time');

  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [recruitingFilter, setRecruitingFilter] = useState<boolean>(false);
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [matchFilter, setMatchFilter] = useState<'all' | 'hot'>('hot');
  const [displayCount, setDisplayCount] = useState(20);

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleQuickLogin = async (userIdentifier: string) => {
    try {
      if (userIdentifier === 'admin') {
        const result = await adminLogin('hcgkhlee@gmail.com', 'demo123');
        if (!result.success) {
          window.alert(`관리자 로그인 실패: ${result.error}`);
        }
        return;
      }

      const { mockUsers } = await import('../../data/mockData');
      const targetUser = mockUsers.find(u => u.name === userIdentifier);

      if (!targetUser) {
        if (Platform.OS === 'web') {
          window.alert('로그인 실패: 사용자를 찾을 수 없습니다.');
        }
        return;
      }

      const result = await login(targetUser.email, 'demo123');
      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert(`로그인 성공: ${targetUser.name}(${targetUser.email})로 로그인되었습니다.`);
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(`로그인 실패: ${result.error || '로그인에 실패했습니다.'}`);
        }
      }
    } catch (error) {
      console.error('퀵 로그인 오류:', error);
      if (Platform.OS === 'web') {
        window.alert('오류: 로그인 중 오류가 발생했습니다.');
      }
    }
  };

  const handleAdminPress = () => {
    if (isAdmin) {
      router.push('/(admin)/dashboard');
    } else {
      if (Platform.OS === 'web') {
        if (window.confirm('관리자 기능에 접근하려면 로그인이 필요합니다. 로그인하시겠습니까?')) {
          router.push('/admin-login');
        }
      }
    }
  };

  const handleSortSelect = (sort: 'popular' | 'time' | 'ntrp') => {
    setSortBy(sort);
    setShowSortModal(false);
  };

  const toggleMatchTypeFilter = (type: 'womens' | 'mixed') => {
    setMatchTypeFilter(prev => (prev === type ? null : type));
  };

  const toggleLevelFilter = () => {
    setLevelFilter(prev => (prev === 'pro' ? null : 'pro'));
  };

  const toggleTimeFilter = () => {
    setTimeFilter(prev => (prev === 'today' ? null : 'today'));
  };

  const toggleRecruitingFilter = () => {
    setRecruitingFilter(prev => !prev);
  };

  // 필터 변경 시 표시 개수 리셋
  useEffect(() => {
    setDisplayCount(20);
  }, [
    matchFilter,
    matchTypeFilter,
    levelFilter,
    timeFilter,
    recruitingFilter,
    locationFilter,
    searchQuery,
    sortBy,
  ]);

  const isToday = (dateString: string) => {
    return isTodayHelper(dateString);
  };

  const activeFilterCount =
    (levelFilter ? 1 : 0) +
    (matchTypeFilter ? 1 : 0) +
    (timeFilter ? 1 : 0) +
    (recruitingFilter ? 1 : 0) +
    (locationFilter ? 1 : 0);

  const filteredMatches = useMemo(() => {
    return displayMatches
      .filter(
        match =>
          searchQuery === '' ||
          match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (match.location && match.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .filter(match => {
        let passes = true;

        if (levelFilter === 'pro') {
          passes = passes && match.seller.careerType === '선수';
        }

        if (matchTypeFilter === 'womens') {
          passes = passes && match.matchType === '여복';
        } else if (matchTypeFilter === 'mixed') {
          passes = passes && match.matchType === '혼복';
        }

        if (timeFilter === 'today') {
          passes = passes && isToday(match.date);
        }

        if (recruitingFilter) {
          passes = passes && !match.isClosed;
        }

        if (locationFilter) {
          passes = passes && match.location.includes(locationFilter);
        }

        return passes;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') {
          const diff = b.applicationsCount - a.applicationsCount;
          if (diff !== 0) return diff;
          return (
            new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
          );
        } else if (sortBy === 'time') {
          return (
            new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
          );
        } else if (sortBy === 'ntrp') {
          const diff = b.ntrpRequirement.max - a.ntrpRequirement.max;
          if (diff !== 0) return diff;
          return (
            new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
          );
        }
        return 0;
      })
      .filter(match => {
        const matchDateTime = new Date(`${match.date}T${match.time}`);
        const hoursUntilMatch = Math.max(
          0,
          (matchDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
        );
        const applications = match.applications || [];

        const dynamicPrice = PricingCalculator.calculateDynamicPrice({
          viewCount: match.seller?.viewCount || 0,
          applicationsCount: applications.length,
          expectedApplicants: (match.expectedParticipants?.total || 0) * 5,
          hoursUntilMatch,
          basePrice: match.basePrice,
          maxPrice: match.maxPrice || 200000,
        });

        if (matchFilter === 'hot') {
          return dynamicPrice > match.basePrice;
        }
        return dynamicPrice <= match.basePrice;
      });
  }, [
    displayMatches,
    searchQuery,
    levelFilter,
    matchTypeFilter,
    timeFilter,
    recruitingFilter,
    locationFilter,
    sortBy,
    matchFilter,
  ]);

  const renderChip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={safeStyles.safeContainer} edges={['top']}>
      {/* ── 헤더 ── */}
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>MatchMarket</Text>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.subtitle} numberOfLines={1}>
              인기가 오르면 가격도 오릅니다
            </Text>
          </View>

          <View style={styles.headerIcons}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push('/supabase-test')}
              >
                <Database size={18} color={Colors.textSecondary} strokeWidth={IconStroke} />
              </TouchableOpacity>
            )}

            {isAdmin && (
              <TouchableOpacity style={styles.iconBtn} onPress={handleAdminPress}>
                <Shield size={18} color={Colors.danger} strokeWidth={IconStroke} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                if (user) {
                  router.push('/profile');
                } else {
                  router.push('/auth/login');
                }
              }}
            >
              {user ? (
                <User size={18} color={Colors.text} strokeWidth={IconStroke} />
              ) : (
                <LogIn size={18} color={Colors.textSecondary} strokeWidth={IconStroke} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── 개발 모드 데모 컨트롤 ── */}
      {isDevelopment && (
        <View style={styles.demoControls}>
          <Text style={styles.demoTitle}>
            DEV {user ? `· ${user.name}` : '· 로그아웃 상태'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {!user ? (
              <>
                <TouchableOpacity
                  style={[styles.demoButton, styles.adminDemoButton]}
                  onPress={() => handleQuickLogin('admin')}
                >
                  <Text style={[styles.demoButtonText, styles.adminDemoButtonText]}>admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => handleQuickLogin('aesthetic.vibes')}
                >
                  <Text style={styles.demoButtonText}>aesthetic.vibes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => handleQuickLogin('urban.explorer')}
                >
                  <Text style={styles.demoButtonText}>urban.explorer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => handleQuickLogin('midnight.rider')}
                >
                  <Text style={styles.demoButtonText}>midnight.rider</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.demoButton,
                  styles.logoutButton,
                  isLoggingOut && styles.logoutButtonDisabled,
                ]}
                disabled={isLoggingOut}
                onPress={async () => {
                  if (isLoggingOut) return;

                  setIsLoggingOut(true);
                  try {
                    if (isAdmin) {
                      await adminLogout();
                    }
                    await logout();
                  } catch (error) {
                    console.error('로그아웃 오류:', error);
                    if (Platform.OS === 'web') {
                      window.alert('로그아웃 중 오류가 발생했습니다: ' + (error as Error).message);
                    }
                  } finally {
                    setIsLoggingOut(false);
                  }
                }}
              >
                <Text style={[styles.demoButtonText, styles.logoutButtonText]}>
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* ── 인기 플레이어 + 오늘의 토론 ── */}
      <View style={styles.topRow}>
        <View style={styles.topRowLeft}>
          <PlayerCarousel />
        </View>
        <View style={styles.topRowDivider} />
        <View style={styles.topRowRight}>
          <DailyDebateMini />
        </View>
      </View>

      {/* ── 필터 바 ── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.locationBtn, !!locationFilter && styles.locationBtnActive]}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.8}
        >
          <MapPin
            size={13}
            color={locationFilter ? Colors.textOnInk : Colors.textSecondary}
            strokeWidth={IconStroke}
          />
          <Text style={[styles.locationText, !!locationFilter && styles.locationTextActive]}>
            {locationFilter || '지역'}
          </Text>
        </TouchableOpacity>

        <View style={styles.filterBarDivider} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          {renderChip('선출', levelFilter === 'pro', toggleLevelFilter)}
          {renderChip('여복', matchTypeFilter === 'womens', () => toggleMatchTypeFilter('womens'))}
          {renderChip('혼복', matchTypeFilter === 'mixed', () => toggleMatchTypeFilter('mixed'))}
          {renderChip('오늘', timeFilter === 'today', toggleTimeFilter)}
          {renderChip('모집중', recruitingFilter, toggleRecruitingFilter)}
        </ScrollView>

        <View style={styles.filterBarActions}>
          <TouchableOpacity
            style={styles.iconBtnSm}
            onPress={() => setShowSearchBar(prev => !prev)}
          >
            <Search
              size={17}
              color={showSearchBar ? Colors.accent : Colors.textSecondary}
              strokeWidth={IconStroke}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtnSm} onPress={() => setShowSortModal(true)}>
            <SlidersHorizontal size={17} color={Colors.textSecondary} strokeWidth={IconStroke} />
            {activeFilterCount > 0 && <View style={styles.filterCountDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 검색바 (토글) ── */}
      {showSearchBar && (
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Search size={15} color={Colors.textTertiary} strokeWidth={IconStroke} />
            <TextInput
              style={styles.searchInput}
              placeholder="매치 · 지역 검색"
              placeholderTextColor={Colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={15} color={Colors.textTertiary} strokeWidth={IconStroke} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── 지역 선택 모달 (바텀시트) ── */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>지역</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} hitSlop={8}>
                <X size={20} color={Colors.textTertiary} strokeWidth={IconStroke} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {LOCATIONS.map(loc => {
                const active = locationFilter === loc.value;
                return (
                  <TouchableOpacity
                    key={loc.value}
                    style={styles.sheetOption}
                    onPress={() => {
                      setLocationFilter(loc.value);
                      setShowLocationModal(false);
                    }}
                  >
                    <Text style={[styles.sheetOptionText, active && styles.sheetOptionTextActive]}>
                      {loc.label}
                    </Text>
                    {active && <Check size={17} color={Colors.accent} strokeWidth={2.2} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── 정렬 모달 (바텀시트) ── */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>정렬</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)} hitSlop={8}>
                <X size={20} color={Colors.textTertiary} strokeWidth={IconStroke} />
              </TouchableOpacity>
            </View>

            {(
              [
                { key: 'popular', label: '인기순' },
                { key: 'time', label: '시간순' },
                { key: 'ntrp', label: 'NTRP순' },
              ] as const
            ).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={styles.sheetOption}
                onPress={() => handleSortSelect(opt.key)}
              >
                <Text
                  style={[styles.sheetOptionText, sortBy === opt.key && styles.sheetOptionTextActive]}
                >
                  {opt.label}
                </Text>
                {sortBy === opt.key && <Check size={17} color={Colors.accent} strokeWidth={2.2} />}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── 매치 목록 ── */}
      {isLoadingMatches ? (
        <View style={[styles.matchList, styles.stateContainer]}>
          <Text style={styles.stateText}>불러오는 중…</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          style={styles.matchList}
          contentContainerStyle={styles.matchListContent}
          data={filteredMatches.slice(0, displayCount)}
          keyExtractor={item => item.id}
          renderItem={({ item: match }) => <MatchCard match={match} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                setDisplayCount(20);
                await refreshMatches();
                setRefreshing(false);
              }}
              tintColor={Colors.textTertiary}
              colors={[Colors.accent]}
            />
          }
          onEndReached={() => {
            setDisplayCount(prev => prev + 20);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={<View style={styles.bottomPadding} />}
          ListEmptyComponent={
            <View style={styles.stateContainer}>
              <Text style={styles.stateTitle}>조건에 맞는 매치가 없어요</Text>
              <Text style={styles.stateText}>필터를 조정해 보세요</Text>
            </View>
          }
        />
      )}

      {/* ── 플로팅 세그먼트 ── */}
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentTab, matchFilter === 'hot' && styles.segmentTabActive]}
            activeOpacity={0.9}
            onPress={() => {
              setMatchFilter('hot');
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
          >
            <Flame
              size={14}
              color={matchFilter === 'hot' ? Colors.textOnAccent : Colors.textTertiary}
              fill={matchFilter === 'hot' ? Colors.textOnAccent : 'transparent'}
              strokeWidth={matchFilter === 'hot' ? 0 : 2}
            />
            <Text
              style={[styles.segmentText, matchFilter === 'hot' && styles.segmentTextActive]}
            >
              HOT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, matchFilter === 'all' && styles.segmentTabActive]}
            activeOpacity={0.9}
            onPress={() => {
              setMatchFilter('all');
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
          >
            <Text
              style={[styles.segmentText, matchFilter === 'all' && styles.segmentTextActive]}
            >
              일반매치
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── header ──
  headerLeft: {
    flex: 1,
    marginRight: 8,
    gap: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  brand: {
    ...Type.h1,
    color: Colors.text,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent,
    marginTop: 6,
  },
  subtitle: {
    ...Type.caption,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── dev ──
  demoControls: {
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: Hairline,
    borderBottomColor: Colors.border,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: Colors.textTertiary,
  },
  demoButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoButtonText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textSecondary,
  },
  adminDemoButton: {
    borderColor: Colors.dangerBorder,
    backgroundColor: Colors.dangerSoft,
  },
  adminDemoButtonText: {
    color: Colors.danger,
    fontWeight: '600',
  },
  logoutButton: {
    borderColor: Colors.border,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    color: Colors.danger,
    fontWeight: '600',
  },

  // ── top row ──
  topRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: Hairline,
    borderBottomColor: Colors.border,
  },
  topRowLeft: {
    flex: 6,
  },
  topRowDivider: {
    width: Hairline,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  topRowRight: {
    flex: 4,
  },

  // ── filter bar ──
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: Hairline,
    borderBottomColor: Colors.border,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  locationBtnActive: {
    backgroundColor: Colors.ink,
  },
  locationText: {
    ...Type.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  locationTextActive: {
    color: Colors.textOnInk,
  },
  filterBarDivider: {
    width: Hairline,
    height: 16,
    backgroundColor: Colors.border,
  },
  chipsContent: {
    alignItems: 'center',
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    // shadow 제거 — 칩에 그림자 넣으면 바로 촌스러워진다
  },
  chipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  chipText: {
    ...Type.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnInk,
  },
  filterBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtnSm: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountDot: {
    position: 'absolute',
    top: 5,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },

  // ── search ──
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: Hairline,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    ...Type.body,
    color: Colors.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  // ── modal / sheet ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    ...Shadow.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 4,
  },
  sheetTitle: {
    ...Type.h2,
    color: Colors.text,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 2,
  },
  sheetOptionText: {
    ...Type.body,
    color: Colors.textSecondary,
  },
  sheetOptionTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },

  // ── list ──
  matchList: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  matchListContent: {
    paddingTop: 12,
  },
  stateContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 4,
  },
  stateTitle: {
    ...Type.h3,
    color: Colors.text,
  },
  stateText: {
    ...Type.label,
    color: Colors.textTertiary,
  },
  bottomPadding: {
    height: 96,
  },

  // ── floating segment ──
  segmentWrap: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  segmentTabActive: {
    backgroundColor: Colors.accent,
  },
  segmentText: {
    ...Type.label,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  segmentTextActive: {
    color: Colors.textOnInk,
  },
});
