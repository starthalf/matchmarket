// utils/dataGenerator.ts - NULL 안전 버전

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
  seller_profile_image: string | null;
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
  initial_price: number;  // 이제 항상 NOT NULL
  current_price: number;  // 이제 항상 NOT NULL
  max_price: number;      // 이제 항상 NOT NULL
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
  private static readonly PLAY_STYLES = ['공격형', '수비형', '올라운드'];
  private static readonly CAREER_TYPES = ['동호인', '선수'];

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
    '단식', '남복', '여복', '혼복'
  ];

  /**
   * 🔥 새로운 매치 생성 (NULL 안전 보장)
   */
  static generateNewMatch(): Match {
    const sellerId = `seller_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const matchId = `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 판매자 정보 생성
    const sellerGender = Math.random() > 0.3 ? '남성' : '여성';
    const sellerName = sellerGender === '남성' ? 
      ['김성훈', '이동현', '박준영', '최민석', '정우진'][Math.floor(Math.random() * 5)] :
      ['김지영', '이수진', '박혜린', '최민정', '정유나'][Math.floor(Math.random() * 5)];

    const seller: User = {
      id: sellerId,
      name: sellerName,
      gender: sellerGender,
      ageGroup: ['20대', '30대', '40대'][Math.floor(Math.random() * 3)] as any,
      ntrp: Math.round((3.0 + Math.random() * 2.5) * 10) / 10,
      experience: 12 + Math.floor(Math.random() * 120),
      playStyle: this.PLAY_STYLES[Math.floor(Math.random() * this.PLAY_STYLES.length)] as any,
      careerType: this.CAREER_TYPES[Math.floor(Math.random() * this.CAREER_TYPES.length)] as any,
      certification: {
        ntrp: 'none',
        career: 'none',
        youtube: 'none',
        instagram: 'none',
      },
      profileImage: Math.random() > 0.5 ? `https://picsum.photos/seed/${sellerId}/200/200` : undefined,
      viewCount: Math.floor(Math.random() * 1000),
      likeCount: Math.floor(Math.random() * 200),
      avgRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    };

    const matchType = this.MATCH_TYPES[Math.floor(Math.random() * this.MATCH_TYPES.length)];
    
    // 참가자 수 설정
    let expectedMale = 0;
    let expectedFemale = 0;
    
    switch (matchType) {
      case '단식':
        if (sellerGender === '남성') {
          expectedMale = 2;
          expectedFemale = 0;
        } else {
          expectedMale = 0;
          expectedFemale = 2;
        }
        break;
      case '남복':
        expectedMale = 4;
        expectedFemale = 0;
        break;
      case '여복':
        expectedMale = 0;
        expectedFemale = 4;
        break;
      case '혼복':
        expectedMale = 2;
        expectedFemale = 2;
        break;
    }

    // 🔥 가격 필드 완전 안전 처리
    const basePrice = [15000, 20000, 25000, 30000, 35000][Math.floor(Math.random() * 5)];
    const initialPrice = basePrice;     // 항상 basePrice와 동일
    const currentPrice = basePrice;     // 항상 basePrice와 동일  
    const maxPrice = basePrice * 3;     // 항상 basePrice의 3배

    // 미래 날짜 생성
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 1);
    
    // 시간 생성
    const startHour = 9 + Math.floor(Math.random() * 12);
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(startHour + 2).toString().padStart(2, '0')}:00`;

    return {
      id: matchId,
      sellerId: sellerId,
      seller: seller,
      title: this.generateMatchTitle(matchType),
      date: futureDate.toISOString().split('T')[0],
      time: startTime,
      endTime: endTime,
      court: this.COURTS[Math.floor(Math.random() * this.COURTS.length)],
      description: this.generateMatchDescription(matchType),
      basePrice: basePrice,
      initialPrice: initialPrice,    // ✅ 절대 null 아님
      currentPrice: currentPrice,    // ✅ 절대 null 아님
      maxPrice: maxPrice,            // ✅ 절대 null 아님
      expectedViews: Math.floor(Math.random() * 500) + 200,
      expectedWaitingApplicants: Math.floor(Math.random() * 10) + 1,
      expectedParticipants: {
        male: expectedMale,
        female: expectedFemale,
        total: expectedMale + expectedFemale,
      },
      currentApplicants: {
        male: 0,
        female: 0,
        total: 0,
      },
      matchType: matchType,
      waitingApplicants: 0,
      waitingList: [],
      participants: [],
      adEnabled: Math.random() > 0.7,
      ntrpRequirement: {
        min: 3.0 + Math.floor(Math.random() * 2),
        max: 4.0 + Math.floor(Math.random() * 2),
      },
      weather: Math.random() > 0.8 ? 
        (Math.random() > 0.5 ? '흐림' : '비') : '맑음',
      location: this.LOCATIONS[Math.floor(Math.random() * this.LOCATIONS.length)],
      createdAt: new Date().toISOString(),
      isClosed: false,
    };
  }

  /**
   * 🔥 Supabase 데이터를 Match 객체로 변환 (NULL 안전)
   */
  private static convertSupabaseToMatch(supabaseMatch: SupabaseMatch): Match {
    // 이제 Supabase에서 가져온 데이터는 항상 NOT NULL이므로 안전함
    const basePrice = supabaseMatch.base_price;
    const initialPrice = supabaseMatch.initial_price;  // 항상 유효한 값
    const currentPrice = supabaseMatch.current_price;  // 항상 유효한 값
    const maxPrice = supabaseMatch.max_price;          // 항상 유효한 값

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
        profileImage: supabaseMatch.seller_profile_image || undefined,
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
      basePrice: basePrice,
      initialPrice: initialPrice,    // ✅ 안전한 값
      currentPrice: currentPrice,    // ✅ 안전한 값
      maxPrice: maxPrice,            // ✅ 안전한 값
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

  // utils/dataGenerator.ts - saveMatchToSupabase 함수 완전 수정

static async saveMatchToSupabase(match: Match): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      console.log('ℹ️ Supabase Admin이 설정되지 않아 매치 저장을 건너뜁니다.');
      return false;
    }

    // 🔍 디버깅: 입력된 매치 객체 확인
    console.log('🔍 saveMatchToSupabase 입력 매치:', {
      id: match.id,
      basePrice: match.basePrice,
      initialPrice: match.initialPrice,
      currentPrice: match.currentPrice,
      maxPrice: match.maxPrice,
      types: {
        basePrice: typeof match.basePrice,
        initialPrice: typeof match.initialPrice,
        currentPrice: typeof match.currentPrice,
        maxPrice: typeof match.maxPrice,
      }
    });

    // 🔥 NULL 값 강제 방지 및 명시적 타입 보장
    const safeBasePrice = Number(match.basePrice) || 0;
    const safeInitialPrice = Number(match.initialPrice) || safeBasePrice;
    const safeCurrentPrice = Number(match.currentPrice) || safeBasePrice;
    const safeMaxPrice = Number(match.maxPrice) || (safeBasePrice * 3);

    // 🔍 디버깅: 안전 처리된 값들 확인
    console.log('🔍 안전 처리된 가격들:', {
      safeBasePrice,
      safeInitialPrice,
      safeCurrentPrice,
      safeMaxPrice,
      originalInitialPrice: match.initialPrice,
      isInitialPriceNull: match.initialPrice === null,
      isInitialPriceUndefined: match.initialPrice === undefined
    });

    // Supabase 삽입 데이터 (완전 안전 처리)
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
      seller_profile_image: match.seller.profileImage || null,
      seller_view_count: match.seller.viewCount,
      seller_like_count: match.seller.likeCount,
      seller_avg_rating: match.seller.avgRating,
      title: match.title,
      date: match.date,
      time: match.time,
      end_time: match.endTime,
      court: match.court,
      description: match.description,
      base_price: safeBasePrice,               // ✅ 안전한 값
      initial_price: safeInitialPrice,         // ✅ 절대 null 아님
      current_price: safeCurrentPrice,         // ✅ 절대 null 아님
      max_price: safeMaxPrice,                 // ✅ 절대 null 아님
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

    // 🔍 디버깅: 최종 전송 데이터 확인
    console.log('🔍 최종 Supabase 전송 데이터:', {
      id: supabaseData.id,
      base_price: supabaseData.base_price,
      initial_price: supabaseData.initial_price,
      current_price: supabaseData.current_price,
      max_price: supabaseData.max_price,
      types: {
        base_price: typeof supabaseData.base_price,
        initial_price: typeof supabaseData.initial_price,
        current_price: typeof supabaseData.current_price,
        max_price: typeof supabaseData.max_price,
      }
    });

    const { error } = await supabaseAdmin
      .from('matches')
      .insert([supabaseData]);

    if (error) {
      console.error('❌ Supabase 매치 저장 오류:', error);
      
      // 🔍 상세 에러 분석
      console.error('📋 에러 상세 정보:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      return false;
    }

    console.log(`✅ 매치 ${match.id} Supabase 저장 완료`);
    return true;
  } catch (error) {
    console.error('💥 saveMatchToSupabase 예외 오류:', error);
    return false;
  }
}

  /**
   * Supabase에서 모든 매치 가져오기
   */
  static async getAllMatches(fallbackMatches: Match[]): Promise<Match[]> {
    try {
      console.log('🔄 Supabase에서 매치 데이터 가져오는 중...');
      
      if (!supabase) {
        console.log('ℹ️ Supabase가 설정되지 않아 로컬 데이터만 사용합니다.');
        return fallbackMatches;
      }

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
        return fallbackMatches;
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

  // 헬퍼 메소드들
  private static generateMatchTitle(matchType: '단식' | '남복' | '여복' | '혼복'): string {
    return this.MATCH_TITLES[Math.floor(Math.random() * this.MATCH_TITLES.length)];
  }

  private static generateMatchDescription(matchType: '단식' | '남복' | '여복' | '혼복'): string {
    return this.DESCRIPTIONS[Math.floor(Math.random() * this.DESCRIPTIONS.length)];
  }
}