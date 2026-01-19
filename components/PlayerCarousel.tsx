import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mockUsers } from '../data/mockData';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 44;

export function PlayerCarousel() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // 🔥 네임드/고수 필터링 (선수 출신이거나 NTRP 4.5 이상)
  const featuredPlayers = mockUsers.filter(
    u => u.careerType === '선수' || u.ntrp >= 4.5
  ).slice(0, 8); // 8명까지 노출

  // ✅ 자동 슬라이드 로직
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeIndex === featuredPlayers.length - 1) {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
        setActiveIndex(0);
      } else {
        flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
        setActiveIndex(activeIndex + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, featuredPlayers.length]);

  const renderItem = ({ item, index }: { item: typeof mockUsers[0]; index: number }) => (
    <TouchableOpacity 
      style={styles.avatarContainer}
      activeOpacity={0.8}
      onPress={() => router.push(`/player/${item.id}`)}
    >
      {/* 프로필 이미지 */}
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Hot 라벨 */}
      <Text style={styles.hotLabel}>Hot</Text>
      
      {/* 썸네일 리스트 */}
      <FlatList
        ref={flatListRef}
        data={featuredPlayers}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
  },
});