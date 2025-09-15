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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, TrendingUp, Shield } from 'lucide-react-native';
import { Database } from 'lucide-react-native';
import { MatchCard } from '../../components/MatchCard';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';

export default function HomeScreen() {
  const { user, login, logout } = useAuth();
  const { isAdmin, adminLogin } = useAdmin();
  const { matches: displayMatches, isLoadingMatches } = useMatches();
  const safeStyles = useSafeStyles();
  const mounted = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'female' | 'time' | 'ntrp'>('popular');
  const [showFemaleOnly, setShowFemaleOnly] = useState(false);

  // Track component mount status
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleQuickLogin = async (userIdentifier: string) => {
    try {
      const result = await login(userIdentifier, 'demo123');
      if (result.success) {
        Alert.alert('로그인 성공', `${userIdentifier}로 로그인되었습니다.`);
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
      // 관리자가 아닌 경우 로그인 유도
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
    // 간단한 데모 관리자 로그인
    const result = await adminLogin('admin@demo.com', 'admin123');
    if (result.success) {
      Alert.alert('관리자 로그인 성공', '관리자 권한이 활성화되었습니다.');
    } else {
      Alert.alert('로그인 실패', result.error || '관리자 로그인에 실패했습니다.');
    }
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
            
            {/* 관리자 로그인했을 때만 Supabase 테스트 버튼 표시 */}
            {isAdmin && (
              <TouchableOpacity 
                style={styles.supabaseTestIcon}
                onPress={() => router.push('/supabase-test')}
              >
                <Database size={20} color="#3b82f6" />
              </TouchableOpacity>
            )}
            
            {/* 관리자 로그인했을 때만 관리자(실드) 버튼 표시 */}
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

      {/* 개발 모드에서만 표시되는 데모 컨트롤 */}
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

      {/* Preview 빌드에서만 표시되는 관리자 로그인 버튼 */}
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

      {/* 검색 및 필터 */}
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
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* 정렬 및 필터 옵션 */}
      <View style={styles.sortContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'popular', label: '인기순' },
            { key: 'female', label: '여성 매치' },
            { key: 'time', label: '시간순' },
            { key: 'ntrp', label: 'NTRP순' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortBy === option.key && styles.sortButtonActive
              ]}
              onPress={() => setSortBy(option.key as any)}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === option.key && styles.sortButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 매치 목록 */}
      <ScrollView style={styles.matchList} showsVerticalScrollIndicator={false}>
        {isLoadingMatches ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>매치를 불러오는 중...</Text>
          </View>
        ) : (
          displayMatches
            .filter(match => 
              searchQuery === '' || 
              match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              match.venue.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .filter(match => !showFemaleOnly || match.targetGender === '여성')
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
    color: '#111827',
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
  dynamicPriceIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  sortContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#ec4899',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  sortButtonTextActive: {
    color: '#fff',
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