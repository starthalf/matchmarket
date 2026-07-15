import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, UserRound, Eye, Users, Star, Shield } from 'lucide-react-native';
import { Match } from '../types/tennis';
import { PriceDisplay } from './PriceDisplay';
import { CertificationBadge } from './CertificationBadge';
import { Colors } from '../constants/theme';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const { user } = useAuth();
  const currentTime = new Date();
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const hoursUntilMatch = Math.max(
    0,
    (matchDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60)
  );

  // 안전한 기본값 설정
  const applications = match.applications || [];

  // 더미 매치인지 확인 (더미 매치는 seller.id가 dummy_로 시작)
  const isDummyMatch =
    match.seller.id.startsWith('dummy_') || match.seller.id.startsWith('seller_');

  const handlePress = () => {
    if (match.isClosed) {
      return;
    }

    if (!user) {
      router.push('/auth/login');
      return;
    }

    router.push(`/match/${match.id}`);
  };

  const getRecruitmentStatus = () => {
    const { male, female, total } = match.expectedParticipants;

    if (male > 0 && female > 0) {
      return `남성 ${male}명, 여성 ${female}명 모집`;
    } else if (male > 0) {
      return `남성 ${male}명 모집`;
    } else if (female > 0) {
      return `여성 ${female}명 모집`;
    } else {
      return `${total}명 모집`;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, match.isClosed && styles.cardDisabled]}
      onPress={handlePress}
      activeOpacity={match.isClosed ? 1 : 0.7}
      disabled={match.isClosed}
    >
      {/* 상단 - 판매자 정보 */}
      <View style={styles.header}>
        <View style={styles.sellerInfo}>
          {match.seller.profileImage ? (
            <Image source={{ uri: match.seller.profileImage }} style={styles.sellerAvatar} />
          ) : (
            <View style={styles.sellerAvatarPlaceholder}>
              <UserRound size={20} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.sellerDetails}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName}>{match.seller.name}</Text>
              <CertificationBadge
                ntrpCert={match.seller.certification.ntrp}
                careerCert={match.seller.certification.career}
                youtubeCert={match.seller.certification.youtube}
                instagramCert={match.seller.certification.instagram}
                size="tiny"
              />
            </View>
            <View style={styles.sellerMeta}>
              <Text style={styles.sellerMetaText}>
                {match.seller.gender} · {match.seller.ageGroup} · {match.seller.careerType} · NTRP{' '}
                {match.seller.ntrp.toFixed(1)}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Star size={12} color={Colors.star} fill={Colors.star} />
              <Text style={styles.ratingText}>{match.seller.avgRating}</Text>
              {!isDummyMatch && (
                <TouchableOpacity
                  onPress={() => router.push(`/seller/${match.seller.id}/reviews`)}
                  style={styles.reviewLink}
                >
                  <Text style={styles.reviewLinkText}>리뷰 보기</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* 매치 제목 및 타입 */}
      <View style={styles.titleSection}>
        <Text style={styles.title} numberOfLines={2}>
          {match.title}
        </Text>
        <View style={styles.matchTypeBadge}>
          <Text style={styles.matchTypeText}>
            {Array.isArray(match.matchType)
              ? match.matchType.join(' · ')
              : String(match.matchType).replace(/[\[\]"\\]/g, '').trim()}
          </Text>
        </View>
      </View>

      {/* 매치 기본 정보 */}
      <View style={styles.matchInfo}>
        <View style={styles.infoRow}>
          <Clock size={14} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            {match.date.slice(5)} {match.time}~{match.endTime}
          </Text>
          <Text style={styles.separator}>·</Text>
          <MapPin size={14} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{match.court}</Text>
        </View>
      </View>

      {/* 모집 현황 - 새로운 형태 */}
      <View style={styles.recruitmentStatus}>
        <View style={styles.ntrpRequirement}>
          <Shield size={14} color={Colors.textSecondary} />
          <Text style={styles.ntrpText}>
            NTRP {match.ntrpRequirement.min.toFixed(1)}-{match.ntrpRequirement.max.toFixed(1)}
          </Text>
        </View>
        <View style={styles.recruitmentInfo}>
          <Users size={14} color={Colors.textSecondary} />
          <Text style={styles.recruitmentText}>{getRecruitmentStatus()}</Text>
        </View>
      </View>

      {/* 하단 - 가격 및 액션 */}
      <View style={styles.footer}>
        {/* 조회수 */}
        <View style={styles.viewCount}>
          <Eye size={12} color={Colors.textTertiary} />
          <Text style={styles.viewText}>{match.seller.viewCount}</Text>
        </View>

        <View style={styles.priceSection}>
          <PriceDisplay
            currentPrice={match.currentPrice}
            basePrice={match.basePrice}
            maxPrice={match.maxPrice}
            hoursUntilMatch={hoursUntilMatch}
            viewCount={match.seller.viewCount}
            applicationsCount={applications.length}
            expectedParticipants={match.expectedParticipants.total}
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

      {/* 마감 시 화이트 페이드 효과 */}
      {match.isClosed && <View style={styles.fadeOverlay} pointerEvents="none" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    // 그림자: 웹에서는 boxShadow로 분기 (원본의 무거운 그림자 대신 은은하게)
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(24,24,27,0.05)' } as any,
      default: {
        shadowColor: '#18181B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sellerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
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
    letterSpacing: -0.3,
    color: Colors.text,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.star,
    letterSpacing: -0.2,
  },
  reviewLink: {
    marginLeft: 4,
  },
  reviewLinkText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
    textDecorationLine: 'underline',
    letterSpacing: -0.2,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  matchTypeBadge: {
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  matchTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: -0.2,
  },
  matchInfo: {
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  separator: {
    fontSize: 12,
    color: Colors.borderStrong,
    marginHorizontal: 2,
  },
  recruitmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ntrpRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ntrpText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  recruitmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recruitmentText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  applicationText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 12,
    color: Colors.textTertiary,
    letterSpacing: -0.2,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  fadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    zIndex: 1,
  },
  closedBadge: {
    backgroundColor: Colors.inkOverlay,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(24,24,27,0.15)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  closedBadgeText: {
    color: Colors.textOnInk,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardDisabled: {
    opacity: 0.65,
  },
});
