// components/MatchCard.tsx - 완전한 코드

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { Match, MatchTypeHelper } from '../types/tennis';
import {
  Clock,
  MapPin,
  Users,
  UserRound,
  Zap,
  Star,
  TrendingUp,
} from 'lucide-react-native';

interface MatchCardProps {
  match: Match;
  variant?: 'default' | 'compact';
}

export default function MatchCard({ match, variant = 'default' }: MatchCardProps) {
  // 핫 매치 여부 (대기자가 많거나 가격이 많이 올랐을 때)
  const isHotMatch = match.waitingApplicants > 5 || 
                    (match.currentPrice > match.initialPrice * 1.3);
  
  // 매치 카드 클릭
  const handlePress = () => {
    router.push(`/match/${match.id}`);
  };

  // 가격 변화 표시
  const priceChange = match.currentPrice - match.initialPrice;
  const priceChangePercent = Math.round((priceChange / match.initialPrice) * 100);

  // 매치 타입별 배지 스타일
  const getMatchTypeBadgeStyle = (matchType: Match['matchType']) => {
    switch (matchType) {
      case '단식':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          color: '#92400e'
        };
      case '남복':
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#3b82f6', 
          color: '#1e40af'
        };
      case '여복':
        return {
          backgroundColor: '#fce7f3',
          borderColor: '#ec4899',
          color: '#be185d'
        };
      case '혼복':
        return {
          backgroundColor: '#dcfce7',
          borderColor: '#22c55e',
          color: '#15803d'
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
          borderColor: '#9ca3af',
          color: '#374151'
        };
    }
  };

  const badgeStyle = getMatchTypeBadgeStyle(match.matchType);

  // 참가자 표시 방식 결정
  const renderParticipantInfo = () => {
    if (match.matchType === '단식') {
      // 단식은 전체 인원만 표시
      return (
        <View style={styles.participantInfo}>
          <UserRound size={14} color="#3b82f6" />
          <Text style={styles.participantText}>
            {match.currentApplicants.total}/{match.expectedParticipants.total}명
          </Text>
        </View>
      );
    } else if (match.matchType === '남복') {
      // 남복은 남성 인원만 표시
      return (
        <View style={styles.participantInfo}>
          <UserRound size={14} color="#3b82f6" />
          <Text style={styles.participantText}>
            남 {match.currentApplicants.male}/{match.expectedParticipants.male}명
          </Text>
        </View>
      );
    } else if (match.matchType === '여복') {
      // 여복은 여성 인원만 표시
      return (
        <View style={styles.participantInfo}>
          <UserRound size={14} color="#ec4899" />
          <Text style={styles.participantText}>
            여 {match.currentApplicants.female}/{match.expectedParticipants.female}명
          </Text>
        </View>
      );
    } else {
      // 혼복은 남녀 구분해서 표시
      return (
        <View style={styles.participantInfo}>
          {match.expectedParticipants.male > 0 && (
            <View style={styles.genderItem}>
              <UserRound size={14} color="#3b82f6" />
              <Text style={styles.participantText}>
                남 {match.currentApplicants.male}/{match.expectedParticipants.male}
              </Text>
            </View>
          )}
          
          {match.expectedParticipants.male > 0 && match.expectedParticipants.female > 0 && (
            <Text style={styles.genderSeparator}>·</Text>
          )}
          
          {match.expectedParticipants.female > 0 && (
            <View style={styles.genderItem}>
              <UserRound size={14} color="#ec4899" />
              <Text style={styles.participantText}>
                여 {match.currentApplicants.female}/{match.expectedParticipants.female}
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.card}>
        {/* 헤더 - 판매자 정보와 배지들 */}
        <View style={styles.header}>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>
                {match.seller.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{match.seller.name}</Text>
              <View style={styles.sellerMeta}>
                <Text style={styles.sellerRating}>
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                  {match.seller.avgRating.toFixed(1)}
                </Text>
                <Text style={styles.sellerNtrp}>
                  NTRP {match.seller.ntrp.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* 핫 매치 배지 */}
            {isHotMatch && (
              <View style={styles.hotBadge}>
                <Zap size={12} color="#ffffff" fill="#ffffff" />
                <Text style={styles.hotText}>HOT</Text>
              </View>
            )}
            
            {/* 가격 변화 표시 */}
            {priceChange > 0 && (
              <View style={styles.priceChangeBadge}>
                <TrendingUp size={12} color="#dc2626" />
                <Text style={styles.priceChangeText}>+{priceChangePercent}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* 매치 제목 및 타입 */}
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={2}>{match.title}</Text>
          <View style={styles.badgeContainer}>
            {/* 매치 타입 배지 */}
            <View style={[
              styles.matchTypeBadge,
              {
                backgroundColor: badgeStyle.backgroundColor,
                borderColor: badgeStyle.borderColor,
              }
            ]}>
              <Text style={[
                styles.matchTypeText,
                { color: badgeStyle.color }
              ]}>
                {MatchTypeHelper.getIcon(match.matchType)} {MatchTypeHelper.getDisplayName(match.matchType)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* 매치 기본 정보 */}
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
          
          <View style={styles.recruitmentInfo}>
            {renderParticipantInfo()}
            
            {/* 대기자 수 */}
            {match.waitingApplicants > 0 && (
              <>
                <Text style={styles.genderSeparator}>·</Text>
                <View style={styles.waitingInfo}>
                  <Clock size={12} color="#f59e0b" />
                  <Text style={styles.waitingText}>대기 {match.waitingApplicants}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 가격 정보 */}
        <View style={styles.priceSection}>
          <View style={styles.priceInfo}>
            <Text style={styles.currentPrice}>
              {match.currentPrice.toLocaleString()}원
            </Text>
            {priceChange > 0 && (
              <Text style={styles.originalPrice}>
                {match.initialPrice.toLocaleString()}원
              </Text>
            )}
          </View>
          
          {match.adEnabled && (
            <View style={styles.adBadge}>
              <Text style={styles.adText}>광고</Text>
            </View>
          )}
        </View>
      </View>
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