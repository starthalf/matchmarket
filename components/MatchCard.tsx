import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock,
  MapPin,
  UserRound,
  Eye,
  Users,
  Star,
  Shield,
} from 'lucide-react-native';
import { Match } from '../types/tennis';
import { PriceDisplay } from './PriceDisplay';
import { CertificationBadge } from './CertificationBadge';
import { Colors, Radius, Type, Hairline, IconStroke } from '../constants/theme';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
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
      return `남 ${male} · 여 ${female}`;
    } else if (male > 0) {
      return `남 ${male}명`;
    } else if (female > 0) {
      return `여 ${female}명`;
    } else {
      return `${total}명`;
    }
  };

  const matchTypeLabel = Array.isArray(match.matchType)
    ? match.matchType.join(' · ')
    : String(match.matchType).replace(/[\[\]"\\]/g, '').trim();

  return (
    <TouchableOpacity
      style={[styles.card, match.isClosed && styles.cardDisabled]}
      onPress={handlePress}
      activeOpacity={match.isClosed ? 1 : 0.85}
      disabled={match.isClosed}
    >
      {/* ── 상단: 판매자 ── */}
      <View style={styles.header}>
        {match.seller.profileImage ? (
          <Image source={{ uri: match.seller.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <UserRound size={18} color={Colors.textTertiary} strokeWidth={IconStroke} />
          </View>
        )}

        <View style={styles.headerBody}>
          <View style={styles.nameRow}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {match.seller.name}
            </Text>
            <CertificationBadge
              ntrpCert={match.seller.certification.ntrp}
              careerCert={match.seller.certification.career}
              youtubeCert={match.seller.certification.youtube}
              instagramCert={match.seller.certification.instagram}
              size="tiny"
            />
            <View style={styles.ratingInline}>
              <Star
                size={11}
                color={Colors.star}
                fill={Colors.star}
                strokeWidth={0}
              />
              <Text style={styles.ratingText}>{match.seller.avgRating}</Text>
            </View>
          </View>

          <Text style={styles.sellerMeta} numberOfLines={1}>
            {match.seller.gender} · {match.seller.ageGroup} · {match.seller.careerType} · NTRP{' '}
            {match.seller.ntrp.toFixed(1)}
          </Text>
        </View>

        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{matchTypeLabel}</Text>
        </View>
      </View>

      {/* ── 제목 ── */}
      <Text style={styles.title} numberOfLines={2}>
        {match.title}
      </Text>

      {/* ── 일시 · 장소 ── */}
      <View style={styles.infoRow}>
        <Clock size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
        <Text style={styles.infoText}>
          {match.date.slice(5)} {match.time}~{match.endTime}
        </Text>
        <View style={styles.dot} />
        <MapPin size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
        <Text style={styles.infoText} numberOfLines={1}>
          {match.court}
        </Text>
      </View>

      {/* ── 조건 pill ── */}
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Shield size={12} color={Colors.textSecondary} strokeWidth={IconStroke} />
          <Text style={styles.pillText}>
            NTRP {match.ntrpRequirement.min.toFixed(1)}–{match.ntrpRequirement.max.toFixed(1)}
          </Text>
        </View>
        <View style={styles.pill}>
          <Users size={12} color={Colors.textSecondary} strokeWidth={IconStroke} />
          <Text style={styles.pillText}>{getRecruitmentStatus()} 모집</Text>
        </View>
      </View>

      {/* ── 구분선 ── */}
      <View style={styles.divider} />

      {/* ── 하단: 조회수 / 가격 ── */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.viewCount}>
            <Eye size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
            <Text style={styles.viewText}>{match.seller.viewCount}</Text>
          </View>
          {!isDummyMatch && (
            <TouchableOpacity
              onPress={() => router.push(`/seller/${match.seller.id}/reviews`)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.reviewLinkText}>리뷰</Text>
            </TouchableOpacity>
          )}
        </View>

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

      {/* ── 마감 오버레이 ── */}
      {match.isClosed && (
        <>
          <View style={styles.fadeOverlay} pointerEvents="none" />
          <View style={styles.closedOverlay} pointerEvents="none">
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>마감</Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    // ⚠️ shadow 없음. border 하나로 끝낸다. (이중 테두리가 촌스러움의 주범)
  },
  cardDisabled: {
    backgroundColor: Colors.bg,
  },

  // ── header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sellerName: {
    ...Type.bodyStrong,
    color: Colors.text,
    flexShrink: 1,
  },
  ratingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...Type.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sellerMeta: {
    ...Type.caption,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentSoft,
  },
  typeBadgeText: {
    ...Type.micro,
    color: Colors.accent,
  },

  // ── title ──
  title: {
    ...Type.h2,
    color: Colors.text,
    marginBottom: 10,
  },

  // ── info ──
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  infoText: {
    ...Type.label,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.borderStrong,
    marginHorizontal: 3,
  },

  // ── pills ──
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  pillText: {
    ...Type.caption,
    color: Colors.textSecondary,
  },

  divider: {
    height: Hairline,
    backgroundColor: Colors.divider,
    marginTop: 14,
    marginBottom: 12,
  },

  // ── footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 2,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    ...Type.caption,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  reviewLinkText: {
    ...Type.caption,
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
  },

  // ── closed ──
  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250, 250, 250, 0.72)',
    borderRadius: Radius.lg,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.inkOverlay,
  },
  closedBadgeText: {
    ...Type.caption,
    fontWeight: '700',
    color: Colors.textOnInk,
    letterSpacing: 0.5,
  },
});
