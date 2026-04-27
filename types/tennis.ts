// types/tennis.ts - 새로운 참여신청 시스템 타입 정의

export interface User {
  id: string;
  name: string;
  email?: string;
  gender: '남성' | '여성';
  ageGroup: '20대' | '30대' | '40대' | '50대+';
  ntrp: number;
  experience: number;
  playStyle: '공격형' | '수비형' | '올라운드';
  careerType: '동호인' | '선수';
  certification: {
    ntrp: 'none' | 'pending' | 'verified';
    career: 'none' | 'pending' | 'verified';
    youtube: 'none' | 'pending' | 'verified';
    instagram: 'none' | 'pending' | 'verified';
  };
  profileImage?: string;
  viewCount: number;
  likeCount: number;
  avgRating: number;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export interface MatchApplication {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userGender: '남성' | '여성';
  userNtrp: number;
  userProfileImage?: string;
  appliedPrice: number;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'payment_submitted' | 'confirmed';
  approvedAt?: string;
  rejectedAt?: string;
  paymentRequestedAt?: string;
  paymentExpiresAt?: string;
}

export interface WaitingApplicant {
  id: string;
  userId: string;
  userName: string;
  gender: '남성' | '여성';
  ntrp: number;
  joinedAt: string;
  status: 'waiting' | 'payment_requested' | 'payment_submitted' | 'payment_confirmed' | 'payment_failed' | 'cancelled';
  paymentRequestedAt?: string;
  paymentExpiresAt?: string;
  paymentSubmittedAt?: string;
  paymentConfirmedAt?: string;
  depositorName?: string;
}

export interface MatchParticipant {
  id: string;
  userId: string;
  userName: string;
  gender: '남성' | '여성';
  ntrp: number;
  joinedAt: string;
  status: 'payment_pending' | 'confirmed' | 'cancelled_by_user' | 'refunded';
  paymentAmount: number;
  paymentSubmittedAt?: string;
  paymentConfirmedAt?: string;
  cancelledAt?: string;
  refundRequestedAt?: string;
  refundAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export interface Match {
  id: string;
  sellerId: string;
  seller: User;
  title: string;
  date: string;
  time: string;
  endTime: string;
  court: string;
  description: string;
  basePrice: number;
  initialPrice?: number;
  currentPrice: number;
  maxPrice: number;
  expectedViews: number;
  expectedWaitingApplicants?: number;
  expectedParticipants: {
    male: number;
    female: number;
    total: number;
  };
  currentApplicants: {
    male: number;
    female: number;
    total: number;
  };
  matchType: '단식' | '남복' | '여복' | '혼복';
  waitingApplicants?: number;
  waitingList?: WaitingApplicant[];
  applications?: MatchApplication[];
  participants: MatchParticipant[];
  adEnabled: boolean;
  ntrpRequirement: {
    min: number;
    max: number;
  };
  weather: '맑음' | '흐림' | '비';
  location: string;
  createdAt: string;
  isClosed?: boolean;
  isCompleted?: boolean;
  completedAt?: string;
}

export interface ChatRoom {
  id: string;
  matchId: string;
  participantIds: string[];
  lastMessage?: ChatMessage;
  updatedAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  type: 'text' | 'system' | 'image';
  timestamp: string;
  isRead: boolean;
}

export interface PaymentRequest {
  id: string;
  matchId: string;
  userId: string;
  amount: number;
  requestedAt: string;
  expiresAt: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'expired' | 'cancelled';
  depositorName?: string;
  submittedAt?: string;
}

export interface Review {
  id: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  matchTitle?: string;
  createdAt: string;
}

export interface CertificationRequest {
  id: string;
  userId: string;
  type: 'ntrp' | 'career';
  requestedNtrp?: number;
  careerDetails?: string;
  evidence: string[];
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface PricingFactors {
  viewCount: number;
  applicationsCount: number;
  expectedApplicants: number;
  hoursUntilMatch: number;
  basePrice: number;
  maxPrice: number;
}

// 🆕 고도화된 비선형 동적 가격 계산
export class PricingCalculator {
  /**
   * 비선형 동적 가격 계산
   * - 5% 미만 변동은 0원 처리 (의미 없는 소폭 변동 제거)
   * - 임계점 돌파 시 본격 상승, 경쟁 치열하면 급등
   */
  static calculateDynamicPrice(factors: PricingFactors): number {
    const { basePrice, maxPrice, viewCount, applicationsCount, expectedApplicants, hoursUntilMatch } = factors;

    const actualSlots = Math.max(1, expectedApplicants / 5);
    const demandRatio = applicationsCount / actualSlots;

    // 1. 조회수 보너스 (최대 +20%) — 30회부터, x² 곡선
    let viewBonus = 0;
    if (viewCount >= 30) {
      const normalized = Math.min((viewCount - 30) / 970, 1);
      viewBonus = Math.pow(normalized, 2) * 0.20;
    }

    // 2. 수요 보너스 (최대 +200%) — 1배부터, x³ 곡선
    let demandBonus = 0;
    if (demandRatio >= 1) {
      const normalized = Math.min((demandRatio - 1) / 9, 1);
      demandBonus = Math.pow(normalized, 3) * 2.0;
    }

    // 3. 시간 긴급 보너스 (최대 +15%) — 24시간 이내 + 수요 있을 때만
    let urgencyBonus = 0;
    if (hoursUntilMatch <= 24 && demandRatio >= 1) {
      const timeNormalized = Math.max(0, 1 - (hoursUntilMatch / 24));
      const urgencyMultiplier = Math.pow(timeNormalized, 2) * 0.15;
      const demandWeight = Math.min(demandRatio / 3, 1);
      urgencyBonus = urgencyMultiplier * demandWeight;
    }

    // 5% 미만 변동은 0원 처리
    const totalBonus = viewBonus + demandBonus + urgencyBonus;
    if (totalBonus < 0.05) {
      return basePrice;
    }

    let finalPrice = basePrice * (1 + totalBonus);
    finalPrice = Math.max(basePrice, finalPrice);
    finalPrice = Math.min(maxPrice, finalPrice);

    return Math.round(finalPrice / 100) * 100;
  }

