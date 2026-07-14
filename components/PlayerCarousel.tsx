import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { Colors, Type, Radius, IconStroke } from '../constants/theme';

const AVATAR_SIZE = 30;
const OVERLAP = -8; // 아바타를 살짝 겹쳐서 "스택" 느낌

export function PlayerCarousel() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

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

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.avatarWrap, index > 0 && { marginLeft: OVERLAP }]}>
      {item.profile_image ? (
        <Image source={{ uri: item.profile_image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <User size={14} color={Colors.textTertiary} strokeWidth={IconStroke} />
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.hotLabel}>Hot</Text>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }

  if (players.length === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.75}
      onPress={() => router.push('/players')}
    >
      <Text style={styles.hotLabel}>Hot</Text>

      <FlatList
        ref={flatListRef}
        data={players}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        getItemLayout={(data, index) => ({
          length: AVATAR_SIZE + OVERLAP,
          offset: (AVATAR_SIZE + OVERLAP) * index,
          index,
        })}
        onScrollToIndexFailed={info => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 500);
        }}
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
    gap: 12,
    backgroundColor: Colors.surface,
  },
  hotLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: Colors.accent,
  },
  listContent: {
    alignItems: 'center',
  },
  avatarWrap: {
    // 겹치는 아바타: 흰 링으로 분리감
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
