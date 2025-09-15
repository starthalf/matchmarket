// types/tennis.ts

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
    male: number;
    female: number;
    total: number;
  };
  currentApplicants: {
    male: number;
    female: number;
    total: number;
  };
  matchType: '단식' | '남복' | '여복' | '혼복'; // 🔥 4가지 매치 타입으로 변경
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
  isClosed?: boolean; // 판매자가 수동으로 마감한 상태
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

// 매치 타입별 도우미 함수들
export const MatchTypeHelper = {
  // 매치 타입별 기본 인원 수 반환
  getDefaultParticipants(matchType: Match['matchType']): { male: number; female: number; total: number } {
    switch (matchType) {
      case '단식':
        return { male: 1, female: 1, total: 2 }; // 남성 1명, 여성 1명 (상대방)
      case '남복':
        return { male: 2, female: 0, total: 2 }; // 남성 2명만
      case '여복':
        return { male: 0, female: 2, total: 2 }; // 여성 2명만
      case '혼복':
        return { male: 1, female: 1, total: 2 }; // 남성 1명, 여성 1명
      default:
        return { male: 1, female: 1, total: 2 };
    }
  },

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
  }
};