  /**
   * 관심도(열기) 레벨 — 가격 변동 없어도 UI에 표시
   * 0: 조용 / 1: 관심 증가 / 2: 인기 / 3: 뜨거움 / 4: 폭발
   */
  static getHeatLevel(viewCount: number, applicationsCount: number, actualSlots: number): number {
    const demandRatio = applicationsCount / Math.max(1, actualSlots);

    let viewScore = 0;
    if (viewCount >= 30) viewScore = 0.5;
    if (viewCount >= 100) viewScore = 1;
    if (viewCount >= 300) viewScore = 1.5;
    if (viewCount >= 500) viewScore = 2;

    let demandScore = 0;
    if (demandRatio >= 0.5) demandScore = 0.5;
    if (demandRatio >= 1) demandScore = 1;
    if (demandRatio >= 3) demandScore = 1.5;
    if (demandRatio >= 5) demandScore = 2;

    const totalScore = viewScore + demandScore;

    if (totalScore >= 3.5) return 4;
    if (totalScore >= 2.5) return 3;
    if (totalScore >= 1.5) return 2;
    if (totalScore >= 0.5) return 1;
    return 0;
  }
}

export const MatchTypeHelper = {
  getDisplayName(matchType: Match['matchType']): string {
    switch (matchType) {
      case '단식': return '단식';
      case '남복': return '남자복식';
      case '여복': return '여자복식';
      case '혼복': return '혼합복식';
      default: return matchType;
    }
  },

  canParticipate(matchType: Match['matchType'], userGender: '남성' | '여성'): boolean {
    switch (matchType) {
      case '단식':
      case '혼복':
        return true;
      case '남복':
        return userGender === '남성';
      case '여복':
        return userGender === '여성';
      default:
        return true;
    }
  },

  getIcon(matchType: Match['matchType']): string {
    switch (matchType) {
      case '단식': return '🎾';
      case '남복': return '👨‍🤝‍👨';
      case '여복': return '👩‍🤝‍👩';
      case '혼복': return '👫';
      default: return '🎾';
    }
  },

  getDescription(matchType: Match['matchType']): string {
    switch (matchType) {
      case '단식': return '개인전 방식의 테니스 경기';
      case '남복': return '남성만 참여하는 복식 경기';
      case '여복': return '여성만 참여하는 복식 경기';
      case '혼복': return '남녀가 함께 참여하는 복식 경기';
      default: return '테니스 경기';
    }
  },

  validateParticipantCount(
    matchType: Match['matchType'], 
    maleCount: number, 
    femaleCount: number
  ): { isValid: boolean; message?: string } {
    switch (matchType) {
      case '남복':
        if (femaleCount > 0) {
          return { 
            isValid: false, 
            message: '남자복식에서는 여성 참가자를 모집할 수 없습니다.' 
          };
        }
        if (maleCount === 0) {
          return { 
            isValid: false, 
            message: '남자복식에서는 최소 1명의 남성 참가자가 필요합니다.' 
          };
        }
        break;
        
      case '여복':
        if (maleCount > 0) {
          return { 
            isValid: false, 
            message: '여자복식에서는 남성 참가자를 모집할 수 없습니다.' 
          };
        }
        if (femaleCount === 0) {
          return { 
            isValid: false, 
            message: '여자복식에서는 최소 1명의 여성 참가자가 필요합니다.' 
          };
        }
        break;
        
      case '단식':
      case '혼복':
        if (maleCount === 0 && femaleCount === 0) {
          return { 
            isValid: false, 
            message: '최소 1명 이상의 참가자가 필요합니다.' 
          };
        }
        break;
    }
    
    return { isValid: true };
  }
};

export type MatchStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type ParticipantStatus = 'waiting' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface MatchFilter {
  matchTypes: Array<Match['matchType']>;
  ntrpRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  dateRange?: { start: string; end: string };
  location?: string;
  availableOnly: boolean;
  gender?: '남성' | '여성' | 'all';
}

export interface MatchStats {
  total: number;
  byType: Record<Match['matchType'], number>;
  avgPrice: number;
  avgParticipants: number;
  avgNtrp: number;
  totalRevenue: number;
}

export interface UserPreferences {
  preferredMatchTypes: Array<Match['matchType']>;
  preferredTimeSlots: string[];
  preferredLocations: string[];
  maxPrice: number;
  autoJoinWaitlist: boolean;
  notificationSettings: {
    newMatches: boolean;
    priceChanges: boolean;
    matchReminders: boolean;
    paymentRequests: boolean;
  };
}