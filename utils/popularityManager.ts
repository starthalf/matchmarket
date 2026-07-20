// utils/popularityManager.ts
//
// 인기 리워드 엔진 (월별 집계 → 단계 gate → 정산 → 리셋)
// ------------------------------------------------------------------
// 개념
//  - 광고/브랜드 수익을 "풀"로 모아, 판매자 인기도에 따라 나눠준다.
//  - 개별 광고 실적과 판매자를 연결하지 않는다 (구글 무효 트래픽 밴 회피).
//  - 인기도는 매달 집계 후 리셋. 단계(gate)를 넘으면 그 단계 리워드 지급.
//  - 지급은 "도달한 최고 단계만" (중복 지급 없음).
//  - 총지급액이 풀을 넘으면 전원 비례 삭감(pro-rate) → 절대 적자 안 남.
//
// 초기 재원: 다이나믹 프라이싱 초과분의 15% (= 플랫폼 수수료)를 통으로 풀에 투입.
//            광고/브랜드 수익이 붙으면 그쪽으로 전환.

import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────
// 설정 (여기만 바꾸면 전체가 따라온다)
// ─────────────────────────────────────────────
export const REWARD_CONFIG = {
  /** 인기도 점수 가중치 — 관심 지표 중심 */
  weights: {
    view: 0.3, // 조회 1회
    application: 5.0, // 신청 1건
    registration: 20.0, // 매치 등록 1건 (꾸준한 공급 보상)
  },

  /** 초과분 중 풀로 돌리는 비율. 초기엔 수수료 전액(1.0) */
  poolRateFromCommission: 1.0,
  /** 플랫폼 수수료율 (초과분의 15%) */
  commissionRate: 0.15,

  /** 자체 예산 최소 보장(원). 초기 신뢰 확보용. 0이면 미사용 */
  poolFloor: 200_000,

  /** 리워드 대상 최소 조건: 성사 매치 N건 이상 */
  minCompletedMatches: 1,
};

/** 5단계 gate — 절대 점수 기준, 최고 단계만 지급 */
export interface RewardTier {
  level: number;
  name: string;
  minScore: number;
  reward: number;
}

export const REWARD_TIERS: RewardTier[] = [
  { level: 1, name: '1단계', minScore: 300, reward: 500 },
  { level: 2, name: '2단계', minScore: 700, reward: 1_500 },
  { level: 3, name: '3단계', minScore: 1_500, reward: 3_000 },
  { level: 4, name: '4단계', minScore: 3_000, reward: 6_000 },
  { level: 5, name: '5단계', minScore: 6_000, reward: 12_000 },
];

/** 등급 배지 (누적 활동 기반, 정산과 무관 — 매치카드 표시용) */
export const HOST_GRADES = [
  { name: '루키', minTotalMatches: 0 },
  { name: '챌린저', minTotalMatches: 5 },
  { name: '투어', minTotalMatches: 20 },
  { name: '마스터스', minTotalMatches: 50 },
  { name: '그랜드슬램', minTotalMatches: 120 },
];

export function getHostGrade(totalCompletedMatches: number): string {
  let grade = HOST_GRADES[0].name;
  for (const g of HOST_GRADES) {
    if (totalCompletedMatches >= g.minTotalMatches) grade = g.name;
  }
  return grade;
}

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
export interface SellerPopularity {
  sellerId: string;
  views: number;
  applications: number;
  registrations: number;
  completedMatches: number;
  score: number;
  tierLevel: number; // 0 = 미달
  baseReward: number; // 삭감 전 지급액
}

export interface RewardSnapshot {
  me: SellerPopularity;
  /** 다음 단계 정보 (5단계 도달 시 null) */
  nextTier: RewardTier | null;
  /** 다음 단계까지 남은 점수 */
  toNextScore: number;
  /** 비례 삭감 적용 후 실제 예상 지급액 */
  estimatedReward: number;
  /** 삭감 비율 (1 = 삭감 없음) */
  prorateRatio: number;
  pool: number;
  totalPayout: number;
  period: string; // 2026-07
}

// ─────────────────────────────────────────────
// 엔진
// ─────────────────────────────────────────────
export class PopularityManager {
  /** 점수 계산 */
  static computeScore(p: {
    views: number;
    applications: number;
    registrations: number;
  }): number {
    const w = REWARD_CONFIG.weights;
    return Math.round(
      p.views * w.view + p.applications * w.application + p.registrations * w.registration
    );
  }

  /** 점수 → 도달 단계 (최고 단계만) */
  static getTier(score: number): RewardTier | null {
    let reached: RewardTier | null = null;
    for (const t of REWARD_TIERS) {
      if (score >= t.minScore) reached = t;
    }
    return reached;
  }

  /** 다음 단계 */
  static getNextTier(score: number): RewardTier | null {
    for (const t of REWARD_TIERS) {
      if (score < t.minScore) return t;
    }
    return null; // 최고 단계 도달
  }

