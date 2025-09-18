// types/tennis.ts - 새로운 참여신청 시스템 타입 정의

export interface User {
  id: string;
  name: string;
  gender: '남성' | '여성';
  ageGroup: '20대' | '30대' | '40대' | '50대+';
  ntrp: number;
  experience: number; // 개월 수
  playStyle: '공격형' | '수비형' | '올라운드';
  careerType: '동호인' | '대학선수' | '실업선수';
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
}

// 🆕 새로운 참여신청 인터페이스 - 대기시스템 대신 사용
export interface MatchApplication {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userGender: '남성' | '여성';
  userNtrp: number;
  userProfileImage?: string;
  appliedPrice: number; // 참여신청 당시의 가격
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedAt?: string;
  rejectedAt?: string;
  paymentRequestedAt?: string;
  paymentExpiresAt?: string; // 결제요청 5분 타이머
}

// 기존 대기자 인터페이스 (하위 호환성을 위해 유지)
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
  initialPrice?: number; // 🗑️ 삭제 예정 (호환성 유지)
  currentPrice: number;
  maxPrice: number;
  expectedViews: number;
  expectedWaitingApplicants?: number; // 🗑️ 삭제 예정 (호환성 유지)
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
  
  // 🔄 기존 대기자 시스템 (호환성 유지)
  waitingApplicants?: number;
  waitingList?: WaitingApplicant[];
  
  // 🆕 새로운 참여신청 시스템
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
}

// 🆕 채팅 관련 인터페이스
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

// 🆕 새로운 가격 로직을 위한 인터페이스
export interface PricingFactors {
  viewCount: number;
  applicationsCount: number; // 참여신청자 수
  expectedApplicants: number; // 모집인원 × 10
  hoursUntilMatch: number;
  basePrice: number;
  maxPrice: number;
}

// 🆕 새로운 가격 계산 유틸리티
export class PricingCalculator {
  /**
   * 간소화된 동적 가격 계산
   * - 조회수 할증: 500회 이상부터 (최대 10%)
   * - 참여신청자 할증: 모집인원수의 10배 이상부터 (최대 100%)
   * - 시간 할인: 10시간 전부터 (최대 20%)
   */
  static calculateDynamicPrice(factors: PricingFactors): number {
    let price = factors.basePrice;
    
    // 1. 조회수 할증 (500회 이상부터, 최대 10%)
    if (factors.viewCount >= 500) {
      const viewMultiplier = Math.min(0.1, (factors.viewCount - 500) / 2000 * 0.1);
      price *= (1 + viewMultiplier);
    }
    
    // 2. 참여신청자 할증 (모집인원 × 10배 이상부터, 최대 100%)
    if (factors.applicationsCount >= factors.expectedApplicants) {
      const applicationMultiplier = Math.min(1.0, (factors.applicationsCount - factors.expectedApplicants) / factors.expectedApplicants);
      price *= (1 + applicationMultiplier);
    }
    
    // 3. 시간 할인 (10시간 전부터, 최대 20%)
    if (factors.hoursUntilMatch <= 10 && factors.hoursUntilMatch >= 0) {
      const timeDiscount = Math.min(0.2, (10 - factors.hoursUntilMatch) / 10 * 0.2);
      price *= (1 - timeDiscount);
    }
    
    // 4. 기본가격 아래로 안떨어지는 로직, 최대가격 20만원 유지
    price = Math.max(factors.basePrice, price);
    price = Math.min(factors.maxPrice, price);
    
    return Math.round(price / 1000) * 1000; // 1000원 단위 반올림
  }
}

// 매치 타입별 도우미 함수들
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

// 추가 유틸리티 타입들
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