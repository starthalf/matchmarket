// components/PopularityGauge.tsx
//
// 인기 리워드 게이지 카드.
//  - 바 하나를 5단계로 나눠서, 도달한 단계까지 채운다.
//  - 각 단계 아래에 지급액을 표시하고, 통과한 단계는 ✓ 표시.
//  - "단계를 넘으면 광고 수익이 정산됩니다" 안내 포함.
//  - 매달 리셋되므로 기간(7월)과 남은 일수를 함께 표기.
//
// 사용법 (earnings.tsx):
//   import { PopularityGauge } from '../../components/PopularityGauge';
//   {currentUser && <PopularityGauge sellerId={currentUser.id} />}

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import {
  PopularityManager,
  RewardSnapshot,
  REWARD_TIERS,
  getHostGrade,
} from '../utils/popularityManager';
import { Colors, Radius, Hairline, IconStroke } from '../constants/theme';

interface Props {
  sellerId: string;
}

export function PopularityGauge({ sellerId }: Props) {
  const [loading, setLoading] = useState(true);
  const [snap, setSnap] = useState<RewardSnapshot | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const now = new Date();
      try {
        const s = await PopularityManager.getSnapshot(
          sellerId,
          now.getFullYear(),
          now.getMonth() + 1
        );
        if (alive) setSnap(s);
      } catch (e) {
        console.error('인기 게이지 조회 오류:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sellerId]);

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }

  if (!snap) return null;

  const { me, nextTier, toNextScore, estimatedReward, prorateRatio } = snap;
  const now = new Date();
  const monthLabel = `${now.getMonth() + 1}월`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - now.getDate();
  const grade = getHostGrade(me.completedMatches);

  /** 각 단계 칸의 채움 비율(0~1) 계산 */
  const fillOf = (idx: number): number => {
    const tier = REWARD_TIERS[idx];
    const prevMin = idx === 0 ? 0 : REWARD_TIERS[idx - 1].minScore;
    if (me.score >= tier.minScore) return 1;
    if (me.score <= prevMin) return 0;
    return (me.score - prevMin) / (tier.minScore - prevMin);
  };

  return (
    <View style={styles.card}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={15} color={Colors.accent} strokeWidth={IconStroke} />
          <Text style={styles.headerTitle}>{monthLabel} 인기 리워드</Text>
        </View>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{grade}</Text>
        </View>
      </View>

      {/* 현재 점수 + 예상 지급액 */}
      <View style={styles.summary}>
        <View>
          <Text style={styles.scoreValue}>{me.score.toLocaleString()}</Text>
          <Text style={styles.scoreLabel}>인기도 · D-{daysLeft}</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.rewardValue}>
            {estimatedReward.toLocaleString()}
            <Text style={styles.rewardWon}>원</Text>
          </Text>
          <Text style={styles.rewardLabel}>
            {me.tierLevel > 0 ? `${me.tierLevel}단계 확정` : '미달'}
          </Text>
        </View>
      </View>

      {/* 5단계 세그먼트 바 */}
      <View style={styles.barRow}>
        {REWARD_TIERS.map((t, i) => {
          const fill = fillOf(i);
          return (
            <View key={t.level} style={styles.segmentWrap}>
              <View style={styles.segmentTrack}>
                {fill > 0 && (
                  <View style={[styles.segmentFill, { width: `${fill * 100}%` }]} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* 단계별 지급액 라벨 */}
      <View style={styles.labelRow}>
        {REWARD_TIERS.map(t => {
          const passed = me.tierLevel >= t.level;
          return (
            <View key={t.level} style={styles.labelCell}>
              {passed ? (
                <View style={styles.passedRow}>
                  <Check size={9} color={Colors.success} strokeWidth={3} />
                  <Text style={styles.labelPassed}>
                    {(t.reward / 1000).toLocaleString()}천
                  </Text>
                </View>
              ) : (
                <Text style={styles.labelPending}>
                  {(t.reward / 1000).toLocaleString()}천
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* 안내 문구 */}
      <View style={styles.notice}>
        {nextTier ? (
          <Text style={styles.noticeText}>
            <Text style={styles.noticeStrong}>{toNextScore.toLocaleString()}</Text> 더 모으면{' '}
            <Text style={styles.noticeStrong}>
              {nextTier.reward.toLocaleString()}원
            </Text>{' '}
            광고수익 획득!
          </Text>
        ) : (
          <Text style={styles.noticeText}>최고 단계 달성! 광고수익이 정산됩니다</Text>
        )}
      </View>

      {/* 삭감 안내 */}
      {prorateRatio < 1 && (
        <Text style={styles.prorateText}>
          이번 달 재원에 따라 지급액이 조정될 수 있습니다
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.text,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentSoft,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Colors.accent,
  },

  summary: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 14,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: Colors.text,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: Colors.accent,
  },
  rewardWon: {
    fontSize: 12,
    fontWeight: '700',
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
    marginTop: 1,
  },

  // 5단계 바
  barRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 6,
  },
  segmentWrap: {
    flex: 1,
  },
  segmentTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },

  labelRow: {
    flexDirection: 'row',
    gap: 3,
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
  },
  passedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  labelPassed: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: -0.1,
    color: Colors.success,
  },
  labelPending: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
  },

  notice: {
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.2,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noticeStrong: {
    fontWeight: '700',
    color: Colors.accent,
  },

  prorateText: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
  },
});
