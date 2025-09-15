// utils/dataGenerator.ts - 완전한 코드

import { Match, User } from '../types/tennis';
import { supabase, supabaseAdmin } from '../lib/supabase';

interface SupabaseMatch {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_gender: string;
  seller_age_group: string;
  seller_ntrp: number;
  seller_experience: number;
  seller_play_style: string;
  seller_career_type: string;
  seller_certification_ntrp: string;
  seller_certification_career: string;
  seller_certification_youtube: string;
  seller_certification_instagram: string;
  seller_profile_image: string;
  seller_view_count: number;
  seller_like_count: number;
  seller_avg_rating: number;
  title: string;
  date: string;
  time: string;
  end_time: string;
  court: string;
  description: string;
  base_price: number;
  initial_price: number;
  current_price: number;
  max_price: number;
  expected_views: number;
  expected_waiting_applicants: number;
  expected_participants_male: number;
  expected_participants_female: number;
  expected_participants_total: number;
  current_applicants_male: number;
  current_applicants_female: number;
  current_applicants_total: number;
  match_type: string;
  waiting_applicants: number;
  ad_enabled: boolean;
  ntrp_min: number;
  ntrp_max: number;
  weather: string;
  location: string;
  is_dummy: boolean;
  created_at: string;
}

export class DataGenerator {
  private static readonly LOCATIONS = [
    '강남구 테니스장', '서초구 테니스장', '송파구 테니스장', '강동구 테니스장',
    '마포구 테니스장', '용산구 테니스장', '성동구 테니스장', '광진구 테니스장',
    '종로구 테니스장', '중구 테니스장', '성북구 테니스장', '강북구 테니스장',
    '도봉구 테니스장', '노원구 테니스장', '은평구 테니스장', '서대문구 테니스장'
  ];

  private static readonly COURTS = ['A코트', 'B코트', 'C코트', 'D코트', 'E코트'];

  private static readonly PLAY_STYLES = [
    '공격형', '수비형', '올라운드'  // 🔥 Supabase CHECK 제약조건과 일치
  ];

  private static readonly CAREER_TYPES = [
    '동호인', '대학선수', '실업선수'  // 🔥 Supabase CHECK 제약조건과 일치
  ];

  private static readonly MATCH_TITLES = [
    '강남 프리미엄 매치', '서초 주말 특별전', '송파 실력자 모임',
    '마포 친선 경기', '용산 레벨업 매치', '성동 테니스 클럽',
    '홍대 테니스 모임', '잠실 주말 경기', '여의도 저녁 매치',
    '건대 대학생 모임', '신촌 복식 대회', '압구정 프리미엄 클럽'
  ];

  private static readonly DESCRIPTIONS = [
    '실력 향상을 위한 진지한 매치입니다. 매너있는 분들만 참여 부탁드립니다.',
    '즐거운 테니스를 위한 친선 경기입니다. 초보자도 환영합니다!',
    '레벨 높은 매치를 원하시는 분들을 위한 특별 경기입니다.',
    '주말 오후 여유로운 테니스 매치입니다. 편안한 분위기에서 즐겨요.',
    '실전 감각을 기르고 싶은 분들을 위한 실력향상 매치입니다.',
    '새로운 사람들과 함께하는 소셜 테니스 모임입니다.',
    '정기적으로 만날 테니스 메이트를 찾고 있어요.',
    '운동도 하고 친목도 다지는 즐거운 시간이 되길 바라요.'
  ];

  private static readonly MATCH_TYPES: Array<'단식' | '남복' | '여복' | '혼복'> = [
    '단식', '남복', '여복', '혼복'  // 🔥 4가지 매치 타입
  ];

