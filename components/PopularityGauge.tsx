// components/PopularityGauge.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import {
  PopularityManager,
  RewardSnapshot,
  REWARD_TIERS,
  getHostGrade,
} from '../utils/popularityManager';
import { Colors, Radius, IconStroke } from '../constants/theme';

interface Props {
  sellerId: string;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 시간 초과 (${ms / 1000}초)`)), ms)
    ),
  ]);
}

export function PopularityGauge({ sellerId }: Props) {
  const [loading, setLoading] = useState(true);
  const [snap, setSnap] = useState<RewardSnapshot | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErrMsg(null);
      const now = new Date();

      try {
        console.log('📊 [1] 게이지 조회 시작 sellerId:', sellerId);

        const s = await withTimeout(
          PopularityManager.getSnapshot(sellerId, now.getFullYear(), now.getMonth() + 1),
          8000,
          '게이지 조회'
        );

        console.log('📊 [2] 게이지 결과:', s);
        if (alive) setSnap(s);
      } catch (e: any) {
        console.error('📊 [X] 게이지 오류:', e);
        if (alive) setErrMsg(e?.message || '불러오지 못했습니다');
      } finally {
        console.log('📊 [3] 로딩 종료');
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

  if (errMsg) {
    return (
      <View style={[styles.card, styles.center]}>
        <Text style={styles.errText}>인기 리워드를 불러오지 못했습니다</Text>
        <Text style={styles.errDetail}>{errMsg}</Text>
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

  const fillOf = (idx: number): number => {
    const tier = REWARD_TIERS[idx];
    const prevMin = idx === 0 ? 0 : REWARD_TIERS[idx - 1].minScore;
    if (me.score >= tier.minScore) return 1;
    if (me.score <= prevMin) return 0;
    return (me.score - prevMin) / (tier.minScore - prevMin);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={15} color={Colors.accent} strokeWidth={IconStroke} />
          <Text style={styles.headerTitle}>{monthLabel} 인기 리워드</Text>
        </View>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{grade}</Text>
        </View>
      </View>

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

      <View style={styles.labelRow}>
        {REWARD_TIERS.map(t => {
          const passed = me.tierLevel >= t.level;
          return (
            <View key={t.level} style={styles.labelCell}>
              {passed ? (
                <View style={styles.passedRow}>
                  <Check size={9} color={Colors.success} strokeWidth={3} />
                  <Text style={styles.labelPassed}>{t.reward / 1000}천</Text>
                </View>
              ) : (
                <Text style={styles.labelPending}>{t.reward / 1000}천</Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.notice}>
        {nextTier ? (
          <Text style={styles.noticeText}>
            <Text style={styles.noticeStrong}>{toNextScore.toLocaleString()}</Text> 더 모으면{' '}
            <Text style={styles.noticeStrong}>{nextTier.reward.toLocaleString()}원</Text> 광고수익
            획득!
          </Text>
        ) : (
          <Text style={styles.noticeText}>최고 단계 달성! 광고수익이 정산됩니다</Text>
        )}
      </View>

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
  errText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: Colors.textSecondary,
  },
  errDetail: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
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