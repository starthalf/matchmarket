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
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Flame } from 'lucide-react-native';
import { mockUsers } from '../../data/mockData';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 4; // 4열 그리드

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
      <View style={styles.header}>
        <Text style={styles.title}>Stars</Text>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <User size={24} color="#374151" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>핫한 플레이어들을 확인하세요</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderSection('요즘 핫한 테니스 플레이어', hotPlayers)}
        {renderSection('선출의 차원이 다른 테니스', proPlayers)}
        {renderSection('전국구 무림 고수', topPlayers)}
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#ea4c89' },
  subtitle: { fontSize: 14, color: '#6b7280', paddingHorizontal: 20, marginBottom: 20 },
  section: { marginBottom: 30, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
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
  },
  hotText: { fontSize: 10, color: '#ea4c89', fontWeight: '700' },
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
  fabText: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
});