  private static periodRange(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const em = month === 12 ? 1 : month + 1;
    const ey = month === 12 ? year + 1 : year;
    const end = `${ey}-${String(em).padStart(2, '0')}-01`;
    return { start, end, period: `${year}-${String(month).padStart(2, '0')}` };
  }

  /**
   * 이번 달 전체 판매자 인기도 집계.
   * earnings(성사 매치) + matches(조회/신청/등록)에서 모은다.
   */
  static async getAllPopularity(year: number, month: number): Promise<SellerPopularity[]> {
    const { start, end } = this.periodRange(year, month);

    // 이번 달 매치. applications 는 별도 테이블이 아니라 jsonb 컬럼이다.
    // 더미 매치는 집계에서 제외한다.
    const { data: matches, error } = await supabase
      .from('matches')
      .select('id, seller_id, view_count, applications, date, is_dummy')
      .gte('date', start)
      .lt('date', end)
      .eq('is_dummy', false);

    if (error || !matches) {
      console.error('인기도 집계 오류:', error);
      return [];
    }

    // 성사 매치 수 (earnings 기준)
    const completedBySeller = new Map<string, number>();
    const { data: earnings } = await supabase
      .from('earnings')
      .select('seller_id')
      .gte('match_date', start)
      .lt('match_date', end);
    (earnings || []).forEach((e: any) => {
      completedBySeller.set(e.seller_id, (completedBySeller.get(e.seller_id) || 0) + 1);
    });

    // 판매자별 집계
    const bySeller = new Map<string, SellerPopularity>();
    for (const m of matches as any[]) {
      const cur =
        bySeller.get(m.seller_id) ||
        ({
          sellerId: m.seller_id,
          views: 0,
          applications: 0,
          registrations: 0,
          completedMatches: 0,
          score: 0,
          tierLevel: 0,
          baseReward: 0,
        } as SellerPopularity);

      cur.views += Number(m.view_count) || 0;

      // applications 는 jsonb 배열
      const apps = Array.isArray(m.applications) ? m.applications : [];
      cur.applications += apps.length;

      cur.registrations += 1;
      bySeller.set(m.seller_id, cur);
    }

    const result: SellerPopularity[] = [];
    for (const s of bySeller.values()) {
      s.completedMatches = completedBySeller.get(s.sellerId) || 0;
      s.score = this.computeScore(s);

      const eligible = s.completedMatches >= REWARD_CONFIG.minCompletedMatches;
      const tier = eligible ? this.getTier(s.score) : null;
      s.tierLevel = tier?.level ?? 0;
      s.baseReward = tier?.reward ?? 0;

      result.push(s);
    }

    return result.sort((a, b) => b.score - a.score);
  }

  /**
   * 이번 달 리워드 풀 계산.
   * 초기: 초과분 수수료(15%) 전액 + 자체 예산 floor 보장
   */
  static async getPool(year: number, month: number): Promise<number> {
    const { start, end } = this.periodRange(year, month);

    const { data } = await supabase
      .from('earnings')
      .select('match_additional_revenue')
      .gte('match_date', start)
      .lt('match_date', end);

    const surplus = (data || []).reduce(
      (sum: number, e: any) => sum + (Number(e.match_additional_revenue) || 0),
      0
    );

    const fromCommission =
      surplus * REWARD_CONFIG.commissionRate * REWARD_CONFIG.poolRateFromCommission;

    return Math.max(fromCommission, REWARD_CONFIG.poolFloor);
  }

  /**
   * 특정 판매자의 이번 달 스냅샷 (게이지 UI용).
   * 비례 삭감(pro-rate)까지 반영한 실제 예상 지급액을 돌려준다.
   */
  static async getSnapshot(
    sellerId: string,
    year: number,
    month: number
  ): Promise<RewardSnapshot> {
    const { period } = this.periodRange(year, month);
    const [all, pool] = await Promise.all([
      this.getAllPopularity(year, month),
      this.getPool(year, month),
    ]);

    const totalPayout = all.reduce((sum, s) => sum + s.baseReward, 0);

    // 풀 초과 시 전원 비례 삭감
    const prorateRatio = totalPayout > pool && totalPayout > 0 ? pool / totalPayout : 1;

    const me =
      all.find(s => s.sellerId === sellerId) ||
      ({
        sellerId,
        views: 0,
        applications: 0,
        registrations: 0,
        completedMatches: 0,
        score: 0,
        tierLevel: 0,
        baseReward: 0,
      } as SellerPopularity);

    const nextTier = this.getNextTier(me.score);

    return {
      me,
      nextTier,
      toNextScore: nextTier ? Math.max(0, nextTier.minScore - me.score) : 0,
      estimatedReward: Math.floor((me.baseReward * prorateRatio) / 100) * 100,
      prorateRatio,
      pool,
      totalPayout,
      period,
    };
  }
}
