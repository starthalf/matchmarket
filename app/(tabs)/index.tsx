import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Filter, Settings, Shield } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { MatchCard } from '../../components/MatchCard';
import { AdBottomSheet } from '../../components/AdBottomSheet';
import { AdManager } from '../../data/mockAds';
import { Ad } from '../../types/ad';
import { useSafeStyles } from '../../constants/Styles';

export default function HomeScreen() {
  const { user } = useAuth();
  const { matches, isLoadingMatches, refreshMatches } = useMatches();
  const safeStyles = useSafeStyles();
  const [refreshing, setRefreshing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);

  // 광고 표시 로직
  useEffect(() => {
    const showAdWithDelay = async () => {
      try {
        const ad = await AdManager.getAdToShow(user);
        if (ad) {
          // 조회수 증가
          AdManager.incrementViewCount(ad.id);
          
          // 2초 후 광고 표시
          setTimeout(() => {
            setCurrentAd(ad);
            setShowAd(true);
          }, 2000);
        }
      } catch (error) {
        console.error('광고 로딩 오류:', error);
      }
    };

    showAdWithDelay();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshMatches();
    setRefreshing(false);
  };

  const handleSearch = () => {
    // 검색 기능 구현 예정
    console.log('검색 기능');
  };

  const handleFilter = () => {
    // 필터 기능 구현 예정
    console.log('필터 기능');
  };

  const handleSettings = () => {
    router.push('/profile-settings');
  };

  const handleAdminAccess = () => {
    router.push('/admin');
  };

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>로그인이 필요합니다</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>MatchMarket</Text>
            <Text style={styles.headerSubtitle}>테니스 매치 마켓플레이스</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={handleSearch}>
              <Search size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleFilter}>
              <Filter size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
              <Settings size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminButton} onPress={handleAdminAccess}>
              <Shield size={16} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 매치 목록 */}
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {isLoadingMatches ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={styles.loadingText}>매치를 불러오는 중...</Text>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>등록된 매치가 없습니다</Text>
              <Text style={styles.emptyText}>첫 번째 매치를 등록해보세요!</Text>
            </View>
          ) : (
            matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* 광고 바텀시트 */}
      <AdBottomSheet
        ad={currentAd}
        visible={showAd}
        onClose={() => setShowAd(false)}
      />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  adminButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  bottomPadding: {
    height: 40,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loginPromptText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});