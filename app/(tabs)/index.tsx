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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, TrendingUp, Shield } from 'lucide-react-native';
import { Database } from 'lucide-react-native';
import { MatchCard } from '@/components/MatchCard';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';

export default function HomeScreen() {
  const { user, login, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const { matches: displayMatches, isLoadingMatches } = useMatches();
  const mounted = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'female' | 'time' | 'ntrp'>('popular');
  const [showFemaleOnly, setShowFemaleOnly] = useState(false);
  const [localAdminToggleStatus, setLocalAdminToggleStatus] = useState(false);

  // Track component mount status
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const sortedMatches = [...displayMatches].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.waitingApplicants - a.waitingApplicants;
      case 'time':
        return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
      case 'ntrp':
        return b.seller.ntrp - a.seller.ntrp;
      default:
        return 0;
    }
  });

  const filteredMatches = sortedMatches.filter(match => {
    // 검색 필터
    const matchesSearch = match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 여성 필터
    const matchesGender = !showFemaleOnly || match.seller.gender === '여성';
    
    return matchesSearch && matchesGender;
  });

  const handleFilterPress = (filterKey: string) => {
    if (filterKey === 'female') {
      setShowFemaleOnly(!showFemaleOnly);
    } else {
      setSortBy(filterKey as any);
      setShowFemaleOnly(false); // 다른 정렬 선택 시 여성 필터 해제
    }
  };

  const isFilterActive = (filterKey: string) => {
    if (filterKey === 'female') {
      return showFemaleOnly;
    }
    return sortBy === filterKey && !showFemaleOnly;
  };

  const getFilterLabel = (filterKey: string) => {
    if (filterKey === 'female') {
      return showFemaleOnly ? '여성 ✓' : '여성';
    }
    const labels = {
      popular: '인기순',
      time: '시간순',
      ntrp: 'NTRP순',
    };
    return labels[filterKey as keyof typeof labels];
  };

  // 데모용 빠른 로그인 함수
  const handleQuickLogin = async (username: string) => {
    await login(username, '1234');
  };

  const handleAdminPress = () => {
    router.push('/(admin)/dashboard');
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
            <TouchableOpacity style={styles.dynamicPriceIcon}>
              <TrendingUp size={20} color="#16a34a" />
            </TouchableOpacity>
            {/* 관리자 로그인 시에만 Supabase 테스트 버튼 표시 */}
            {isAdmin && (
              <TouchableOpacity 
                style={styles.supabaseTestIcon}
                onPress={() => router.push('/supabase-test')}
              >
                <Database size={20} color="#3b82f6" />
              </TouchableOpacity>
            )}
            {/* 관리자 로그인 시에만 관리자 버튼 표시 */}
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

      {/* 데모용 인증 컨트롤 */}
      {/* 데모 컨트롤은 개발 모드에서만 표시 */}
      {/* 이메일 자동 채우기 기능은 제거됨 */}
      {/* 로그인 화면 자체를 건너뛰는 로직은 Expo Router의 인증 흐름에 따라 자동으로 처리됨 */}
      {__DEV__ && user && ( // 로그인된 상태에서만 데모 컨트롤 표시
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

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="매치 또는 지역 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#16a34a" />
        </TouchableOpacity>
      </View>

      <View style={styles.sortSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.sortScroll}
        >
          {[
            { key: 'popular', label: '인기순' },
            { key: 'time', label: '시간순' },
            { key: 'ntrp', label: 'NTRP순' },
            { key: 'female', label: '여성' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                isFilterActive(option.key) && styles.sortButtonActive
              ]}
              onPress={() => handleFilterPress(option.key)}
            >
              <Text style={[
                styles.sortText,
                isFilterActive(option.key) && styles.sortTextActive
              ]}>
                {getFilterLabel(option.key)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <TrendingUp size={16} color="#16a34a" />
          <Text style={styles.statText}>
            실시간 {isLoadingMatches ? '로딩중...' : `${filteredMatches.length}개 매치`}
            {showFemaleOnly && ' (여성 판매자)'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.matchList} showsVerticalScrollIndicator={false}>
        {isLoadingMatches ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>매치 데이터를 불러오는 중...</Text>
          </View>
        ) : (
        filteredMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ec4899',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dynamicPriceIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  adminButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  supabaseTestIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sortSection: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
  },
  sortScroll: {
    paddingHorizontal: 20,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  sortButtonActive: {
    backgroundColor: '#ec4899',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  sortTextActive: {
    color: '#ffffff',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
  },
  matchList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bottomPadding: {
    height: 100,
  },
  demoControls: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  demoButtons: {
    flexDirection: 'row',
  },
  demoButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});