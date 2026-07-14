import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, UserRound, Eye, Star, ChevronRight } from 'lucide-react-native';
import { Match } from '../types/tennis';
import { PriceDisplay } from './PriceDisplay';
import { CertificationBadge } from './CertificationBadge';
import { Colors, Radius, Type, Hairline, IconStroke } from '../constants/theme';

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

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

  const getRecruitmentStatus = () => {
    const { male, female, total } = match.expectedParticipants;
    if (male > 0 && female > 0) return `남 ${male} · 여 ${female}`;
    if (male > 0) return `남 ${male}명`;
    if (female > 0) return `여 ${female}명`;
    return `${total}명`;
  };

  const matchTypeLabel = Array.isArray(match.matchType)
    ? match.matchType.join('·')
    : String(match.matchType).replace(/[\[\]"\\]/g, '').trim();

  // 05-15 → 05.15 (수)
  const dateObj = new Date(match.date);
  const [, mm, dd] = match.date.split('-');
  const weekday = WEEKDAYS[dateObj.getDay()] ?? '';

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
              <UserRound size={16} color={Colors.textTertiary} strokeWidth={IconStroke} />
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
            <Text style={styles.hostMeta} numberOfLines={1}>
              {match.seller.careerType} · NTRP {match.seller.ntrp.toFixed(1)} · ★{' '}
              {match.seller.avgRating}
            </Text>
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

        {/* 제목 — 카드의 주인공 */}
        <Text style={styles.title} numberOfLines={2}>
          {match.title}
        </Text>

        {/* 일시 · 장소 */}
        <View style={styles.infoBlock}>
          <View style={styles.infoLine}>
            <Clock size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
            <Text style={styles.infoStrong}>
              {mm}.{dd}
              <Text style={styles.infoWeak}> ({weekday})</Text>
            </Text>
            <Text style={styles.infoStrong}>
              {match.time}–{match.endTime}
            </Text>
          </View>
          <View style={styles.infoLine}>
            <MapPin size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
            <Text style={styles.infoWeak} numberOfLines={1}>
              {match.court}
            </Text>
          </View>
        </View>

        {/* 조건 */}
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              NTRP {match.ntrpRequirement.min.toFixed(1)}–{match.ntrpRequirement.max.toFixed(1)}
            </Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{getRecruitmentStatus()} 모집</Text>
          </View>
        </View>
      </View>

      {/* ══════════ 하단 바 (배경색으로 구역 분리) ══════════ */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.viewRow}>
            <Eye size={13} color={Colors.textTertiary} strokeWidth={IconStroke} />
            <Text style={styles.viewText}>{match.seller.viewCount.toLocaleString()}</Text>
          </View>

          {!isDummyMatch && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => router.push(`/seller/${match.seller.id}/reviews`)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.reviewText}>리뷰</Text>
              <ChevronRight size={11} color={Colors.textTertiary} strokeWidth={2} />
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
    overflow: 'hidden', // 하단 바가 카드 라운딩을 따라가게
  },
  /** 마감: 카드 전체를 흐리게. 정중앙 검은 알약 같은 건 두지 않는다. */
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
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostText: {
    flex: 1,
    gap: 1,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostName: {
    fontSize: 13,
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

  // ── 제목: 카드의 주인공 ──
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 24,
    color: Colors.text,
    marginTop: 12,
  },

  // ── 일시/장소 ──
  infoBlock: {
    marginTop: 10,
    gap: 5,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoStrong: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: Colors.textSecondary,
  },
  infoWeak: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.2,
    color: Colors.textTertiary,
    flexShrink: 1,
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

  // ── 하단 바: 배경색으로 구역을 만든다 (그림자 없이 구조 만들기) ──
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
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  reviewText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
  },
});
