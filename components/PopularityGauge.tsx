// components/PopularityGauge.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
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

  // 탭에 진입할 때마다 조회한다.
  // 마운트 직후에는 Supabase 세션 복원이 안 끝나 요청이 걸리는 경우가 있어,
  // 실패하면 잠시 뒤 자동으로 한 번 더 시도한다.
  useFocusEffect(
    useCallback(() => {
      let alive = true;

      const fetchSnapshot = async (attempt: number): Promise<void> => {
        const now = new Date();
        try {
          const s = await withTimeout(
            PopularityManager.getSnapshot(sellerId, now.getFullYear(), now.getMonth() + 1),
            6000,
            '게이지 조회'
          );
          if (!alive) return;
          setSnap(s);
          setErrMsg(null);
          setLoading(false);
        } catch (e: any) {
          if (!alive) return;

          if (attempt < 2) {
            // 세션이 준비될 시간을 주고 재시도
            console.warn('📊 게이지 재시도:', attempt + 1);
            setTimeout(() => {
              if (alive) fetchSnapshot(attempt + 1);
            }, 1200);
            return;
          }

          console.error('📊 게이지 오류:', e);
          setErrMsg(e?.message || '불러오지 못했습니다');
          setLoading(false);
        }
      };

      setLoading(true);
      setErrMsg(null);
      fetchSnapshot(0);

      return () => {
        alive = false;
      };
    }, [sellerId])
  );
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
        <Text style={styles.errText}>광고수익을 불러오지 못했습니다</Text>
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
          <Text style={styles.headerTitle}>{monthLabel} 광고수익</Text>
        </View>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>{grade}</Text>
        </View>
      </View>

     <View style={styles.summary}>
        <View style={styles.summaryRight}>
          <Text style={styles.rewardValue}>
            {estimatedReward.toLocaleString()}
            <Text style={styles.rewardWon}>원</Text>
          </Text>
          <Text style={styles.rewardLabel}>
            {me.tierLevel > 0 ? `Lv${me.tierLevel} 수익 지급` : '지급기준 미달'}
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

      {/* 단계 번호 */}
      <View style={styles.tierRow}>
        {REWARD_TIERS.map(t => {
          const isCurrent = me.tierLevel === t.level;
          const isPassed = me.tierLevel > t.level;
          return (
            <View key={t.level} style={styles.tierCell}>
              <Text
                style={[
                  styles.tierText,
                  isPassed && styles.tierPassed,
                  isCurrent && styles.tierCurrent,
                ]}
              >
                {t.level}단계
              </Text>
            </View>
          );
        })}
      </View>

      

      <Text style={styles.footerNote}>광고수익은 다음 달 초에 정산 지급됩니다</Text>

      {prorateRatio < 1 && (
        <Text style={styles.prorateText}>
          재원에 따라 지급액이 조정될 수 있습니다
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
    justifyContent: 'flex-end',
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

  tierRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 6,
  },
  tierCell: {
    flex: 1,
    alignItems: 'center',
  },
  tierText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
  },
  tierPassed: {
    color: Colors.accent,
  },
  tierCurrent: {
    fontWeight: '700',
    color: Colors.accent,
  },

  

  footerNote: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },

  prorateText: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: -0.1,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
});