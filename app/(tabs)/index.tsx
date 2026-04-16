// app/(tabs)/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Shield, Database, User, LogIn, ArrowUpDown, X, Check, MapPin, ChevronDown } from 'lucide-react-native';
import { MatchCard } from '../../components/MatchCard';
import { PlayerCarousel } from '../../components/PlayerCarousel';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';
import { isToday as isTodayHelper } from '../../utils/dateHelper';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../../constants/theme';

type MatchTypeFilter = 'womens' | 'mixed' | null;
type LevelFilter = 'pro' | null;
type TimeFilter = 'today' | null;

export default function HomeScreen() {
  const { user, login, logout } = useAuth();
  const { isAdmin, adminLogin, adminLogout } = useAdmin();
  const { matches: displayMatches, isLoadingMatches, refreshMatches } = useMatches();
  const safeStyles = useSafeStyles();
  const mounted = useRef(false);

  const isDevelopment = process.env.NODE_ENV === 'development';

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'time' | 'ntrp'>('popular');

  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [recruitingFilter, setRecruitingFilter] = useState<boolean>(false);
  const [locationFilter, setLocationFilter] = useState<string>('');

  const [showSortButton, setShowSortButton] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
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

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowSortButton(offsetY > 50);
  };

  const handleSortSelect = (sort: 'popular' | 'time' | 'ntrp') => {
    setSortBy(sort);
    setShowSortModal(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMatches();
    setRefreshing(false);
  };

  const toggleMatchTypeFilter = (type: 'womens' | 'mixed') => {
    setMatchTypeFilter(prev => prev === type ? null : type);
  };

  const toggleLevelFilter = () => {
    setLevelFilter(prev => prev === 'pro' ? null : 'pro');
  };

  const toggleTimeFilter = () => {
    setTimeFilter(prev => prev === 'today' ? null : 'today');
  };

  const toggleRecruitingFilter = () => {
    setRecruitingFilter(prev => !prev);
  };

  const isToday = (dateString: string) => {
    return isTodayHelper(dateString);
  };

  const sortLabel = sortBy === 'popular' ? '인기순' : sortBy === 'time' ? '시간순' : 'NTRP순';

  return (
    <SafeAreaView style={[safeStyles.safeContainer, { backgroundColor: Colors.bg }]}>
      {/* 상단 헤더 */}
      <View style={[safeStyles.safeHeader, styles.header]}>
        <View style={[safeStyles.safeHeaderContent, styles.headerContent]}>
          <View style={styles.brandWrap}>
            <Text style={styles.title}>
              MatchMarket
              <Text style={styles.titleDot}>.</Text>
            </Text>
            <Text style={styles.subtitle}>인기 매치를 선점하세요</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.iconBtn, user && styles.iconBtnActive]}
              onPress={() => {
                if (user) {
                  router.push('/profile');
                } else {
                  router.push('/auth/login');
                }
              }}
            >
              {user ? (
                <User size={18} color={Colors.primary} strokeWidth={2.2} />
              ) : (
                <LogIn size={18} color={Colors.textSecondary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>

            {isAdmin && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: Colors.infoSoft }]}
                onPress={() => router.push('/supabase-test')}
              >
                <Database size={18} color={Colors.info} strokeWidth={2.2} />
              </TouchableOpacity>
            )}

            {isAdmin && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: Colors.dangerSoft }]}
                onPress={handleAdminPress}
              >
                <Shield size={18} color={Colors.danger} strokeWidth={2.2} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 개발 모드 데모 컨트롤 */}
      {isDevelopment && (
        <View style={styles.demoControls}>
          <View style={styles.demoHeader}>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV</Text>
            </View>
            <Text style={styles.demoTitle}>
              {user ? `${user.name} 로그인됨` : '로그인 안됨'}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.demoButtons}>
            {!user ? (
              <>
                <TouchableOpacity
                  style={[styles.demoButton, styles.adminDemoButton]}
                  onPress={() => handleQuickLogin('admin')}
                >
                  <Text style={[styles.demoButtonText, styles.adminDemoButtonText]}>admin</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.demoButton} onPress={() => handleQuickLogin('aesthetic.vibes')}>
                  <Text style={styles.demoButtonText}>aesthetic.vibes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.demoButton} onPress={() => handleQuickLogin('urban.explorer')}>
                  <Text style={styles.demoButtonText}>urban.explorer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.demoButton} onPress={() => handleQuickLogin('midnight.rider')}>
                  <Text style={styles.demoButtonText}>midnight.rider</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.demoButton, styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
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
                <Text style={styles.logoutButtonText}>
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* 🔥 핫 플레이어 캐러셀 */}
      <PlayerCarousel />

      {/* 검색 + 필터 바 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={17} color={Colors.textTertiary} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            placeholder="매치 검색"
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {showSortButton ? (
          <TouchableOpacity style={styles.sortIconButton} onPress={() => setShowSortModal(true)}>
            <ArrowUpDown size={16} color={Colors.textOnPrimary} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.filterIconButton}>
            <SlidersHorizontal size={17} color={Colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
      </View>

      {/* 필터 칩 + 지역 드롭다운 (한 줄) */}
      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {/* 지역 드롭다운 - 칩 스타일 */}
          {Platform.OS === 'web' ? (
            <View style={styles.locationChip}>
              <MapPin size={13} color={Colors.text} strokeWidth={2.2} />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{
                  padding: 0,
                  fontSize: 13,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: Colors.text,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  outline: 'none',
                  fontWeight: 600,
                  appearance: 'none',
                  paddingRight: 16,
                }}
              >
                <option value="">전체 지역</option>
                <option value="서울시">서울시</option>
                <option value="경기북부">경기북부</option>
                <option value="경기남부">경기남부</option>
                <option value="경기서부">경기서부</option>
                <option value="경기동부">경기동부</option>
                <option value="인천시">인천시</option>
                <option value="대전시">대전시</option>
                <option value="대구시">대구시</option>
                <option value="부산시">부산시</option>
                <option value="울산시">울산시</option>
                <option value="광주시">광주시</option>
                <option value="세종시">세종시</option>
                <option value="강원도">강원도</option>
                <option value="충북">충북</option>
                <option value="충남">충남</option>
                <option value="경북">경북</option>
                <option value="경남">경남</option>
                <option value="전북">전북</option>
                <option value="전남">전남</option>
                <option value="제주도">제주도</option>
              </select>
              <ChevronDown size={13} color={Colors.textSecondary} strokeWidth={2.2} style={{ marginLeft: -14 }} />
            </View>
          ) : (
            <TouchableOpacity style={styles.locationChip}>
              <MapPin size={13} color={Colors.text} strokeWidth={2.2} />
              <Text style={styles.locationChipText}>{locationFilter || '전체 지역'}</Text>
              <ChevronDown size={13} color={Colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          )}

          <View style={styles.chipDivider} />

          <TouchableOpacity
            style={[styles.chip, levelFilter === 'pro' && styles.chipActive]}
            onPress={toggleLevelFilter}
          >
            <Text style={[styles.chipText, levelFilter === 'pro' && styles.chipTextActive]}>선출</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, matchTypeFilter === 'womens' && styles.chipActive]}
            onPress={() => toggleMatchTypeFilter('womens')}
          >
            <Text style={[styles.chipText, matchTypeFilter === 'womens' && styles.chipTextActive]}>여복</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, matchTypeFilter === 'mixed' && styles.chipActive]}
            onPress={() => toggleMatchTypeFilter('mixed')}
          >
            <Text style={[styles.chipText, matchTypeFilter === 'mixed' && styles.chipTextActive]}>혼복</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, timeFilter === 'today' && styles.chipActive]}
            onPress={toggleTimeFilter}
          >
            <Text style={[styles.chipText, timeFilter === 'today' && styles.chipTextActive]}>오늘</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, recruitingFilter && styles.chipActive]}
            onPress={toggleRecruitingFilter}
          >
            <Text style={[styles.chipText, recruitingFilter && styles.chipTextActive]}>모집중</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sort 모달 */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
          <View style={styles.sortModalContainer}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>정렬</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={22} color={Colors.textSecondary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptions}>
              <TouchableOpacity style={styles.sortOption} onPress={() => handleSortSelect('popular')}>
                <Text style={[styles.sortOptionText, sortBy === 'popular' && styles.sortOptionTextActive]}>인기순</Text>
                {sortBy === 'popular' && <Check size={20} color={Colors.primary} strokeWidth={2.6} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.sortOption} onPress={() => handleSortSelect('time')}>
                <Text style={[styles.sortOptionText, sortBy === 'time' && styles.sortOptionTextActive]}>시간순</Text>
                {sortBy === 'time' && <Check size={20} color={Colors.primary} strokeWidth={2.6} />}
              </TouchableOpacity>

              <TouchableOpacity style={styles.sortOption} onPress={() => handleSortSelect('ntrp')}>
                <Text style={[styles.sortOptionText, sortBy === 'ntrp' && styles.sortOptionTextActive]}>NTRP순</Text>
                {sortBy === 'ntrp' && <Check size={20} color={Colors.primary} strokeWidth={2.6} />}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 매치 목록 */}
      <ScrollView
        style={styles.matchList}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* 결과 카운트 + 현재 정렬 */}
        {!isLoadingMatches && (
          <View style={styles.resultBar}>
            <Text style={styles.resultCount}>
              총 <Text style={styles.resultCountStrong}>{displayMatches.length}</Text>개 매치
            </Text>
            <TouchableOpacity style={styles.sortLabelBtn} onPress={() => setShowSortModal(true)}>
              <ArrowUpDown size={12} color={Colors.textSecondary} strokeWidth={2.4} />
              <Text style={styles.sortLabelText}>{sortLabel}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoadingMatches ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>매치를 불러오는 중...</Text>
          </View>
        ) : (
          displayMatches
            .filter(match =>
              searchQuery === '' ||
              match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (match.location && match.location.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .filter(match => {
              let passes = true;
              if (levelFilter === 'pro') passes = passes && match.seller.careerType === '선수';
              if (matchTypeFilter === 'womens') passes = passes && match.matchType === '여복';
              else if (matchTypeFilter === 'mixed') passes = passes && match.matchType === '혼복';
              if (timeFilter === 'today') passes = passes && isToday(match.date);
              if (recruitingFilter) passes = passes && !match.isClosed;
              if (locationFilter) passes = passes && match.location.includes(locationFilter);
              return passes;
            })
            .sort((a, b) => {
              if (sortBy === 'popular') return b.applicationsCount - a.applicationsCount;
              else if (sortBy === 'time') return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
              else if (sortBy === 'ntrp') return b.ntrpRequirement.max - a.ntrpRequirement.max;
              return 0;
            })
            .map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onPress={() => router.push(`/match/${match.id}`)}
              />
            ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 헤더
  header: {
    backgroundColor: Colors.bg,
    borderBottomWidth: 0,
  },
  headerContent: {
    paddingVertical: Spacing.md,
  },
  brandWrap: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.8,
  },
  titleDot: {
    color: Colors.accentDark,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBtnActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primarySoft,
  },

  // 데모 컨트롤 (dev)
  demoControls: {
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  devBadge: {
    backgroundColor: Colors.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  devBadgeText: {
    fontFamily: Fonts.display,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 1,
  },
  demoTitle: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  demoButtons: {
    flexDirection: 'row',
  },
  demoButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  adminDemoButton: {
    backgroundColor: Colors.dangerSoft,
    borderColor: Colors.dangerSoft,
  },
  adminDemoButtonText: {
    color: Colors.danger,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: Colors.dangerSoft,
    borderColor: Colors.dangerSoft,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    fontFamily: Fonts.regular,
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 11,
  },

  // 검색바
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bg,
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'web' ? 10 : 10,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  filterIconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 칩 행
  chipsRow: {
    backgroundColor: Colors.bg,
    paddingBottom: Spacing.md,
  },
  chipsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 6,
    alignItems: 'center',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationChipText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  chipDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },

  // Sort 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 21, 17, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    width: '82%',
    maxWidth: 380,
    padding: Spacing.xxl,
    ...Shadow.lg,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sortModalTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  sortOptions: {
    gap: 2,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  sortOptionText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // 매치 리스트
  matchList: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  resultBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  resultCount: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resultCountStrong: {
    color: Colors.text,
    fontWeight: '800',
  },
  sortLabelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sortLabelText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});