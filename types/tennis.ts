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
  matchType: '단식' | '복식';
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