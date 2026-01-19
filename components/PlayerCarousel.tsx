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
import { Shield, Award, TrendingUp } from 'lucide-react-native';
import { mockUsers } from '../data/mockData'; // mockUsers 사용

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 40; // 화면 너비에서 여백 뺌
const CARD_HEIGHT = 140;

export function PlayerCarousel() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // 🔥 네임드/고수 필터링 (선수 출신이거나 NTRP 4.5 이상)
  const featuredPlayers = mockUsers.filter(
    u => u.careerType === '선수' || u.ntrp >= 4.5
  ).slice(0, 5); // 5명만 노출

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
    }, 3000); // 3초마다 이동

    return () => clearInterval(interval);
  }, [activeIndex]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeIndex) {
      setActiveIndex(roundIndex);
    }
  };

  const renderItem = ({ item }: { item: typeof mockUsers[0] }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={() => router.push(`/player/${item.id}`)} // 상세 페이지 이동
    >
      <View style={styles.card}>
        <View style={styles.imageContainer}>
           {/* 프로필 이미지 (없으면 플레이스홀더) */}
           {item.profileImage ? (
             <Image source={{ uri: item.profileImage }} style={styles.image} />
           ) : (
             <View style={[styles.image, { backgroundColor: '#e5e7eb' }]} />
           )}
           {/* 라이브/영상 효과 뱃지 */}
           <View style={styles.liveBadge}>
             <TrendingUp size={10} color="#fff" />
             <Text style={styles.liveText}>RISING</Text>
           </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{item.name}</Text>
            {item.careerType === '선수' && (
              <View style={styles.proBadge}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.subInfo}>
            {item.gender} · {item.ageGroup} · NTRP {item.ntrp}
          </Text>

          {/* 🔥 배지 시스템 (유저 입력 주요 경력) */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Award size={12} color="#4b5563" />
              <Text style={styles.badgeText}>
                {item.careerType === '선수' ? '선수출신 코치' : '대회 우승 다수'}
              </Text>
            </View>
            <View style={styles.badge}>
              <Shield size={12} color="#4b5563" />
              <Text style={styles.badgeText}>매너평가 4.9</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={featuredPlayers}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        style={{ flexGrow: 0 }}
      />
      
      {/* 인디케이터 (점) */}
      <View style={styles.pagination}>
        {featuredPlayers.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? '#ea4c89' : '#d1d5db' }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  cardContainer: {
    width: ITEM_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 0, // pagingEnabled 사용 시 간격 조정 필요 없음
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 10, // 카드 간 간격
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#ea4c89',
  },
  liveBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#ea4c89',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  liveText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  proBadge: {
    backgroundColor: '#111827',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  subInfo: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});