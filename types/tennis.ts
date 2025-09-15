// types/tennis.ts - 완전한 코드

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
  initialPrice: number;
  currentPrice: number;
  maxPrice: number;
  expectedViews: number;
  expectedWaitingApplicants: number;
  expectedParticipants: {
    male: number;      // 🔥 모집할 남성 인원수 (자유롭게 설정 가능)
    female: number;    // 🔥 모집할 여성 인원수 (자유롭게 설정 가능)
    total: number;     // 🔥 총 모집 인원수
  };
  currentApplicants: {
    male: number;
    female: number;
    total: number;
  };
  matchType: '단식' | '남복' | '여복' | '혼복'; // 🔥 경기 방식만 의미 (인원수와 무관)
  waitingApplicants: number;
  waitingList: WaitingApplicant[];
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
  rating: number; // 1-5
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
  evidence: string[]; // 이미지/영상 URL
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

// 🔥 매치 타입별 도우미 함수들 (수정)
export const MatchTypeHelper = {
  // 매치 타입 표시명 반환
  getDisplayName(matchType: Match['matchType']): string {
    switch (matchType) {
      case '단식':
        return '단식';
      case '남복':
        return '남자복식';
      case '여복':
        return '여자복식';
      case '혼복':
        return '혼합복식';
      default:
        return matchType;
    }
  },

  // 매치 타입별 참가 가능 성별 확인
  canParticipate(matchType: Match['matchType'], userGender: '남성' | '여성'): boolean {
    switch (matchType) {
      case '단식':
        return true; // 단식은 누구나 참가 가능
      case '남복':
        return userGender === '남성'; // 남자복식은 남성만
      case '여복':
        return userGender === '여성'; // 여자복식은 여성만
      case '혼복':
        return true; // 혼합복식은 누구나 참가 가능
      default:
        return true;
    }
  },

  // 매치 타입별 아이콘 이모지
  getIcon(matchType: Match['matchType']): string {
    switch (matchType) {
      case '단식':
        return '🎾';
      case '남복':
        return '👨‍🤝‍👨';
      case '여복':
        return '👩‍🤝‍👩';
      case '혼복':
        return '👫';
      default:
        return '🎾';
    }
  },

  // 매치 타입별 설명
  getDescription(matchType: Match['matchType']): string {
    switch (matchType) {
      case '단식':
        return '개인전 방식의 테니스 경기';
      case '남복':
        return '남성만 참여하는 복식 경기';
      case '여복':
        return '여성만 참여하는 복식 경기';
      case '혼복':
        return '남녀가 함께 참여하는 복식 경기';
      default:
        return '테니스 경기';
    }
  },

  // 매치 타입별 권장 최소 인원 (참고용)
  getMinRecommendedParticipants(matchType: Match['matchType']): number {
    switch (matchType) {
      case '단식':
        return 2; // 최소 2명 (1:1)
      case '남복':
      case '여복':
      case '혼복':
        return 4; // 최소 4명 (2:2)
      default:
        return 2;
    }
  },

  // 매치 타입별 성별 제한 체크
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

// 🔥 추가 유틸리티 타입들
export type MatchStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type ParticipantStatus = 'waiting' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

// 🔥 매치 필터링용 인터페이스
export interface MatchFilter {
  matchTypes: Array<Match['matchType']>;
  ntrpRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  dateRange?: { start: string; end: string };
  location?: string;
  availableOnly: boolean;
  gender?: '남성' | '여성' | 'all';
}

// 🔥 매치 통계용 인터페이스
export interface MatchStats {
  total: number;
  byType: Record<Match['matchType'], number>;
  avgPrice: number;
  avgParticipants: number;
  avgNtrp: number;
  totalRevenue: number;
}

// 🔥 사용자 선호도 인터페이스
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