  /**
   * 새로운 매치 하나 생성
   */
  static generateNewMatch(): Match {
    const sellerId = `seller_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const matchId = `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 판매자 정보 생성
    const sellerGender = Math.random() > 0.3 ? '남성' : '여성';
    const sellerName = sellerGender === '남성' ? 
      ['김민수', '박준호', '이도현', '정우진', '최재현'][Math.floor(Math.random() * 5)] :
      ['김수연', '박지영', '이소라', '정미나', '최하린'][Math.floor(Math.random() * 5)];

    const seller: User = {
      id: sellerId,
      name: sellerName,
      gender: sellerGender,
      ageGroup: ['20대', '30대', '40대', '50대+'][Math.floor(Math.random() * 4)] as any,
      ntrp: 3.0 + Math.floor(Math.random() * 3) * 0.5, // 3.0, 3.5, 4.0, 4.5, 5.0
      experience: 12 + Math.floor(Math.random() * 48), // 12-60개월
      playStyle: this.PLAY_STYLES[Math.floor(Math.random() * this.PLAY_STYLES.length)] as any,
      careerType: this.CAREER_TYPES[Math.floor(Math.random() * this.CAREER_TYPES.length)] as any,
      certification: {
        ntrp: Math.random() > 0.7 ? 'verified' : 'none',
        career: Math.random() > 0.8 ? 'verified' : 'none',
        youtube: Math.random() > 0.9 ? 'verified' : 'none',
        instagram: Math.random() > 0.85 ? 'verified' : 'none',
      } as any,
      profileImage: `https://picsum.photos/150/150?random=${Math.floor(Math.random() * 1000)}`,
      viewCount: Math.floor(Math.random() * 1000) + 50,
      likeCount: Math.floor(Math.random() * 100) + 10,
      avgRating: 3.5 + Math.random() * 1.5, // 3.5-5.0
    };

    // 매치 타입 선택 (가중치 적용)
    const matchTypeWeights = {
      '혼복': 0.4,  // 40% - 가장 인기
      '남복': 0.25, // 25%
      '여복': 0.25, // 25%  
      '단식': 0.1   // 10% - 가장 적음
    };
    
    const randomValue = Math.random();
    let cumulativeWeight = 0;
    let selectedMatchType: '단식' | '남복' | '여복' | '혼복' = '혼복';
    
    for (const [type, weight] of Object.entries(matchTypeWeights)) {
      cumulativeWeight += weight;
      if (randomValue <= cumulativeWeight) {
        selectedMatchType = type as '단식' | '남복' | '여복' | '혼복';
        break;
      }
    }

    // 매치 타입과 독립적으로 참가자 수 설정 (단순화)
    const totalParticipants = [2, 4, 6, 8][Math.floor(Math.random() * 4)];
    const maleCount = Math.floor(Math.random() * (totalParticipants + 1));
    const femaleCount = totalParticipants - maleCount;
    
    const expectedParticipants = {
      male: maleCount,
      female: femaleCount,
      total: totalParticipants
    };

    // 시간 설정
    const now = new Date();
    const matchDate = new Date(now);
    matchDate.setDate(matchDate.getDate() + Math.floor(Math.random() * 7)); // 0-7일 후

    const startHour = 9 + Math.floor(Math.random() * 13); // 9-21시
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(startHour + 2).toString().padStart(2, '0')}:00`;

    // 가격 설정 (참가자 수에 따라)
    let basePrice: number;
    if (expectedParticipants.total <= 2) {
      basePrice = 20000 + Math.floor(Math.random() * 15000); // 20,000-35,000원
    } else if (expectedParticipants.total <= 4) {
      basePrice = 25000 + Math.floor(Math.random() * 15000); // 25,000-40,000원
    } else {
      basePrice = 30000 + Math.floor(Math.random() * 20000); // 30,000-50,000원
    }

    const initialPrice = basePrice;
    const maxPrice = basePrice * 2; // 최대 2배까지

    // 현재 참가자 수 (랜덤하게 일부 채워짐)
    const fillRatio = Math.random() * 0.8; // 0-80% 정도 채워짐
    const currentMale = Math.floor(expectedParticipants.male * fillRatio);
    const currentFemale = Math.floor(expectedParticipants.female * fillRatio);

    return {
      id: matchId,
      sellerId: seller.id,
      seller: seller,
      title: this.generateMatchTitle(selectedMatchType),
      date: matchDate.toISOString().split('T')[0],
      time: startTime,
      endTime: endTime,
      court: this.COURTS[Math.floor(Math.random() * this.COURTS.length)],
      description: this.generateMatchDescription(selectedMatchType),
      basePrice: basePrice,
      initialPrice: initialPrice,
      currentPrice: initialPrice + Math.floor(Math.random() * (maxPrice - initialPrice)),
      maxPrice: maxPrice,
      expectedViews: 100 + Math.floor(Math.random() * 500),
      expectedWaitingApplicants: Math.floor(Math.random() * 10),
      expectedParticipants: expectedParticipants,
      currentApplicants: {
        male: currentMale,
        female: currentFemale,
        total: currentMale + currentFemale
      },
      matchType: selectedMatchType,
      waitingApplicants: Math.floor(Math.random() * 8),
      waitingList: [], // 빈 배열로 시작
      participants: [], // 빈 배열로 시작
      adEnabled: Math.random() > 0.7,
      ntrpRequirement: {
        min: 3.0 + Math.floor(Math.random() * 2),
        max: 4.5 + Math.floor(Math.random() * 2)
      },
      weather: Math.random() > 0.8 ? 
        (Math.random() > 0.5 ? '흐림' : '비') : '맑음',
      location: this.LOCATIONS[Math.floor(Math.random() * this.LOCATIONS.length)],
      createdAt: new Date().toISOString(),
      isClosed: false,
    };
  }

  /**
   * 매치 타입별 제목 생성 (단순화)
   */
  private static generateMatchTitle(matchType: '단식' | '남복' | '여복' | '혼복'): string {
    return this.MATCH_TITLES[Math.floor(Math.random() * this.MATCH_TITLES.length)];
  }

  /**
   * 매치 타입별 설명 생성 (단순화)
   */
  private static generateMatchDescription(matchType: '단식' | '남복' | '여복' | '혼복'): string {
    return this.DESCRIPTIONS[Math.floor(Math.random() * this.DESCRIPTIONS.length)];
  }



  /**
   * Supabase에서 모든 매치 가져오기
   */
  static async getAllMatches(fallbackMatches: Match[]): Promise<Match[]> {
    try {
      console.log('🔄 Supabase에서 매치 데이터 가져오는 중...');
      
      const { data: supabaseMatches, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Supabase 조회 오류:', error.message);
        return fallbackMatches;
      }

      if (!supabaseMatches || supabaseMatches.length === 0) {
        console.log('📝 Supabase에 저장된 매치가 없습니다. 로컬 데이터만 사용합니다.');
        return fallbackMatches; // 🔥 더미 데이터 자동 생성 제거
      }

      // Supabase 데이터를 Match 형태로 변환
      const convertedMatches = supabaseMatches.map(this.convertSupabaseToMatch);
      console.log(`✅ Supabase에서 ${convertedMatches.length}개 매치 로드 완료`);
      
      return convertedMatches;
    } catch (error) {
      console.error('💥 getAllMatches 오류:', error);
      return fallbackMatches;
    }
  }

  /**
   * Supabase 데이터를 Match 객체로 변환
   */
  private static convertSupabaseToMatch(supabaseMatch: SupabaseMatch): Match {
    return {
      id: supabaseMatch.id,
      sellerId: supabaseMatch.seller_id,
      seller: {
        id: supabaseMatch.seller_id,
        name: supabaseMatch.seller_name,
        gender: supabaseMatch.seller_gender as '남성' | '여성',
        ageGroup: supabaseMatch.seller_age_group as any,
        ntrp: supabaseMatch.seller_ntrp,
        experience: supabaseMatch.seller_experience,
        playStyle: supabaseMatch.seller_play_style as any,
        careerType: supabaseMatch.seller_career_type as any,
        certification: {
          ntrp: supabaseMatch.seller_certification_ntrp as any,
          career: supabaseMatch.seller_certification_career as any,
          youtube: supabaseMatch.seller_certification_youtube as any,
          instagram: supabaseMatch.seller_certification_instagram as any,
        },
        profileImage: supabaseMatch.seller_profile_image,
        viewCount: supabaseMatch.seller_view_count,
        likeCount: supabaseMatch.seller_like_count,
        avgRating: supabaseMatch.seller_avg_rating,
      },
      title: supabaseMatch.title,
      date: supabaseMatch.date,
      time: supabaseMatch.time,
      endTime: supabaseMatch.end_time,
      court: supabaseMatch.court,
      description: supabaseMatch.description,
      basePrice: supabaseMatch.base_price,
      initialPrice: supabaseMatch.initial_price,
      currentPrice: supabaseMatch.current_price,
      maxPrice: supabaseMatch.max_price,
      expectedViews: supabaseMatch.expected_views,
      expectedWaitingApplicants: supabaseMatch.expected_waiting_applicants,
      expectedParticipants: {
        male: supabaseMatch.expected_participants_male,
        female: supabaseMatch.expected_participants_female,
        total: supabaseMatch.expected_participants_total,
      },
      currentApplicants: {
        male: supabaseMatch.current_applicants_male,
        female: supabaseMatch.current_applicants_female,
        total: supabaseMatch.current_applicants_total,
      },
      matchType: supabaseMatch.match_type as '단식' | '남복' | '여복' | '혼복',
      waitingApplicants: supabaseMatch.waiting_applicants,
      waitingList: [],
      participants: [],
      adEnabled: supabaseMatch.ad_enabled,
      ntrpRequirement: {
        min: supabaseMatch.ntrp_min,
        max: supabaseMatch.ntrp_max,
      },
      weather: supabaseMatch.weather as '맑음' | '흐림' | '비',
      location: supabaseMatch.location,
      createdAt: supabaseMatch.created_at,
      isClosed: false,
    };
  }

  /**
   * 매치를 Supabase에 저장
   */
  static async saveMatchToSupabase(match: Match): Promise<boolean> {
    try {
      const supabaseData = {
        id: match.id,
        seller_id: match.sellerId,
        seller_name: match.seller.name,
        seller_gender: match.seller.gender,
        seller_age_group: match.seller.ageGroup,
        seller_ntrp: match.seller.ntrp,
        seller_experience: match.seller.experience,
        seller_play_style: match.seller.playStyle,
        seller_career_type: match.seller.careerType,
        seller_certification_ntrp: match.seller.certification.ntrp,
        seller_certification_career: match.seller.certification.career,
        seller_certification_youtube: match.seller.certification.youtube,
        seller_certification_instagram: match.seller.certification.instagram,
        seller_profile_image: match.seller.profileImage,
        seller_view_count: match.seller.viewCount,
        seller_like_count: match.seller.likeCount,
        seller_avg_rating: match.seller.avgRating,
        title: match.title,
        date: match.date,
        time: match.time,
        end_time: match.endTime,
        court: match.court,
        description: match.description,
        base_price: match.basePrice,
        initial_price: match.initialPrice,
        current_price: match.currentPrice,
        max_price: match.maxPrice,
        expected_views: match.expectedViews,
        expected_waiting_applicants: match.expectedWaitingApplicants,
        expected_participants_male: match.expectedParticipants.male,
        expected_participants_female: match.expectedParticipants.female,
        expected_participants_total: match.expectedParticipants.total,
        current_applicants_male: match.currentApplicants.male,
        current_applicants_female: match.currentApplicants.female,
        current_applicants_total: match.currentApplicants.total,
        match_type: match.matchType,
        waiting_applicants: match.waitingApplicants,
        ad_enabled: match.adEnabled,
        ntrp_min: match.ntrpRequirement.min,
        ntrp_max: match.ntrpRequirement.max,
        weather: match.weather,
        location: match.location,
        is_dummy: true,
        created_at: match.createdAt,
      };

      const { error } = await supabaseAdmin
        .from('matches')
        .insert([supabaseData]);

      if (error) {
        console.error('Supabase 매치 저장 오류:', error);
        return false;
      }

      console.log(`✅ 매치 ${match.id} Supabase 저장 완료`);
      return true;
    } catch (error) {
      console.error('saveMatchToSupabase 오류:', error);
      return false;
    }
  }

  /**
   * 특정 매치 타입의 더미 매치 생성 (테스트용)
   */
  static generateMatchByType(matchType: Match['matchType']): Match {
    const match = this.generateNewMatch();
    return { ...match, matchType };
  }

  /**
   * 매치 통계 생성
   */
  static generateMatchStats(matches: Match[]) {
    const stats = {
      total: matches.length,
      byType: {
        '단식': 0,
        '남복': 0,
        '여복': 0,
        '혼복': 0,
      },
      avgPrice: 0,
      avgParticipants: 0,
    };

    matches.forEach(match => {
      stats.byType[match.matchType]++;
      stats.avgPrice += match.currentPrice;
      stats.avgParticipants += match.expectedParticipants.total;
    });

    stats.avgPrice = Math.round(stats.avgPrice / matches.length);
    stats.avgParticipants = Math.round((stats.avgParticipants / matches.length) * 10) / 10;

    return stats;
  }
}