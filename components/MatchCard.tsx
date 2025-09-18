// components/MatchCard.tsx - HOT/AD 제거, 리뷰/인증배지 복원

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Clock, MapPin, Eye, UserRound, User, Star } from 'lucide-react-native';
import { Match } from '../types/tennis';
import { PriceDisplay } from './PriceDisplay';
import { CertificationBadge } from './CertificationBadge';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
}

export function MatchCard({ match, onPress }: MatchCardProps) {
  const now = new Date();
  const matchDate = new Date(`${match.date}T${match.time}`);
  const hoursUntilMatch = Math.max(0, (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60));

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/match/${match.id}`);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress ? onPress : handlePress}
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
                  <User size={24} color="#9ca3af" />
                </View>
              )}
            </View>
            
            <View style={styles.sellerMainInfo}>
              <View style={styles.sellerNameRow}>
                <CertificationBadge 
                  ntrpCert={match.seller.certification.ntrp}
                  careerCert={match.seller.certification.career}
                  youtubeCert={match.seller.certification.youtube}
                  instagramCert={match.seller.certification.instagram}
                  size="tiny"
                />
                <Text style={styles.sellerName} numberOfLines={1} ellipsizeMode="tail">
                  {match.seller.name}
                </Text>
                <Text style={styles.ntrpBadge}>{match.seller.ntrp.toFixed(1)}</Text>
              </View>
              
              <View style={styles.sellerStats}>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerDetailText}>
                    {match.seller.gender} · {match.seller.ageGroup} · {match.seller.careerType}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.ratingText}>{match.seller.avgRating}</Text>
                    <TouchableOpacity 
                      onPress={() => router.push(`/seller/${match.seller.id}/reviews`)}
                      style={styles.reviewLink}
                    >
                      <Text style={styles.reviewLinkText}>리뷰 보기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* HOT 배지와 AD 배지 제거됨 */}
        <View style={styles.headerRight}>
        </View>
      </View>

      {/* 매치 제목 및 타입 */}
      <View style={styles.titleSection}>
        <Text style={styles.title} numberOfLines={2}>{match.title}</Text>
        <View style={styles.matchTypeBadge}>
          <Text style={styles.matchTypeText}>{match.matchType}</Text>
        </View>
      </View>
      
      {/* 매치 기본 정보 - 두 줄로 구성 */}
      <View style={styles.matchInfo}>
        {/* 첫 번째 줄: 시간과 테니스 코트 */}
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
          <Text style={styles.recruitmentText}>
            {match.expectedParticipants.total}명 모집
          </Text>
        </View>
      </View>

      {/* 하단 - 가격 및 액션 */}
      <View style={styles.footer}>
        {/* 조회수 */}
        <View style={styles.viewCount}>
          <Eye size={12} color="#9ca3af" />
          <Text style={styles.viewText}>{match.seller.viewCount}</Text>
        </View>
        
        <View style={styles.priceSection}>
          <PriceDisplay
            currentPrice={match.currentPrice}
            basePrice={match.basePrice}
            initialPrice={match.initialPrice}
            expectedViews={match.expectedViews}
            maxPrice={match.maxPrice}
            hoursUntilMatch={hoursUntilMatch}
            viewCount={match.seller.viewCount}
            waitingApplicants={match.waitingApplicants}
            expectedWaitingApplicants={match.expectedWaitingApplicants}
            sellerGender={match.seller.gender}
            sellerNtrp={match.seller.ntrp}
            isClosed={match.isClosed}
          />
        </View>
        
      </View>
      
      {/* 마감 오버레이 */}
      {match.isClosed && (
        <View style={styles.closedOverlay}>
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>마감</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sellerSection: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerMainInfo: {
    flex: 1,
    gap: 4,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  ntrpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ec4899',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sellerStats: {
    gap: 2,
  },
  sellerDetails: {
    gap: 4,
  },
  sellerDetailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  reviewLink: {
    marginLeft: 4,
  },
  reviewLinkText: {
    fontSize: 11,
    color: '#ec4899',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  headerRight: {
    // HOT 배지와 AD 배지가 있던 자리 - 비워둠
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 22,
  },
  matchTypeBadge: {
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  matchTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ec4899',
  },
  matchInfo: {
    gap: 6,
    marginBottom: 8,
  },
  separator: {
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  recruitmentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ntrpRequirement: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  ntrpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  recruitmentInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  recruitmentText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  priceSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closedBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});