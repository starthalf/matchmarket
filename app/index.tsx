import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Star, MapPin, Clock, Users, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();

  // 이미 로그인되어 있으면 메인으로
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const handleStart = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 히어로 섹션 */}
        <View style={styles.hero}>
          <Text style={styles.logo}>MatchMarket</Text>
          
          <Text style={styles.title}>
            인기 높은 매치에 참여하세요{'\n'}
            당신이 호스트라면, 인기가 높을수록{'\n'}
            수익이 늘어나요
          </Text>

          {/* 샘플 매치 카드 */}
          <View style={styles.previewCard}>
            <View style={styles.matchCard}>
              <View style={styles.sellerSection}>
                <View style={styles.profileImage}>
                  <Text style={styles.profileInitial}>A</Text>
                </View>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>aesthetic.vibes</Text>
                    <View style={styles.badges}>
                      <CheckCircle size={12} color="#10b981" fill="#10b981" />
                      <CheckCircle size={12} color="#3b82f6" fill="#3b82f6" />
                      <CheckCircle size={12} color="#ec4899" fill="#ec4899" />
                    </View>
                  </View>
                  <Text style={styles.sellerMeta}>여성 · 20대 · 선수 · NTRP 4.2</Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text style={styles.rating}>4.7</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.matchTitle}>여선출과 2:2 복식, 고수환영</Text>

              <View style={styles.matchDetails}>
                <View style={styles.detailRow}>
                  <Clock size={14} color="#6b7280" />
                  <Text style={styles.detailText}>11-01 19:00~22:00</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={styles.detailText}>양재테니스장</Text>
                </View>
              </View>

              <View style={styles.priceSection}>
                <Text style={styles.price}>26,700원</Text>
                <View style={styles.priceChange}>
                  <TrendingUp size={12} color="#ef4444" />
                  <Text style={styles.priceChangeText}>7%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* CTA 버튼 */}
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>시작하기</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  hero: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ec4899',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    lineHeight: 28,
    marginBottom: 32,
  },
  previewCard: {
    width: '100%',
    marginBottom: 32,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sellerSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  sellerMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  matchDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ef4444',
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    gap: 8,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});