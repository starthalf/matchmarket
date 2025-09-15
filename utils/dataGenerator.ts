import { Match, Seller } from '../types/tennis';
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
    '베이스라이너', '올라운드', '공격형', '수비형', 
    '네트플레이어', '파워형', '컨트롤형', '카운터형'
  ];

  private static readonly CAREER_TYPES = [
    '동호인', '선수'
  ];

  private static readonly MATCH_TITLES = [
    '강남 프리미엄 매치', '서초 주말 특별전', '송파 실력자 모임',
    '마포 친선 경기', '용산 레벨업 매치', '성동 테니스 클럽',
  ];

  private static readonly DESCRIPTIONS = [
    '실력 향상을 위한 진지한 매치입니다. 매너있는 분들만 참여 부탁드립니다.',
    '즐거운 테니스를 위한 친선 경기입니다. 초보자도 환영합니다!',
    '레벨 높은 매치를 원하시는 분들을 위한 특별 경기입니다.',
    '주말 오후 여유로운 테니스 매치입니다. 편안한 분위기에서 즐겨요.',
    '실전 감각을 기르고 싶은 분들을 위한 실력향상 매치입니다.'
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
      `김코치${Math.floor(Math.random() * 100)}` : 
      `이코치${Math.floor(Math.random() * 100)}`;
    
    const seller: Seller = {
      id: sellerId,
      name: sellerName,
      gender: sellerGender,
      ageGroup: ['20-25', '26-30', '31-35', '36-40', '41-45'][Math.floor(Math.random() * 5)] as any,
      ntrp: Math.round((3.0 + Math.random() * 3.5) * 10) / 10, // 3.0 ~ 6.5
      experience: 12 + Math.floor(Math.random() * 120), // 1~10년 경력 (개월 단위에서 년 단위로 변경)
      playStyle: this.PLAY_STYLES[Math.floor(Math.random() * this.PLAY_STYLES.length)],
      careerType: this.CAREER_TYPES[Math.floor(Math.random() * this.CAREER_TYPES.length)],
      certification: {
        ntrp: Math.random() > 0.7 ? 'verified' : 'pending',
        career: Math.random() > 0.8 ? 'verified' : 'none',
        youtube: Math.random() > 0.9 ? 'verified' : 'none',
        instagram: Math.random() > 0.6 ? 'verified' : 'none',
      },
      profileImage: `https://picsum.photos/seed/${sellerId}/400/400`,
      viewCount: 50 + Math.floor(Math.random() * 1000),
      likeCount: 10 + Math.floor(Math.random() * 200),
      avgRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, // 3.5 ~ 5.0
    };

    // 매치 기본 정보
    const basePrice = 15000 + Math.floor(Math.random() * 35000); // 15,000 ~ 50,000
    const initialPrice = basePrice + Math.floor(Math.random() * 10000);
    const maxPrice = Math.min(initialPrice * 2, 100000);
    
    // 날짜 설정 (오늘부터 7일 이내)
    const matchDate = new Date();
    matchDate.setDate(matchDate.getDate() + Math.floor(Math.random() * 7));
    
    // 시간 설정 (오전 9시 ~ 오후 8시)
    const startHour = 9 + Math.floor(Math.random() * 12);
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(startHour + 2).toString().padStart(2, '0')}:00`;

    // 참가자 수 설정
    const isDoubles = Math.random() > 0.3;
    const expectedParticipants = isDoubles ? 
      { male: 2, female: 2, total: 4 } : 
      { male: 1, female: 1, total: 2 };
    
    // 매치 인원을 항상 가득 채움 (수정된 부분)
    const currentMale = expectedParticipants.male;
    const currentFemale = expectedParticipants.female;

    return {
      id: matchId,
      sellerId: seller.id,
      seller: seller,
      title: this.MATCH_TITLES[Math.floor(Math.random() * this.MATCH_TITLES.length)],
      date: matchDate.toISOString().split('T')[0],
      time: startTime,
      endTime: endTime,
      court: this.COURTS[Math.floor(Math.random() * this.COURTS.length)],
      description: this.DESCRIPTIONS[Math.floor(Math.random() * this.DESCRIPTIONS.length)],
      basePrice: basePrice,
      initialPrice: initialPrice,
      currentPrice: initialPrice + Math.floor(Math.random() * (maxPrice - initialPrice)),
      maxPrice: maxPrice,
      expectedViews: 100 + Math.floor(Math.random() * 500),
      expectedWaitingApplicants: Math.floor(Math.random() * 10),
      expectedParticipants: expectedParticipants,
      currentApplicants: {
        male: expectedParticipants.male,
        female: expectedParticipants.female,
        total: expectedParticipants.male + expectedParticipants.female
      },
      matchType: isDoubles ? '복식' : '단식',
      waitingApplicants: Math.floor(Math.random() * 8),
      waitingList: [], // 빈 배열로 시작
      participants: [], // 빈 배열로 시작
      adEnabled: Math.random() > 0.7,
      ntrpRequirement: {
        min: 3.0 + Math.floor(Math.random() * 2),
        max: 4.5 + Math.floor(Math.random() * 2)
      },
      weather: Math.random() > 0.8 ? '흐림' : '맑음',
      location: this.LOCATIONS[Math.floor(Math.random() * this.LOCATIONS.length)],
      createdAt: new Date().toISOString(),
      isClosed: false,
    };
  }

  /**
   * Match를 Supabase 형식으로 변환
   */
  static matchToSupabaseFormat(match: Match): Omit<SupabaseMatch, 'created_at'> {
    return {
      id: match.id,
      seller_id: match.seller.id,
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
    };
  }

  /**
   * Supabase 형식을 Match로 변환
   */
  static supabaseToMatchFormat(supabaseMatch: SupabaseMatch): Match {
    const seller: Seller = {
      id: supabaseMatch.seller_id,
      name: supabaseMatch.seller_name,
      gender: supabaseMatch.seller_gender as '남성' | '여성',
      ageGroup: supabaseMatch.seller_age_group as any,
      ntrp: supabaseMatch.seller_ntrp,
      experience: supabaseMatch.seller_experience,
      playStyle: supabaseMatch.seller_play_style,
      careerType: supabaseMatch.seller_career_type === '대학선수' || supabaseMatch.seller_career_type === '실업선수' 
        ? '선수' 
        : supabaseMatch.seller_career_type as '동호인' | '선수',
      certification: {
        ntrp: supabaseMatch.seller_certification_ntrp as 'none' | 'pending' | 'verified',
        career: supabaseMatch.seller_certification_career as 'none' | 'pending' | 'verified',
        youtube: supabaseMatch.seller_certification_youtube as 'none' | 'pending' | 'verified',
        instagram: supabaseMatch.seller_certification_instagram as 'none' | 'pending' | 'verified',
      },
      profileImage: supabaseMatch.seller_profile_image,
      viewCount: supabaseMatch.seller_view_count,
      likeCount: supabaseMatch.seller_like_count,
      avgRating: supabaseMatch.seller_avg_rating,
    };

    return {
      id: supabaseMatch.id,
      sellerId: supabaseMatch.seller_id,
      seller: seller,
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
      matchType: supabaseMatch.match_type as '단식' | '복식',
      waitingApplicants: supabaseMatch.waiting_applicants,
      waitingList: [], // 더미 데이터에서는 빈 배열로 설정
      participants: [], // 참가자 목록 초기화
      adEnabled: supabaseMatch.ad_enabled,
      ntrpRequirement: {
        min: supabaseMatch.ntrp_min,
        max: supabaseMatch.ntrp_max,
      },
      weather: supabaseMatch.weather as '맑음' | '흐림',
      location: supabaseMatch.location,
      createdAt: supabaseMatch.created_at,
      isClosed: false, // 데이터베이스에 is_closed 컬럼이 없으므로 기본값 false 사용
    };
  }

  /**
   * 매일 새로운 더미 매치들 생성 및 Supabase에 저장 - 10개로 변경
   */
  static async generateAndSaveDailyMatches(count: number = 10): Promise<Match[]> {
    try {
      // Supabase Admin 연결 확인
      if (!supabaseAdmin) {
        console.log('ℹ️ Supabase Admin 클라이언트가 설정되지 않음. 로컬 더미 데이터만 사용합니다.');
        return [];
      }

      const newMatches: Match[] = [];
      
      for (let i = 0; i < count; i++) {
        newMatches.push(this.generateNewMatch());
      }
      
      try {
        // Supabase에 저장 (supabaseAdmin 사용)
        const supabaseMatches = newMatches.map(match => this.matchToSupabaseFormat(match));
        
        const { data, error } = await supabaseAdmin
          .from('matches')
          .insert(supabaseMatches);
        
        if (error) {
          console.log('ℹ️ Supabase 저장 실패:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          console.log('로컬 더미 데이터를 사용합니다.');
          return [];
        }
        
        console.log(`✅ ${newMatches.length}개의 새로운 더미 매치가 Supabase에 저장되었습니다.`);
        return newMatches;
      } catch (supabaseError: any) {
        console.log('ℹ️ Supabase 저장 중 네트워크 오류:', {
          message: supabaseError?.message || '알 수 없는 오류',
          code: supabaseError?.code,
          name: supabaseError?.name
        });
        console.log('로컬 더미 데이터를 사용합니다.');
        return [];
      }
    } catch (error: any) {
      console.log('ℹ️ 더미 매치 생성 중 오류:', {
        message: error?.message || '알 수 없는 오류',
        name: error?.name
      });
      return [];
    }
  }

  /**
   * Supabase에서 모든 매치 가져오기 (더미 + 실제)
   */
  static async getAllMatches(fallbackMatches: Match[] = []): Promise<Match[]> {
    try {
      if (!supabase) {
        console.log('ℹ️ Supabase 클라이언트가 설정되지 않음. 로컬 데이터만 사용합니다.');
        return fallbackMatches;
      }

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('ℹ️ Supabase에서 매치 조회 실패:', {
          message: error.message,
          code: error.code
        });
        return fallbackMatches;
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ Supabase에 저장된 매치가 없습니다. 로컬 데이터를 사용합니다.');
        return fallbackMatches;
      }

      const matches = data.map(supabaseMatch => this.supabaseToMatchFormat(supabaseMatch));
      console.log(`✅ Supabase에서 ${matches.length}개의 매치를 불러왔습니다.`);
      
      // 로컬 매치와 합치기 (중복 제거)
      const allMatches = [...matches];
      
      // 로컬 매치 중 Supabase에 없는 것만 추가
      fallbackMatches.forEach(localMatch => {
        const exists = matches.some(match => match.id === localMatch.id);
        if (!exists) {
          allMatches.push(localMatch);
        }
      });
      
      return allMatches;
    } catch (error: any) {
      console.log('ℹ️ Supabase 매치 조회 중 네트워크 오류:', {
        message: error?.message || '알 수 없는 오류',
        name: error?.name
      });
      return fallbackMatches;
    }
  }

  /**
   * 새로운 더미 매치 생성이 필요한지 확인
   */
  static async shouldGenerateNewMatches(): Promise<boolean> {
    try {
      if (!supabaseAdmin) {
        console.log('ℹ️ Supabase Admin 설정되지 않음. 더미 매치 생성을 건너뜁니다.');
        return false;
      }

      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('value')
        .eq('key', 'last_dummy_generation_date')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116은 "not found" 에러
        console.log('ℹ️ 설정 조회 실패:', error.message);
        return false;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastGenDate = data?.value || '2024-01-01';

      return lastGenDate !== today;
    } catch (error: any) {
      console.log('ℹ️ 더미 매치 생성 필요 여부 확인 중 오류:', error?.message);
      return false;
    }
  }

  /**
   * 마지막 더미 매치 생성 날짜 업데이트
   */
  static async updateLastGenerationDate(): Promise<void> {
    try {
      if (!supabaseAdmin) {
        console.log('ℹ️ Supabase Admin이 설정되지 않아 날짜 업데이트를 건너뜁니다.');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabaseAdmin
        .from('app_settings')
        .upsert({ 
          key: 'last_dummy_generation_date', 
          value: today 
        });

      if (error) {
        console.log('ℹ️ 마지막 생성 날짜 업데이트 실패:', error.message);
      } else {
        console.log(`✅ 마지막 더미 매치 생성 날짜가 ${today}로 업데이트되었습니다.`);
      }
    } catch (error: any) {
      console.log('ℹ️ 날짜 업데이트 중 오류:', error?.message);
    }
  }

  /**
   * 현재 더미 매치 개수 조회
   */
  static async getDummyMatchCount(): Promise<number> {
    try {
      if (!supabase) {
        console.log('ℹ️ Supabase가 설정되지 않아 더미 매치 개수를 조회할 수 없습니다.');
        return 0;
      }

      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('is_dummy', true);

      if (error) {
        console.log('ℹ️ 더미 매치 개수 조회 실패:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.log('ℹ️ 더미 매치 개수 조회 중 오류:', error?.message);
      return 0;
    }
  }
}