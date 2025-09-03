import { Ad } from '../types/ad';

export const mockAds: Ad[] = [
  {
    id: 'ad_1',
    title: '위드맨다에서\n최대약5만원 혜택받는\n역대급 상품 공동구매!',
    description: '스타벅스 기프티콘 증정 이벤트',
    imageUrl: 'https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/starbucks-event',
    buttonText: '보러가기',
    backgroundColor: '#8b5cf6',
    textColor: '#ffffff',
    isActive: true,
    priority: 1,
    targetAudience: {
      ageGroups: ['20대', '30대'],
    },
    viewCount: 1250,
    clickCount: 89,
    createdAt: '2024-12-20T10:00:00Z',
    updatedAt: '2024-12-27T15:30:00Z',
  },
  {
    id: 'ad_2',
    title: '테니스 라켓 특가 세일',
    description: '프리미엄 라켓 최대 40% 할인',
    imageUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/tennis-racket-sale',
    buttonText: '구매하기',
    backgroundColor: '#16a34a',
    textColor: '#ffffff',
    isActive: true,
    priority: 2,
    targetAudience: {
      ntrpRange: { min: 3.0, max: 5.0 },
    },
    viewCount: 980,
    clickCount: 67,
    createdAt: '2024-12-18T14:00:00Z',
    updatedAt: '2024-12-26T09:15:00Z',
  },
  {
    id: 'ad_3',
    title: '프리미엄 테니스 레슨',
    description: '전 국가대표 코치와 함께하는 1:1 맞춤 레슨',
    imageUrl: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/premium-lesson',
    buttonText: '예약하기',
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
    isActive: false, // 비활성화된 광고
    priority: 3,
    targetAudience: {
      gender: '여성',
      ntrpRange: { min: 2.0, max: 4.0 },
    },
    viewCount: 650,
    clickCount: 43,
    createdAt: '2024-12-15T11:00:00Z',
    updatedAt: '2024-12-25T16:20:00Z',
  },
];

// 광고 관리 유틸리티 함수들
export class AdManager {
  private static STORAGE_KEY = 'ad_settings';
  private static HIDE_TODAY_KEY = 'hide_ads_today';

  /**
   * 활성화된 광고 목록 가져오기
   */
  static getActiveAds(): Ad[] {
    return mockAds.filter(ad => ad.isActive);
  }

  /**
   * 사용자에게 표시할 광고 선택
   */
  static async getAdToShow(user?: any): Promise<Ad | null> {
    console.log('getAdToShow 함수 호출됨, user:', user);
    const activeAds = this.getActiveAds();
    console.log('활성 광고 수:', activeAds.length);
    
    if (activeAds.length === 0) {
      console.log('활성 광고가 없음');
      return null;
    }

    // 오늘 하루 그만보기 체크 (웹에서만)
    try {
      if (typeof window !== 'undefined') {
        const hideToday = localStorage.getItem(this.HIDE_TODAY_KEY);
        const today = new Date().toDateString();
        console.log('오늘 하루 그만보기 체크:', hideToday, today);
        
        if (hideToday === today) {
          console.log('오늘 하루 그만보기 설정됨');
          return null;
        }
      }
    } catch (error) {
      console.warn('localStorage 접근 실패 (네이티브 환경에서는 정상):', error);
    }

    // 타겟 오디언스 필터링
    let filteredAds = activeAds;
    console.log('필터링 전 광고 수:', filteredAds.length);
    
    if (user) {
      filteredAds = activeAds.filter(ad => {
        if (!ad.targetAudience) return true;
        
        // 성별 필터
        if (ad.targetAudience.gender && ad.targetAudience.gender !== user.gender) {
          return false;
        }
        
        // 나이대 필터
        if (ad.targetAudience.ageGroups && !ad.targetAudience.ageGroups.includes(user.ageGroup)) {
          return false;
        }
        
        // NTRP 범위 필터
        if (ad.targetAudience.ntrpRange) {
          const { min, max } = ad.targetAudience.ntrpRange;
          if (user.ntrp < min || user.ntrp > max) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    console.log('필터링 후 광고 수:', filteredAds.length);

    // 우선순위 순으로 정렬하여 첫 번째 광고 반환
    filteredAds.sort((a, b) => a.priority - b.priority);
    const selectedAd = filteredAds[0] || null;
    console.log('선택된 광고:', selectedAd?.title);
    return selectedAd;
  }

  /**
   * 광고 조회수 증가
   */
  static incrementViewCount(adId: string): void {
    const ad = mockAds.find(a => a.id === adId);
    if (ad) {
      ad.viewCount += 1;
      ad.updatedAt = new Date().toISOString();
    }
  }

  /**
   * 광고 클릭수 증가
   */
  static incrementClickCount(adId: string): void {
    const ad = mockAds.find(a => a.id === adId);
    if (ad) {
      ad.clickCount += 1;
      ad.updatedAt = new Date().toISOString();
    }
  }

  /**
   * 오늘 하루 광고 숨기기
   */
  static hideAdsToday(): void {
    try {
      if (typeof window !== 'undefined') {
        const today = new Date().toDateString();
        localStorage.setItem(this.HIDE_TODAY_KEY, today);
      }
    } catch (error) {
      console.warn('localStorage 저장 실패 (네이티브 환경에서는 정상):', error);
    }
  }

  /**
   * 광고 추가
   */
  static addAd(adData: Omit<Ad, 'id' | 'viewCount' | 'clickCount' | 'createdAt' | 'updatedAt'>): Ad {
    const newAd: Ad = {
      ...adData,
      id: `ad_${Date.now()}`,
      viewCount: 0,
      clickCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockAds.push(newAd);
    return newAd;
  }

  /**
   * 광고 수정
   */
  static updateAd(adId: string, updates: Partial<Ad>): boolean {
    const adIndex = mockAds.findIndex(a => a.id === adId);
    if (adIndex === -1) return false;
    
    mockAds[adIndex] = {
      ...mockAds[adIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return true;
  }

  /**
   * 광고 삭제
   */
  static deleteAd(adId: string): boolean {
    const adIndex = mockAds.findIndex(a => a.id === adId);
    if (adIndex === -1) return false;
    
    mockAds.splice(adIndex, 1);
    return true;
  }

  /**
   * 광고 활성화/비활성화
   */
  static toggleAdStatus(adId: string): boolean {
    const ad = mockAds.find(a => a.id === adId);
    if (!ad) return false;
    
    ad.isActive = !ad.isActive;
    ad.updatedAt = new Date().toISOString();
    return true;
  }
}