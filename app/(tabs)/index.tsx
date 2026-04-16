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
import { Search, Filter, Shield, Database, User, LogIn, ArrowUpDown, X, Check, MapPin } from 'lucide-react-native';
import { MatchCard } from '../../components/MatchCard';
import { PlayerCarousel } from '../../components/PlayerCarousel';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';
import { isToday as isTodayHelper } from '../../utils/dateHelper';

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
  const [isLoggingOut, setIsLoggingOut] = useState(false); // ✅ 로그아웃 중복 클릭 방지

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleQuickLogin = async (userIdentifier: string) => {
    try {
      // admin 예외처리
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

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <View>
            <Text style={styles.title}>MatchMarket</Text>
            <Text style={styles.subtitle}>인기가 높은 매치에 참여하세요</Text>
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
                  // ✅ 중복 클릭 방지 - 이미 로그아웃 중이면 무시
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

      {/* 검색창 + Sort 버튼 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="매치 검색"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {showSortButton ? (
          <TouchableOpacity 
            style={styles.sortIconButton}
            onPress={() => setShowSortModal(true)}
          >
            <ArrowUpDown size={16} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.filterIconButton}>
            <Filter size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* 필터 칩들 */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.chip, levelFilter === 'pro' && styles.chipActive]}
            onPress={toggleLevelFilter}
          >
            <Text style={[styles.chipText, levelFilter === 'pro' && styles.chipTextActive]}>
              선출
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, matchTypeFilter === 'womens' && styles.chipActive]}
            onPress={() => toggleMatchTypeFilter('womens')}
          >
            <Text style={[styles.chipText, matchTypeFilter === 'womens' && styles.chipTextActive]}>
              여복
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, matchTypeFilter === 'mixed' && styles.chipActive]}
            onPress={() => toggleMatchTypeFilter('mixed')}
          >
            <Text style={[styles.chipText, matchTypeFilter === 'mixed' && styles.chipTextActive]}>
              혼복
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, timeFilter === 'today' && styles.chipActive]}
            onPress={toggleTimeFilter}
          >
            <Text style={[styles.chipText, timeFilter === 'today' && styles.chipTextActive]}>
              오늘
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.chip, recruitingFilter && styles.chipActive]}
            onPress={toggleRecruitingFilter}
          >
            <Text style={[styles.chipText, recruitingFilter && styles.chipTextActive]}>
              모집중
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 지역 필터 */}
      <View style={styles.locationFilterSection}>
        {Platform.OS === 'web' ? (
          <View style={styles.locationSelectWrapper}>
            <MapPin size={14} color="#6b7280" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={{
                flex: 1,
                padding: '0 4px',
                fontSize: '13px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#374151',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
                fontWeight: '500'
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
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.locationSelectWrapper}
            onPress={() => {/* TODO: 모바일 드롭다운 모달 */}}
          >
            <MapPin size={14} color="#6b7280" />
            <Text style={styles.locationSelectText}>
              {locationFilter || '전체 지역'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
      <ScrollView
        style={styles.matchList}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ea4c89"
            colors={['#ea4c89']}
          />
        }
      >
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
                return b.applicationsCount - a.applicationsCount;
              } else if (sortBy === 'time') {
                return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
              } else if (sortBy === 'ntrp') {
                return b.ntrpRequirement.max - a.ntrpRequirement.max;
              }
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f8f7f4',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 0,
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
  filterIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#0d0c22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sortIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0d0c22',
  },
  chipsContainer: {
    backgroundColor: '#f8f7f4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 0,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 6,
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
  locationFilterSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  locationSelectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationSelectText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
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
    height: 20,
  },
}); 