import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Shield, Award, MapPin, Instagram, Youtube, Star } from 'lucide-react-native';
import { mockUsers, mockMatches } from '../../data/mockData';
import { MatchCard } from '../../components/MatchCard';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = mockUsers.find(u => u.id === id);
  
  // 이 플레이어가 판매 중인 매치 조회
  const playerMatches = mockMatches.filter(m => m.sellerId === id && !m.isClosed);

  if (!user) return <View><Text>User not found</Text></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: user.profileImage }} style={styles.heroImage} blurRadius={10} />
          <View style={styles.heroOverlay} />
          
          <View style={styles.profileSection}>
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>
              {user.careerType === '선수' ? 'PRO PLAYER' : 'INFLUENCER'} · NTRP {user.ntrp}
            </Text>
          </View>
        </View>

        {/* 배지 & 스탯 섹션 */}
        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.viewCount}</Text>
              <Text style={styles.statLabel}>조회수</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.likeCount}</Text>
              <Text style={styles.statLabel}>좋아요</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.avgRating}</Text>
              <Text style={styles.statLabel}>평점</Text>
            </View>
          </View>

          {/* 유저 입력 배지 (Index/Career) */}
          <View style={styles.badgeSection}>
            <Text style={styles.sectionTitle}>주요 경력</Text>
            <View style={styles.badges}>
              {user.careerType === '선수' && (
                <View style={[styles.badge, { backgroundColor: '#eff6ff' }]}>
                  <Award size={14} color="#2563eb" />
                  <Text style={[styles.badgeText, { color: '#2563eb' }]}>전국체전 우승</Text>
                </View>
              )}
              <View style={styles.badge}>
                <Shield size={14} color="#4b5563" />
                <Text style={styles.badgeText}>레슨 경력 5년</Text>
              </View>
              <View style={styles.badge}>
                <Star size={14} color="#eab308" />
                <Text style={styles.badgeText}>베스트 파트너</Text>
              </View>
            </View>
          </View>

          {/* 판매 중인 매치 */}
          <View style={styles.matchSection}>
            <Text style={styles.sectionTitle}>진행 중인 경매 ({playerMatches.length})</Text>
            {playerMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onPress={() => router.push(`/match/${match.id}`)}
              />
            ))}
            {playerMatches.length === 0 && (
              <Text style={styles.emptyText}>현재 진행 중인 매치가 없습니다.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 280, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  profileSection: { alignItems: 'center', zIndex: 5, marginTop: 40 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff', marginBottom: 12 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  meta: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  content: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, padding: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statDivider: { width: 1, height: '80%', backgroundColor: '#e5e7eb' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  badgeSection: { marginBottom: 30 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 8, gap: 6 },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  matchSection: { gap: 16 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
});