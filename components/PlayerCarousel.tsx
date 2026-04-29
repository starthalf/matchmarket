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
const AVATAR_SIZE = 32;

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

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.avatarContainer}>
      {item.profile_image ? (
        <Image source={{ uri: item.profile_image }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <User size={14} color="#9ca3af" />
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.hotLabelWrap}>
          <Text style={styles.hotLabelTop}>Hot</Text>
          <Text style={styles.hotLabelBottom}>People</Text>
        </View>
        <ActivityIndicator size="small" color="#ea4c89" />
      </View>
    );
  }

  if (players.length === 0) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => router.push('/players')}
    >
      <View style={styles.hotLabelWrap}>
        <Text style={styles.hotLabelTop}>Hot</Text>
        <Text style={styles.hotLabelBottom}>People</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={players}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        getItemLayout={(data, index) => ({
          length: AVATAR_SIZE + 6,
          offset: (AVATAR_SIZE + 6) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
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
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  hotLabelWrap: {
    alignItems: 'center',
    marginRight: 10,
  },
  hotLabelTop: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea4c89',
    lineHeight: 13,
  },
  hotLabelBottom: {
    fontSize: 9,
    fontWeight: '600',
    color: '#d1d5db',
    lineHeight: 11,
  },
  listContent: {
    gap: 6,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: '#ea4c89',
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
});