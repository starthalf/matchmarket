import { User, Match, Review } from '../types/tennis';
import { DataGenerator } from '../utils/dataGenerator';

// 수익 데이터 인터페이스
export interface EarningsData {
  id: string;
  matchTitle: string;
  date: string;
  matchBasePrice: number; // 판매자가 설정한 기본가격 * 참여자 수
  matchTotalPaid: number; // 참여자들이 실제 결제한 총 금액
  matchBaseCost: number; // 기본비용 (matchBasePrice)
  matchAdditionalRevenue: number; // 추가수익 (차액에서 15% 수수료 제외)
  adViews: number;
  adClicks: number;
  adRevenue: number;
  adShare: number;
  totalRevenue: number;
}

// 수익 데이터 (수정 가능하도록 let으로 변경)
let _mockEarnings: EarningsData[] = [
  {
    id: '1',
    matchTitle: '강남 테니스장에서 함께 치실 분!',
    date: '2024-12-20',
    matchBasePrice: 35000, // 기본가격 35,000원
    matchTotalPaid: 78000, // 실제 결제 총액
    matchBaseCost: 35000, // 기본비용
    matchAdditionalRevenue: 36550, // (78000-35000) * 0.85 = 36,550원
    adViews: 1250,
    adClicks: 89,
    adRevenue: 15600,
    adShare: 7800, // 광고 수익 50%
    totalRevenue: 79350, // 35000 + 36550 + 7800
  },
  {
    id: '2',
    matchTitle: '홍대 실내코트 복식 매치',
    date: '2024-12-18',
    matchBasePrice: 28000, // 기본가격 28,000원
    matchTotalPaid: 42000, // 실제 결제 총액
    matchBaseCost: 28000, // 기본비용
    matchAdditionalRevenue: 11900, // (42000-28000) * 0.85 = 11,900원
    adViews: 980,
    adClicks: 67,
    adRevenue: 12400,
    adShare: 6200,
    totalRevenue: 46100, // 28000 + 11900 + 6200
  },
  {
    id: '3',
    matchTitle: '잠실 아웃도어 코트 레슨형 매치',
    date: '2024-12-15',
    matchBasePrice: 25000, // 기본가격 25,000원
    matchTotalPaid: 31000, // 실제 결제 총액
    matchBaseCost: 25000, // 기본비용
    matchAdditionalRevenue: 5100, // (31000-25000) * 0.85 = 5,100원
    adViews: 650,
    adClicks: 43,
    adRevenue: 8900,
    adShare: 4450,
    totalRevenue: 34550, // 25000 + 5100 + 4450
  },
  {
    id: '4',
    matchTitle: '강남 테니스장 주말 매치',
    date: '2024-12-28',
    matchBasePrice: 40000, // 기본가격 40,000원
    matchTotalPaid: 85000, // 실제 결제 총액
    matchBaseCost: 40000, // 기본비용
    matchAdditionalRevenue: 38250, // (85000-40000) * 0.85 = 38,250원
    adViews: 2100,
    adClicks: 156,
    adRevenue: 24800,
    adShare: 12400,
    totalRevenue: 90650, // 40000 + 38250 + 12400
  },
];

/**
 * 수익 데이터 추가 또는 업데이트
 */
export const addMockEarning = (earning: EarningsData): void => {
  const existingIndex = _mockEarnings.findIndex(e => e.id === earning.id);
  if (existingIndex >= 0) {
    _mockEarnings[existingIndex] = earning;
  } else {
    _mockEarnings.push(earning);
  }
};

/**
 * 현재 수익 데이터 조회
 */
export const getMockEarnings = (): EarningsData[] => {
  return [..._mockEarnings];
};

