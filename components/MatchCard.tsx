// components/MatchCard.tsx - 기존 MatchCard를 업데이트

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { MapPin, Clock, Eye, Crown, Zap, User, Users, UserCheck, Star, UserRound } from 'lucide-react-native';
import { Match, MatchTypeHelper } from '../types/tennis'; // 🔥 MatchTypeHelper 추가
import { CertificationBadge } from './CertificationBadge';
import { PriceDisplay } from './PriceDisplay';
import { useAuth } from '../contexts/AuthContext';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const { user } = useAuth();
  const hoursUntilMatch = Math.max(0, 
    (new Date(`${match.date}T${match.time}`).getTime() - new Date().getTime()) / (1000 * 60 * 60)
  );
  
  const { expectedParticipants, currentApplicants } = match;
  const isCompleted = currentApplicants.total >= expectedParticipants.total;

  const handlePress = () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    router.push(`/match/${match.id}`);
  };

  // 성별 아이콘 및 스타일
  const getGenderStyle = (gender: string) => {
    return gender === '여성' ? styles.femaleIcon : styles.maleIcon;
  };

  // 나이대 아이콘
  const getAgeIcon = (ageGroup: string) => {
    const ageMap: { [key: string]: string } = {
      '20대': '2️⃣',
      '30대': '3️⃣', 
      '40대': '4️⃣',
      '50대+': '5️⃣'
    };
    return ageMap[ageGroup] || '🎾';
  };

  // 🔥 매치 타입별 배지 스타일
  const getMatchTypeBadgeStyle = (matchType: Match['matchType']) => {
    switch (matchType) {
      case '단식':
        return { backgroundColor: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' };
      case '남복':
        return { backgroundColor: '#dbeafe', borderColor: '#3b82f6', color: '#1e40af' };
      case '여복':
        return { backgroundColor: '#fce7f3', borderColor: '#ec4899', color: '#be185d' };
      case '혼복':
        return { backgroundColor: '#dcfce7', borderColor: '#22c55e', color: '#15803d' };
      default:
        return { backgroundColor: '#f3f4f6', borderColor: '#9ca3af', color: '#374151' };
    }
  };

  // 🔥 참가자 표시 방식 결정
  const renderParticipantInfo = () => {
    if (match.matchType === '단식') {
      return (
        <View style={styles.genderItem}>
          <UserRound size={14} color="#3b82f6" />
          <Text style={styles.genderCount}>
            {currentApplicants.total}/{expectedParticipants.total}명
          </Text>
        </View>
      );
    } else if (match.matchType === '남복') {
      return (
        <View style={styles.genderItem}>
          <UserRound size={14} color="#3b82f6" />
          <Text style={styles.genderCount}>
            남 {currentApplicants.male}/{expectedParticipants.male}명
          </Text>
        </View>
      );
    } else if (match.matchType === '여복') {
      return (
        <View style={styles.genderItem}>
          <UserRound size={14} color="#ec4899" />
          <Text style={styles.genderCount}>
            여 {currentApplicants.female}/{expectedParticipants.female}명
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.genderText}>
          {expectedParticipants.male > 0 && (
            <View style={styles.genderItem}>
              <UserRound size={14} color="#3b82f6" />
              <Text style={styles.genderCount}>
                남 {currentApplicants.male}/{expectedParticipants.male}
              </Text>
            </View>
          )}
          
          {expectedParticipants.male > 0 && expectedParticipants.female > 0 && (
            <Text style={styles.genderSeparator}>·</Text>
          )}
          
          {expectedParticipants.female > 0 && (
            <View style={styles.genderItem}>
              <UserRound size={14} color="#ec4899" />
              <Text style={styles.genderCount}>
                여 {currentApplicants.female}/{expectedParticipants.female}
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  const badgeStyle = getMatchTypeBadgeStyle(match.matchType);

  // 모집 진행률 계산
  const isHotMatch = match.waitingApplicants > 5;
  const isPremiumSeller = match.seller.certification.ntrp === 'verified' || match.seller.certification.career === 'verified';

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isPremiumSeller && styles.premiumCard,
        match.isClosed && styles.closedCard
      ]} 
      onPress={match.isClosed ? undefined : handlePress}
      disabled={match.isClosed}
    >
      {/* 상단 헤더 - 판매자 정보 */}
      <View style={styles.header}>
        <View style={styles.sellerSection}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {match.seller.profileImage ? (
                <Image 
                  source={{ uri: match.seller.profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <Text style={{ color: '#9ca3af', fontSize: 16, fontWeight: '600' }}>
                    {match.seller.name.charAt(0)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.sellerMainInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{match.seller.name}</Text>
                <Text style={styles.ntrpBadge}>
                  NTRP {match.seller.ntrp.toFixed(1)}
                </Text>
                {isPremiumSeller && <CertificationBadge />}
              </View>
              
              <View style={styles.sellerTags}>
                <View style={[styles.genderTag, getGenderStyle(match.seller.gender)]}>
                  <Text style={{ fontSize: 10, fontWeight: '800' }}>
                    {match.seller.gender === '남성' ? '♂️' : '♀️'}
                  </Text>
                </View>
                <View style={styles.ageTag}>
                  <Text style={styles.ageIcon}>
                    {getAgeIcon(match.seller.ageGroup)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sellerStats}>
            <View style={styles.ratingRow}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{match.seller.avgRating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {isHotMatch && (
            <View style={styles.hotBadge}>
              <Zap size={12} color="#ffffff" fill="#ffffff" />
              <Text style={styles.hotText}>HOT</Text>
            </View>
          )}
        </View>
      </View>

      {/* 매치 제목 및 타입 배지 */}
      <View style={styles.titleSection}>
        <Text style={styles.title} numberOfLines={2}>{match.title}</Text>
        
        {/* 🔥 매치 타입 배지 추가 */}
        <View style={[
          styles.matchTypeBadge,
          {
            backgroundColor: badgeStyle.backgroundColor,
            borderColor: badgeStyle.borderColor,
          }
        ]}>
          <Text style={[styles.matchTypeText, { color: badgeStyle.color }]}>
            {MatchTypeHelper.getIcon(match.matchType)} {MatchTypeHelper.getDisplayName(match.matchType)}
          </Text>
        </View>
      </View>
      
      {/* 매치 정보 */}
      <View style={styles.matchInfo}>
        <View style={styles.infoRow}>
          <Clock size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {match.date.slice(5)} {match.time}~{match.endTime}
          </Text>
          <Text style={styles.separator}>·</Text>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.infoText}>{match.court}</Text>
        </View>
      </View>

      {/* 모집 현황 */}
      <View style={styles.recruitmentStatus}>
        <View style={styles.ntrpRequirement}>
          <Text style={styles.ntrpText}>
            NTRP {match.ntrpRequirement.min.toFixed(1)}-{match.ntrpRequirement.max.toFixed(1)}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.recruitmentInfo}>
            {/* 🔥 새로운 참가자 표시 방식 */}
            {renderParticipantInfo()}
            
            {match.waitingApplicants > 0 && (
              <>
                <Text style={styles.genderSeparator}>·</Text>
                <Text style={styles.waitingText}>대기 {match.waitingApplicants}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* 가격 정보 */}
      <View style={styles.footer}>
        <View style={styles.priceSection}>
          <PriceDisplay
            currentPrice={match.currentPrice}
            initialPrice={match.initialPrice}
            variant="card"
          />
        </View>
        <View style={styles.viewCount}>
          <Eye size={14} color="#9ca3af" />
          <Text style={styles.viewText}>{match.expectedViews}</Text>
        </View>
      </View>

      {/* 매치 마감 오버레이 */}
      {match.isClosed && (
        <View style={styles.closedOverlay}>
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>매치 마감</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  sellerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sellerInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  sellerDetails: {
    flex: 1,
  },

  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },

  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  sellerRating: {
    fontSize: 12,
    color: '#6b7280',
    alignItems: 'center',
  },

  sellerNtrp: {
    fontSize: 12,
    color: '#6b7280',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  hotText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },

  priceChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  priceChangeText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '600',
  },

  titleSection: {
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
    marginBottom: 8,
  },

  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  matchTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },

  matchTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  matchInfo: {
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  infoText: {
    fontSize: 14,
    color: '#6b7280',
  },

  separator: {
    fontSize: 14,
    color: '#d1d5db',
    marginHorizontal: 4,
  },

  recruitmentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  ntrpRequirement: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  ntrpText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  recruitmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  genderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  participantText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  genderSeparator: {
    fontSize: 13,
    color: '#9ca3af',
    marginHorizontal: 4,
  },

  waitingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  waitingText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
  },

  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  currentPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },

  adBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },

  adText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '600',
  },
});