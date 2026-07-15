import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, UserRound, Eye, Star, ChevronRight } from 'lucide-react-native';
import { Match } from '../types/tennis';
import { PriceDisplay } from './PriceDisplay';
import { CertificationBadge } from './CertificationBadge';
import { Colors, Radius, Hairline, IconStroke } from '../constants/theme';

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

  const applications = match.applications || [];

  const isDummyMatch =
    match.seller.id.startsWith('dummy_') || match.seller.id.startsWith('seller_');

  const handlePress = () => {
    if (match.isClosed) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push(`/match/${match.id}`);
  };

  // 원본 문구 그대로 복구: "남성 N명, 여성 N명 모집"
  const getRecruitmentStatus = () => {
    const { male, female, total } = match.expectedParticipants;
    if (male > 0 && female > 0) return `남성 ${male}명, 여성 ${female}명 모집`;
    if (male > 0) return `남성 ${male}명 모집`;
    if (female > 0) return `여성 ${female}명 모집`;
    return `${total}명 모집`;
  };

  const matchTypeLabel = Array.isArray(match.matchType)
    ? match.matchType.join(' · ')
    : String(match.matchType).replace(/[\[\]"\\]/g, '').trim();

  return (
    <TouchableOpacity
      style={[styles.card, match.isClosed && styles.cardClosed]}
      onPress={handlePress}
      activeOpacity={match.isClosed ? 1 : 0.9}
      disabled={match.isClosed}
    >
      {/* ══════════ 본문 영역 ══════════ */}
      <View style={styles.body}>
        {/* 호스트 */}
        <View style={styles.hostRow}>
          {match.seller.profileImage ? (
            <Image source={{ uri: match.seller.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <UserRound size={18} color={Colors.textTertiary} strokeWidth={IconStroke} />
            </View>
          )}

          <View style={styles.hostText}>
            <View style={styles.hostNameRow}>
              <Text style={styles.hostName} numberOfLines={1}>
                {match.seller.name}
              </Text>
              <CertificationBadge
                ntrpCert={match.seller.certification.ntrp}
                careerCert={match.seller.certification.career}
                youtubeCert={match.seller.certification.youtube}
                instagramCert={match.seller.certification.instagram}
                size="tiny"
              />
            </View>

            {/* 원본 그대로: 성별 · 연령대 · 경력 · NTRP */}
            <Text style={styles.hostMeta} numberOfLines={1}>
              {match.seller.gender} · {match.seller.ageGroup} · {match.seller.careerType} · NTRP{' '}
              {match.seller.ntrp.toFixed(1)}
            </Text>

            {/* 원본 그대로: 별점 + 리뷰 보기 */}
            <View style={styles.ratingRow}>
              <Star size={12} color={Colors.star} fill={Colors.star} strokeWidth={0} />
              <Text style={styles.ratingText}>{match.seller.avgRating}</Text>
              {!isDummyMatch && (
                <TouchableOpacity
                  onPress={() => router.push(`/seller/${match.seller.id}/reviews`)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.reviewLinkText}>리뷰 보기</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 우상단 태그: 마감이면 마감이 우선 */}
          {match.isClosed ? (
            <View style={styles.closedTag}>
              <Text style={styles.closedTagText}>마감</Text>
            </View>
          ) : (
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{matchTypeLabel}</Text>
            </View>
          )}
        </View>

        {/* 제목 */}
        <Text style={styles.title} numberOfLines={2}>
          {match.title}
        </Text>

        {/* 일시 · 장소 (원본 포맷: 05-15 18:00~20:00) */}
        <View style={styles.infoLine}>
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

        {/* 조건 */}
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              NTRP {match.ntrpRequirement.min.toFixed(1)}–{match.ntrpRequirement.max.toFixed(1)}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{getRecruitmentStatus()}</Text>
          </View>
        </View>
      </View>

      {/* ══════════ 하단 바 ══════════ */}
      <View style={styles.footer}>
        <View style={styles.viewRow}>
          <Eye size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
          {/* 원본 그대로: 콤마 없는 raw 조회수 */}
          <Text style={styles.viewText}>{match.seller.viewCount}</Text>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardClosed: {
    opacity: 0.5,
  },

  // ── 본문 ──
  body: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
  },

  hostRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostText: {
    flex: 1,
    gap: 2,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: Colors.text,
    flexShrink: 1,
  },
  hostMeta: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 15,
    color: Colors.textTertiary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: Colors.textSecondary,
  },
  reviewLinkText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
    marginLeft: 4,
  },

  typeTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    backgroundColor: Colors.surfaceAlt,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: Colors.textSecondary,
  },
  closedTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    backgroundColor: Colors.ink,
  },
  closedTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.1,
    color: Colors.textOnInk,
  },

  // ── 제목 ──
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 24,
    color: Colors.text,
    marginTop: 12,
  },

  // ── 일시/장소 ──
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.2,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.borderStrong,
    marginHorizontal: 2,
  },

  // ── 조건 태그 ──
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: Colors.textSecondary,
  },

  // ── 하단 바 ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: Colors.surfaceAlt,
    borderTopWidth: Hairline,
    borderTopColor: Colors.border,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
  },
});
