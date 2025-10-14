// app/(tabs)/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, TrendingUp, Shield, Database, User, LogIn, Bell, ArrowUpDown, X, Check } from 'lucide-react-native';
import { MatchCard } from '../../components/MatchCard';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';

type FilterType = 'pro' | 'womens' | 'mixed' | 'today';

export default function HomeScreen() {
  const { user, login, logout } = useAuth();
  const { isAdmin, adminLogin } = useAdmin();
  const { matches: displayMatches, isLoadingMatches } = useMatches();
  const safeStyles = useSafeStyles();
  const mounted = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'time' | 'ntrp'>('popular');
  const [selectedFilters, setSelectedFilters] = useState<FilterType[]>([]); // 배열로 변경
  
  // 스크롤 감지 & 모달 상태
  const [showSortButton, setShowSortButton] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Track component mount status
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleQuickLogin = async (userIdentifier: string) => {
    try {
      const { mockUsers } = await import('../../data/mockData');
      const targetUser = mockUsers.find(u => u.name === userIdentifier);
      
      if (!targetUser) {
        Alert.alert('로그인 실패', '사용자를 찾을 수 없습니다.');
        return;
      }
      
      const result = await login(targetUser.email, 'demo123');
      if (result.success) {
        Alert.alert('로그인 성공', `${targetUser.name}(${targetUser.email})로 로그인되었습니다.`);
      } else {
        Alert.alert('로그인 실패', result.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('퀵 로그인 오류:', error);
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    }
  };

  const handleAdminPress = () => {
    if (isAdmin) {
      router.push('/(admin)/dashboard');
    } else {
      Alert.alert(
        '관리자 로그인',
        '관리자 기능에 접근하려면 로그인이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인', onPress: () => router.push('/admin-login') }
        ]
      );
    }
  };

  const handleAdminLogin = async () => {
    const result = await adminLogin('hcgkhlee@gmail.com', 'demo123');
    if (result.success) {
      Alert.alert('관리자 로그인 성공', '관리자 권한이 활성화되었습니다.');
    } else {
      Alert.alert('로그인 실패', result.error || '관리자 로그인에 실패했습니다.');
    }
  };

  // 스크롤 핸들러
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowSortButton(offsetY > 50);
  };

  // Sort 선택 핸들러
  const handleSortSelect = (sort: 'popular' | 'time' | 'ntrp') => {
    setSortBy(sort);
    setShowSortModal(false);
  };

  // 필터 토글 핸들러
  const toggleFilter = (filter: FilterType) => {
    setSelectedFilters(prev => {
      if (prev.includes(filter)) {
        // 이미 선택되어 있으면 제거
        return prev.filter(f => f !== filter);
      } else {
        // 선택되어 있지 않으면 추가
        return [...prev, filter];
      }
    });
  };

  // 오늘 날짜 확인
  const isToday = (dateString: string) => {
    const today = new Date();
    const matchDate = new Date(dateString);
    return today.toDateString() === matchDate.toDateString();
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
      {__DEV__ && (
        <View style={styles.demoControls}>
          <Text style={styles.demoTitle}>
            🎮 데모 컨트롤 {user ? `(${user.name}님 로그인됨)` : '(로그인 안됨)'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.demoButtons}>
            {!user ? (
              <>
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
                <TouchableOpacity 
                  style={[styles.demoButton, styles.adminDemoButton]}
                  onPress={handleAdminLogin}
                >
                  <Text style={styles.adminDemoButtonText}>관리자 로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#f59e0b' }}
                  onPress={async () => {
                    try {
                      const { SupabaseDebug } = await import('../../utils/supabaseDebug');
                      
                      const simpleResult = await SupabaseDebug.simpleCheck('hcgkhlee@gmail.com');
                      console.log('🔍 간단한 체크:', simpleResult);
                      
                      if (simpleResult.canLogin) {
                        Alert.alert('디버그 결과', `✅ 로그인 가능!\n프로필: ${simpleResult.hasProfile ? '있음' : '없음'}`);
                        return;
                      }
                      
                      const detailResult = await SupabaseDebug.debugUserStatus('hcgkhlee@gmail.com');
                      console.log('🔍 상세 디버그:', detailResult);
                      
                      if (detailResult.error) {
                        Alert.alert('디버그 실패', detailResult.error);
                        return;
                      }
                      
                      let message = `=== 계정 상태 ===\n`;
                      message += `이메일: ${detailResult.authUser?.email || '없음'}\n`;
                      message += `이메일 확인: ${detailResult.authUser?.emailConfirmed ? '✅' : '❌'}\n`;
                      message += `프로필: ${detailResult.profile?.exists ? '✅' : '❌'}\n`;
                      message += `로그인 테스트: ${detailResult.loginTest?.success ? '✅' : '❌'}\n`;
                      if (detailResult.loginTest?.error) {
                        message += `로그인 오류: ${detailResult.loginTest.error}`;
                      }
                      
                      Alert.alert('디버그 결과', message);
                      
                    } catch (error) {
                      console.error('디버그 버튼 오류:', error);
                      Alert.alert('오류', `디버깅 실패: ${error}`);
                    }
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>🔍 디버그</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={[styles.demoButton, styles.logoutButton]}
                onPress={logout}
              >
                <Text style={styles.logoutButtonText}>로그아웃</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {!__DEV__ && !isAdmin && (
        <View style={styles.previewAdminSection}>
          <TouchableOpacity 
            style={styles.previewAdminButton}
            onPress={handleAdminLogin}
          >
            <Shield size={16} color="#dc2626" />
            <Text style={styles.previewAdminText}>관리자 로그인</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 검색창 + Sort 버튼 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="매치 검색"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* 스크롤하면 나타나는 Sort 버튼 */}
        {showSortButton ? (
          <TouchableOpacity 
            style={styles.sortIconButton}
            onPress={() => setShowSortModal(true)}
          >
            <ArrowUpDown size={18} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.filterIconButton}>
            <Filter size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* 필터 칩들 (전체 제거, 중복 선택 가능) */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.chip,
              selectedFilters.includes('pro') && styles.chipActive
            ]}
            onPress={() => toggleFilter('pro')}
          >
            <Text style={[
              styles.chipText,
              selectedFilters.includes('pro') && styles.chipTextActive
            ]}>
              선수
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              selectedFilters.includes('womens') && styles.chipActive
            ]}
            onPress={() => toggleFilter('womens')}
          >
            <Text style={[
              styles.chipText,
              selectedFilters.includes('womens') && styles.chipTextActive
            ]}>
              여복
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              selectedFilters.includes('mixed') && styles.chipActive
            ]}
            onPress={() => toggleFilter('mixed')}
          >
            <Text style={[
              styles.chipText,
              selectedFilters.includes('mixed') && styles.chipTextActive
            ]}>
              혼복
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              selectedFilters.includes('today') && styles.chipActive
            ]}
            onPress={() => toggleFilter('today')}
          >
            <Text style={[
              styles.chipText,
              selectedFilters.includes('today') && styles.chipTextActive
            ]}>
              오늘
            </Text>
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
                <Text style={[
                  styles.sortOptionText,
                  sortBy === 'popular' && styles.sortOptionTextActive
                ]}>
                  인기순
                </Text>
                {sortBy === 'popular' && (
                  <Check size={20} color="#ec4899" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortSelect('time')}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === 'time' && styles.sortOptionTextActive
                ]}>
                  시간순
                </Text>
                {sortBy === 'time' && (
                  <Check size={20} color="#ec4899" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortSelect('ntrp')}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === 'ntrp' && styles.sortOptionTextActive
                ]}>
                  NTRP순
                </Text>
                {sortBy === 'ntrp' && (
                  <Check size={20} color="#ec4899" />
                )}
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
      >
        {isLoadingMatches ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>매치를 불러오는 중...</Text>
          </View>
        ) : (
          displayMatches
            // 검색 필터
            .filter(match => 
              searchQuery === '' || 
              match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              match.venue.toLowerCase().includes(searchQuery.toLowerCase())
            )
            // 중복 필터 로직 (OR 조건)
            .filter(match => {
              // 선택된 필터가 없으면 모든 매치 표시
              if (selectedFilters.length === 0) return true;
              
              // 선택된 필터 중 하나라도 만족하면 표시
              return selectedFilters.some(filter => {
                if (filter === 'pro') return match.ntrpRange.min >= 4.0;
                if (filter === 'womens') return match.matchType === '여복';
                if (filter === 'mixed') return match.matchType === '혼복';
                if (filter === 'today') return isToday(match.date);
                return false;
              });
            })
            // 정렬
            .sort((a, b) => {
              if (sortBy === 'popular') {
                return b.applicationsCount - a.applicationsCount;
              } else if (sortBy === 'time') {
                return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
              } else if (sortBy === 'ntrp') {
                return b.ntrpRange.max - a.ntrpRange.max;
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
    color: '#ec4899',
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
  previewAdminSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  previewAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  previewAdminText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  demoControls: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  demoButtons: {
    flexDirection: 'row',
  },
  demoButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  adminDemoButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626',
  },
  adminDemoButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  sortIconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ec4899',
  },
  chipsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  // Sort 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    padding: 20,
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
    color: '#1f2937',
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
    color: '#6b7280',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#ec4899',
    fontWeight: '600',
  },
  matchList: {
    flex: 1,
    backgroundColor: '#f9fafb',
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