// app/(tabs)/index.tsx
import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Shield, Database, User, LogIn, ArrowUpDown, X, Check, MapPin } from 'lucide-react-native';
import { MatchCard } from '../../components/MatchCard';
import { PlayerCarousel } from '../../components/PlayerCarousel';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';
import { isToday as isTodayHelper } from '../../utils/dateHelper';
import { PricingCalculator } from '../../types/tennis';

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
const [sortBy, setSortBy] = useState<'popular' | 'time' | 'ntrp'>('time');

  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [recruitingFilter, setRecruitingFilter] = useState<boolean>(false);
  const [locationFilter, setLocationFilter] = useState<string>('');
 const [matchFilter, setMatchFilter] = useState<'all' | 'hot'>('all');
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

  const handleScroll = (event: any) => {
    // scroll tracking (reserved for future use)
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
  
// 필터 변경 시 표시 개수 리셋
  useEffect(() => {
    setDisplayCount(20);
  }, [matchFilter, matchTypeFilter, levelFilter, timeFilter, recruitingFilter, locationFilter, searchQuery, sortBy]);

  const isToday = (dateString: string) => {
    return isTodayHelper(dateString);
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <View>
            <Text style={styles.title}>MatchMarket</Text>
            <Text style={styles.subtitle}>AI가 인기 높은 매치의 가격을 조절합니다 </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.headerLoginIcon}
              onPress={() => {
                if (user) {
                  router.push('/profile');
                } else {
                  router.push('/auth/login');
                }
              }}
            >
              {user ? (
                <User size={20} color="#16a34a" />
              ) : (
                <LogIn size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
            
            {isAdmin && (
              <TouchableOpacity 
                style={styles.supabaseTestIcon}
                onPress={() => router.push('/supabase-test')}
              >
                <Database size={20} color="#3b82f6" />
              </TouchableOpacity>
            )}
            
            {isAdmin && (
              <TouchableOpacity 
                style={styles.adminButton}
                onPress={handleAdminPress}
              >
                <Shield size={24} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    
      {/* 개발 모드 데모 컨트롤 */}
      {isDevelopment && (
        <View style={styles.demoControls}>
          <Text style={styles.demoTitle}>
            🎮 데모 컨트롤 {user ? `(${user.name}님 로그인됨)` : '(로그인 안됨)'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.demoButtons}>
            {!user ? (
              <>
                <TouchableOpacity 
                  style={[styles.demoButton, styles.adminDemoButton]} 
                  onPress={() => handleQuickLogin('admin')}
                >
                  <Text style={[styles.demoButtonText, styles.adminDemoButtonText]}>🛡️ admin</Text>
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
                  isLoggingOut && styles.logoutButtonDisabled
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

     {/* 검색 + 필터 + 지역 한 줄 */}
      <View style={styles.filterRow}>
        {/* 지역 아이콘 */}
        <TouchableOpacity
          style={[styles.iconButton, locationFilter ? styles.iconButtonActive : null]}
          onPress={() => setShowLocationModal(true)}
        >
          <MapPin size={20} color={locationFilter ? '#ea4c89' : '#0d0c22'} />
        </TouchableOpacity>

        {/* 필터 칩들 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
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

        {/* 검색 아이콘 */}
        <TouchableOpacity
          style={[styles.iconButton, showSearchBar && styles.iconButtonActive]}
          onPress={() => setShowSearchBar(prev => !prev)}
        >
          <Search size={20} color={showSearchBar ? '#ea4c89' : '#0d0c22'} />
        </TouchableOpacity>

        {/* 필터/정렬 아이콘 */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowSortModal(true)}
        >
          <Filter size={20} color="#0d0c22" />
        </TouchableOpacity>
      </View>

      {/* 검색바 (토글) */}
      {showSearchBar && (
        <View style={styles.searchBarExpanded}>
          <Search size={16} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="매치 검색..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 지역 선택 모달 */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
          <View style={styles.sortModalContainer}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>지역 선택</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {[
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
              ].map((loc) => (
                <TouchableOpacity
                  key={loc.value}
                  style={styles.sortOption}
                  onPress={() => {
                    setLocationFilter(loc.value);
                    setShowLocationModal(false);
                  }}
                >
                  <Text style={[styles.sortOptionText, locationFilter === loc.value && styles.sortOptionTextActive]}>
                    {loc.label}
                  </Text>
                  {locationFilter === loc.value && <Check size={20} color="#ea4c89" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort 모달 */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModalContainer}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>정렬</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortSelect('popular')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'popular' && styles.sortOptionTextActive]}>
                  인기순
                </Text>
                {sortBy === 'popular' && <Check size={20} color="#ea4c89" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortSelect('time')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'time' && styles.sortOptionTextActive]}>
                  시간순
                </Text>
                {sortBy === 'time' && <Check size={20} color="#ea4c89" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortSelect('ntrp')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'ntrp' && styles.sortOptionTextActive]}>
                  NTRP순
                </Text>
                {sortBy === 'ntrp' && <Check size={20} color="#ea4c89" />}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

   {/* 매치 목록 */}
      {isLoadingMatches ? (
        <View style={[styles.matchList, styles.loadingContainer]}>
          <Text style={styles.loadingText}>매치를 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.matchList}
          data={
            displayMatches
              .filter(match => 
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
                  return new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
                } else if (sortBy === 'time') {
                  return new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
                } else if (sortBy === 'ntrp') {
                  const diff = b.ntrpRequirement.max - a.ntrpRequirement.max;
                  if (diff !== 0) return diff;
                  return new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime();
                }
                return 0;
              })
              .filter(match => {
                const matchDateTime = new Date(`${match.date}T${match.time}`);
                const hoursUntilMatch = Math.max(0, (matchDateTime.getTime() - Date.now()) / (1000 * 60 * 60));
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
              })
              .slice(0, displayCount)
          }
          keyExtractor={(item) => item.id}
          renderItem={({ item: match }) => (
            <MatchCard 
              match={match}
              onPress={() => router.push(`/match/${match.id}`)}
            />
          )}
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
              tintColor="#ea4c89"
              colors={['#ea4c89']}
            />
          }
          onEndReached={() => {
            setDisplayCount(prev => prev + 20);
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <View style={styles.bottomPadding} />
          }
          ListEmptyComponent={
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>매치가 없습니다</Text>
            </View>
          }
        />
      )}

      {/* 플로팅 매치 필터 */}
      <View style={styles.floatingFilter}>
        <TouchableOpacity
          style={[styles.floatingTab, matchFilter === 'all' && styles.floatingTabActive]}
          onPress={() => setMatchFilter('all')}
        >
<Text style={[styles.floatingTabText, matchFilter === 'all' && styles.floatingTabTextActive]}>일반매치</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floatingTab, matchFilter === 'hot' && styles.floatingTabActive]}
          onPress={() => setMatchFilter('hot')}
        >
          <Text style={[styles.floatingTabText, matchFilter === 'hot' && styles.floatingTabTextActive]}>🔥 HOT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ea4c89',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLoginIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  supabaseTestIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  adminButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  demoControls: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  demoButtons: {
    flexDirection: 'row',
  },
  demoButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  demoButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },
  adminDemoButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  adminDemoButtonText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 11,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f7f4',
    gap: 6,
  },
  chipsScroll: {
    flex: 1,
  },
  chipsContent: {
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    padding: 6,
  },
  iconButtonActive: {},
  searchBarExpanded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    shadowColor: '#0d0c22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0d0c22',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 0,
    shadowColor: '#0d0c22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: '#0d0c22',
    shadowColor: '#0d0c22',
    shadowOpacity: 0.3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6d7a',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '80%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#0d0c22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d0c22',
  },
  sortOptions: {
    gap: 4,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortOptionText: {
    fontSize: 16,
    color: '#6e6d7a',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#ea4c89',
    fontWeight: '600',
  },
  matchList: {
    flex: 1,
    backgroundColor: '#f8f7f4',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  bottomPadding: {
    height: 100,
  },
  floatingFilter: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  floatingTabActive: {
    backgroundColor: '#0d0c22',
  },
  floatingTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  floatingTabTextActive: {
    color: '#ffffff',
  },
});