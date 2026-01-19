import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 44;

export function PlayerCarousel() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Supabase에서 플레이어 프로필 가져오기
  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*')
        .order('view_count', { ascending: false })
        .limit(8);

      if (error) throw error;
      
      if (data) {
        setPlayers(data);
      }
    } catch (error) {
      console.error('캐러셀 플레이어 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 자동 슬라이드 로직
  useEffect(() => {
    if (players.length === 0) return;

    const interval = setInterval(() => {
      if (activeIndex === players.length - 1) {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
        setActiveIndex(0);
      } else {
        flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
        setActiveIndex(activeIndex + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, players.length]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.avatarContainer}>
      {item.profile_image ? (
        <Image source={{ uri: item.profile_image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <User size={20} color="#9ca3af" />
        </View>
      )}
    </View>
  );

  // 로딩 중이거나 플레이어가 없으면 표시 안함
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.hotLabel}>Hot</Text>
        <ActivityIndicator size="small" color="#ea4c89" />
      </View>
    );
  }

  if (players.length === 0) {
    return null; // 플레이어가 없으면 캐러셀 숨김
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => router.push('/players')}
    >
      {/* Hot 라벨 */}
      <Text style={styles.hotLabel}>Hot</Text>
      
      {/* 썸네일 리스트 */}
      <FlatList
        ref={flatListRef}
        data={players}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  hotLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ea4c89',
    marginRight: 12,
  },
  listContent: {
    gap: 10,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: '#ea4c89',
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
});