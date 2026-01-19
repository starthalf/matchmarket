import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 4;

export default function PlayersListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [proPlayers, setProPlayers] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [hotPlayerIds, setHotPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    fetchPlayers();
  }, []);

const fetchPlayers = async () => {
  try {
    // 1. player_profiles 조회
    const { data: players, error } = await supabase
      .from('player_profiles')
      .select('*')
      .order('view_count', { ascending: false });

    if (error) throw error;

    if (players && players.length > 0) {
      // 2. user_id 목록 추출
      const userIds = players.map(p => p.user_id).filter(Boolean);
      
      // 3. users 테이블에서 추가 정보 조회
      let usersMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, certification_career, ntrp')
          .in('id', userIds);
        
        console.log('usersData:', usersData);
        
        if (usersData) {
          usersData.forEach(u => {
            usersMap[u.id] = u;
          });
        }
      }

      // 4. 플레이어에 유저 정보 병합
      const playersWithUser = players.map(p => ({
        ...p,
        user: usersMap[p.user_id] || null
      }));

      // 5. 조회수 Top 3 (Hot 표시용)
      const top3Ids = playersWithUser.slice(0, 3).map(p => p.id);
      setHotPlayerIds(top3Ids);

      // 6. 카테고리별 분류
      setAllPlayers(playersWithUser);

      // 선출 인증된 사용자 (certification_career === 'verified')
      const pros = playersWithUser.filter(p => 
        p.user?.certification_career === 'verified'
      );
      setProPlayers(pros);

      // 선출이 아니면서 NTRP 4.0 이상
      const tops = playersWithUser.filter(p => 
        p.user?.certification_career !== 'verified' && 
        (p.user?.ntrp || 0) >= 4.0
      );
      setTopPlayers(tops);
      
      console.log('전체:', playersWithUser.length, '선출:', pros.length, '고수:', tops.length);
    }
  } catch (error) {
    console.error('플레이어 목록 조회 오류:', error);
  } finally {
    setLoading(false);
  }
};

  const renderPlayerItem = (player: any) => {
    const isHot = hotPlayerIds.includes(player.id);
    
    return (
      <TouchableOpacity
        key={player.id}
        style={styles.playerItem}
        onPress={() => router.push(`/player/${player.id}`)}
      >
        {isHot && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotText}>Hot</Text>
          </View>
        )}
        {player.profile_image ? (
          <Image 
            source={{ uri: player.profile_image }} 
            style={[
              styles.avatar,
              isHot && styles.avatarHot
            ]} 
          />
        ) : (
          <View style={[
            styles.avatar, 
            styles.avatarPlaceholder,
            isHot && styles.avatarHot
          ]}>
            <User size={24} color="#9ca3af" />
          </View>
        )}
        <Text style={styles.playerName} numberOfLines={1}>
          {player.nickname}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, players: any[]) => {
    if (players.length === 0) return null;
    
    const displayPlayers = players.slice(0, 8);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {players.length > 8 && (
            <TouchableOpacity>
              <Text style={styles.seeAllText}>전체보기</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.grid}>
          {displayPlayers.map(renderPlayerItem)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea4c89" />
      </SafeAreaView>
    );
  }

  const hasNoPlayers = allPlayers.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Stars</Text>
          <Text style={styles.subtitle}>핫한 플레이어들을 확인하세요</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <User size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {hasNoPlayers ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 등록된 플레이어가 없습니다</Text>
            <Text style={styles.emptySubText}>첫 번째 스타가 되어보세요!</Text>
          </View>
        ) : (
          <>
                        {renderSection('선출의 차원이 다른 테니스', proPlayers)}
            {renderSection('전국구 무림 고수', topPlayers)}
            {renderSection('요즘 핫한 테니스 플레이어', allPlayers)}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 내 페이지 만들기 FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/player/create')}
      >
        <Text style={styles.fabText}>내{'\n'}페이지{'\n'}만들기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  profileButton: {
    padding: 4,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#ea4c89' 
  },
  subtitle: { 
    fontSize: 13, 
    color: '#6b7280',
    marginTop: 2,
  },
  section: { 
    marginTop: 24,
    paddingHorizontal: 20 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827', 
  },
  seeAllText: {
    fontSize: 14,
    color: '#ea4c89',
    fontWeight: '600',
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12 
  },
  playerItem: { 
    width: ITEM_SIZE, 
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: ITEM_SIZE - 10,
    height: ITEM_SIZE - 10,
    borderRadius: (ITEM_SIZE - 10) / 2,
    backgroundColor: '#3b82f6',
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHot: {
    borderWidth: 3,
    borderColor: '#ea4c89',
  },
  playerName: { 
    fontSize: 12, 
    color: '#374151', 
    marginTop: 6,
    textAlign: 'center',
  },
  hotBadge: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -12,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  hotText: { 
    fontSize: 10, 
    color: '#ea4c89', 
    fontWeight: '700' 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ea4c89',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: { 
    color: '#fff', 
    fontSize: 11, 
    fontWeight: '700', 
    textAlign: 'center',
    lineHeight: 14,
  },
});