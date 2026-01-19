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
  const [hotPlayers, setHotPlayers] = useState<any[]>([]);
  const [proPlayers, setProPlayers] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      // 핫한 플레이어 (조회수/요청 많은 순)
      const { data: hot } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('is_published', true)
        .order('match_request_count', { ascending: false })
        .limit(8);

      // 최근 가입 플레이어
      const { data: recent } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(8);

      // 고수 플레이어 (평균 스킬 높은 순)
      const { data: top } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(8);

      setHotPlayers(hot || []);
      setProPlayers(recent || []);
      setTopPlayers(top || []);
    } catch (error) {
      console.error('플레이어 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerItem = (player: any) => {
    const isHot = player.match_request_count > 10;
    
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
          <Image source={{ uri: player.profile_image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
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
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.grid}>
          {players.map(renderPlayerItem)}
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

  const hasNoPlayers = hotPlayers.length === 0 && proPlayers.length === 0 && topPlayers.length === 0;

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
            {renderSection('요즘 핫한 테니스 플레이어', hotPlayers)}
            {renderSection('새로 등록된 플레이어', proPlayers)}
            {renderSection('인기 플레이어', topPlayers)}
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
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 16 
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