// DataGenerator에서 더미 사용자들을 가져와서 기본 사용자로 사용
const dummyUsers = [
  {
    id: 'dummy_f1',
    name: 'aesthetic.vibes',
    email: 'aesthetic.vibes@demo.com',
    gender: '여성' as const,
    ageGroup: '20대' as const,
    ntrp: 4.2,
    experience: 30,
    playStyle: '공격형' as const,
    careerType: '선수' as const,
    certification: { ntrp: 'verified' as const, career: 'verified' as const, youtube: 'none' as const, instagram: 'verified' as const },
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 1850,
    likeCount: 142,
    avgRating: 4.7,
  },
  {
    id: 'dummy_m1',
    name: 'urban.explorer',
    email: 'urban.explorer@demo.com',
    gender: '남성' as const,
    ageGroup: '30대' as const,
    ntrp: 4.5,
    experience: 48,
    playStyle: '공격형' as const,
    careerType: '선수' as const,
    certification: { ntrp: 'verified' as const, career: 'verified' as const, youtube: 'verified' as const, instagram: 'none' as const },
    profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 2350,
    likeCount: 198,
    avgRating: 4.9,
  },
  {
    id: 'dummy_m2',
    name: 'midnight.rider',
    email: 'midnight.rider@demo.com',
    gender: '남성' as const,
    ageGroup: '20대' as const,
    ntrp: 3.8,
    experience: 30,
    playStyle: '수비형' as const,
    careerType: '선수' as const,
    certification: { ntrp: 'verified' as const, career: 'verified' as const, youtube: 'none' as const, instagram: 'pending' as const },
    profileImage: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 1420,
    likeCount: 89,
    avgRating: 4.5,
  },
  {
    id: 'dummy_f2',
    name: 'moonlight.cafe',
    email: 'moonlight.cafe@demo.com',
    gender: '여성' as const,
    ageGroup: '30대' as const,
    ntrp: 3.8,
    experience: 42,
    playStyle: '올라운드' as const,
    careerType: '선수' as const,
    certification: { ntrp: 'verified' as const, career: 'verified' as const, youtube: 'verified' as const, instagram: 'none' as const },
    profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 2100,
    likeCount: 189,
    avgRating: 4.8,
  },
  {
    id: 'dummy_f3',
    name: 'cherry.blossom',
    email: 'cherry.blossom@demo.com',
    gender: '여성' as const,
    ageGroup: '20대' as const,
    ntrp: 3.5,
    experience: 24,
    playStyle: '수비형' as const,
    careerType: '동호인' as const,
    certification: { ntrp: 'pending' as const, career: 'none' as const, youtube: 'none' as const, instagram: 'verified' as const },
    profileImage: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 980,
    likeCount: 76,
    avgRating: 4.4,
  },
];

export const mockUsers: User[] = dummyUsers;
export const mockReviews: Review[] = [
  {
    id: '1',
    sellerId: '1',
    reviewerId: '2',
    reviewerName: '박라켓',
    rating: 5,
    comment: '정말 좋은 매치였어요! 실력도 좋으시고 매너도 훌륭하셨습니다. 다음에 또 함께 치고 싶어요.',
    matchTitle: '강남 테니스장에서 함께 치실 분!',
    createdAt: '2024-12-20T14:30:00Z',
  },
  {
    id: '2',
    sellerId: '1',
    reviewerId: '3',
    reviewerName: '최스매시',
    rating: 4,
    comment: '실력이 정말 좋으시네요. 많이 배웠습니다. 시간도 정확하게 지켜주셔서 좋았어요.',
    matchTitle: '강남 테니스장에서 함께 치실 분!',
    createdAt: '2024-12-18T16:45:00Z',
  },
  {
    id: '3',
    sellerId: '1',
    reviewerId: '4',
    reviewerName: '이서브',
    rating: 5,
    comment: '친절하게 가르쳐주셔서 감사했습니다. 초보자도 편하게 참여할 수 있는 분위기를 만들어주셨어요.',
    matchTitle: '강남 테니스장에서 함께 치실 분!',
    createdAt: '2024-12-15T10:20:00Z',
  },
  {
    id: '4',
    sellerId: '2',
    reviewerId: '1',
    reviewerName: '김테니스',
    rating: 4,
    comment: '좋은 매치였습니다. 실력도 비슷하고 재미있게 운동했어요.',
    matchTitle: '홍대 실내코트 복식 매치',
    createdAt: '2024-12-22T19:15:00Z',
  },
  {
    id: '5',
    sellerId: '2',
    reviewerId: '5',
    reviewerName: '정볼리',
    rating: 5,
    comment: '매우 만족스러운 매치였습니다. 코트 상태도 좋고 분위기도 좋았어요.',
    matchTitle: '홍대 실내코트 복식 매치',
    createdAt: '2024-12-19T11:30:00Z',
  },
  {
    id: '6',
    sellerId: '3',
    reviewerId: '1',
    reviewerName: '김테니스',
    rating: 4,
    comment: '차분하고 좋은 분위기에서 운동할 수 있었습니다. 추천해요!',
    matchTitle: '잠실 아웃도어 코트 레슨형 매치',
    createdAt: '2024-12-17T13:45:00Z',
  },
];

// 더미 매치 생성기를 사용하여 기본 매치들 생성
export const mockMatches: Match[] = [
  // 기본 매치들을 모두 삭제하고 빈 배열로 만듦
];

export const getCurrentUser = (): User => mockUsers[4]; // 지은이

// 현재 사용자 업데이트 함수 (AuthContext에서 사용)
export const updateCurrentUser = (updatedUser: User): void => {
  const index = mockUsers.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    mockUsers[index] = updatedUser;
  }
};