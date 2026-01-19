import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, ArrowLeft } from 'lucide-react-native';
import { mockUsers } from '../../data/mockData';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 4;

export default function PlayersListScreen() {
  const router = useRouter();
  
  // 카테고리별 플레이어 필터링
  const hotPlayers = mockUsers
    .filter(u => u.viewCount > 50)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 8);
  
  const proPlayers = mockUsers
    .filter(u => u.careerType === '선수')
    .slice(0, 8);
  
  const topPlayers = mockUsers
    .filter(u => u.ntrp >= 4.5)
    .slice(0, 8);

  const renderPlayerItem = (player: typeof mockUsers[0]) => {
    const isHot = player.viewCount > 50;
    
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
        {player.profileImage ? (
          <Image source={{ uri: player.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <User size={24} color="#9ca3af" />
          </View>
        )}
        <Text style={styles.playerName} numberOfLines={1}>
          {player.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, players: typeof mockUsers) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {players.map(renderPlayerItem)}
      </View>
    </View>
  );

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
        {renderSection('요즘 핫한 테니스 플레이어', hotPlayers)}
        {renderSection('선출의 차원이 다른 테니스', proPlayers)}
        {renderSection('전국구 무림 고수', topPlayers)}
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