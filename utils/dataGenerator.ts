// utils/dataGenerator.ts - 개선된 버전 (닉네임, 코트명, 마감 로직 수정)

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
  is_closed?: boolean; // 🔥 is_closed 필드 추가
}

export class DataGenerator {
  // 🌍 지역별 테니스장
  private static readonly LOCATIONS = [
    '강남구 테니스장', '서초구 테니스장', '송파구 테니스장', '강동구 테니스장',
    '마포구 테니스장', '용산구 테니스장', '성동구 테니스장', '광진구 테니스장',
    '종로구 테니스장', '중구 테니스장', '성북구 테니스장', '강북구 테니스장',
    '도봉구 테니스장', '노원구 테니스장', '은평구 테니스장', '서대문구 테니스장'
  ];

  // 🎾 실제 서울 테니스 코트명 리스트
  private static readonly SEOUL_COURTS = [
    // 강남권
    '강남테니스장 A코트', '강남테니스장 B코트', '강남테니스장 C코트',
    '서초테니스장 1코트', '서초테니스장 2코트', '서초테니스장 3코트',
    '송파테니스장 메인코트', '송파테니스장 보조코트',
    '잠실테니스장 센터코트', '잠실테니스장 사이드코트',
    
    // 서북권
    '마포테니스장 A코트', '마포테니스장 B코트',
    '홍대테니스클럽 1번코트', '홍대테니스클럽 2번코트',
    '상암테니스장 메인코트', '상암테니스장 서브코트',
    
    // 동북권
    '성북테니스장 1코트', '성북테니스장 2코트',
    '노원테니스장 A코트', '노원테니스장 B코트',
    '도봉테니스장 중앙코트', '도봉테니스장 동편코트',
    
    // 중구권
    '종로테니스장 1번코트', '종로테니스장 2번코트',
    '중구테니스장 메인코트', '중구테니스장 연습코트',
    '용산테니스장 A코트', '용산테니스장 B코트'
  ];

  // 🎭 닉네임 생성용 단어 조합
  private static readonly NICKNAME_PREFIXES = [
    'tennis', 'racket', 'serve', 'smash', 'ace', 'net', 'court', 'match', 
    'game', 'volley', 'spin', 'power', 'speed', 'pro', 'master', 'legend',
    'moon', 'star', 'sun', 'ocean', 'fire', 'ice', 'wind', 'storm',
    'gold', 'silver', 'diamond', 'ruby', 'pearl', 'crystal'
  ];
  
  private static readonly NICKNAME_SUFFIXES = [
    'player', 'king', 'queen', 'ace', 'pro', 'master', 'hero', 'star',
    'hunter', 'warrior', 'knight', 'ranger', 'wizard', 'ninja', 'samurai',
    'phoenix', 'dragon', 'tiger', 'eagle', 'lion', 'wolf', 'bear',
    'vibes', 'dreams', 'soul', 'heart', 'spirit', 'magic', 'power'
  ];

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
   * 🎭 닉네임 생성기
   */
  private static generateNickname(): string {
    const prefix = this.NICKNAME_PREFIXES[Math.floor(Math.random() * this.NICKNAME_PREFIXES.length)];
    const suffix = this.NICKNAME_SUFFIXES[Math.floor(Math.random() * this.NICKNAME_SUFFIXES.length)];
    const separator = Math.random() > 0.5 ? '.' : '_';
    
    // 숫자 추가 확률 30%
    const addNumber = Math.random() < 0.3;
    const number = addNumber ? Math.floor(Math.random() * 999) + 1 : '';
    
    return `${prefix}${separator}${suffix}${number}`;
  }

  /**
   * 새로운 매치 생성 (개선된 버전)
   */
  static generateNewMatch(): Match {
    const sellerId = `seller_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const matchId = `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 판매자 정보 생성
    const sellerGender = Math.random() > 0.3 ? '남성' : '여성';
    
    // 🎭 닉네임으로 변경!
    const sellerName = this.generateNickname();

    // 🔥 인증 상태 랜덤 생성 (30% 확률로 인증)
    const hasNtrpCert = Math.random() < 0.3;
    const hasCareerCert = Math.random() < 0.2;
    const hasYoutubeCert = Math.random() < 0.1;
    const hasInstagramCert = Math.random() < 0.15;

    const seller: User = {
      id: sellerId,
      name: sellerName, // 🔥 이제 닉네임으로 표시됨
      gender: sellerGender,
      ageGroup: ['20대', '30대', '40대'][Math.floor(Math.random() * 3)] as any,
      ntrp: Math.round((3.0 + Math.random() * 2.5) * 10) / 10,
      experience: 12 + Math.floor(Math.random() * 120),
      playStyle: this.PLAY_STYLES[Math.floor(Math.random() * this.PLAY_STYLES.length)] as any,
      careerType: this.CAREER_TYPES[Math.floor(Math.random() * this.CAREER_TYPES.length)] as any,
      certification: {
        ntrp: hasNtrpCert ? 'verified' : 'none',
        career: hasCareerCert ? 'verified' : 'none',
        youtube: hasYoutubeCert ? 'verified' : 'none',
        instagram: hasInstagramCert ? 'verified' : 'none',
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

    // 🔥 70% 이상 매치를 마감 상태로 생성
    const shouldBeClosed = Math.random() < 0.75; // 75% 확률로 마감
    
    // 현재 참가자 수 설정
    let currentMale = 0;
    let currentFemale = 0;
    
    if (shouldBeClosed) {
      // 마감된 매치: 모집 인원을 모두 채움
      currentMale = expectedMale;
      currentFemale = expectedFemale;
    } else {
      // 진행 중인 매치: 부분적으로 채움 (20~80%)
      const fillRate = 0.2 + Math.random() * 0.6; // 20~80%
      currentMale = Math.floor(expectedMale * fillRate);
      currentFemale = Math.floor(expectedFemale * fillRate);
    }

    // 가격 설정
    const basePrice = [15000, 20000, 25000, 30000, 35000][Math.floor(Math.random() * 5)];
    const initialPrice = basePrice;
    const currentPrice = basePrice;
    const maxPrice = basePrice * 3;

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
      court: this.SEOUL_COURTS[Math.floor(Math.random() * this.SEOUL_COURTS.length)], // 🔥 실제 코트명 사용
      description: this.generateMatchDescription(matchType),
      basePrice: basePrice,
      initialPrice: initialPrice,
      currentPrice: currentPrice,
      maxPrice: maxPrice,
      expectedViews: Math.floor(Math.random() * 500) + 200,
      expectedWaitingApplicants: Math.floor(Math.random() * 10) + 1,
      expectedParticipants: {
        male: expectedMale,
        female: expectedFemale,
        total: expectedMale + expectedFemale,
      },
      currentApplicants: {
        male: currentMale,
        female: currentFemale,
        total: currentMale + currentFemale,
      },
      matchType: matchType,
      waitingApplicants: shouldBeClosed ? Math.floor(Math.random() * 5) : 0, // 마감된 매치에만 대기자
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
      isClosed: shouldBeClosed, // 🔥 75% 확률로 마감 처리
    };
  }

  /**
   * Supabase 데이터를 Match 객체로 변환
   */
  private static convertSupabaseToMatch(supabaseMatch: SupabaseMatch): Match {
    const basePrice = supabaseMatch.base_price || 0;
    const initialPrice = supabaseMatch.initial_price || basePrice;
    const currentPrice = supabaseMatch.current_price || basePrice;
    const maxPrice = supabaseMatch.max_price || (basePrice * 3);

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
      initialPrice: initialPrice,
      currentPrice: currentPrice,
      maxPrice: maxPrice,
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
      isClosed: (supabaseMatch as any).is_closed || false, // 🔥 Supabase에서 가져온 is_closed 값 사용
    };
  }

  /**
   * 매치를 Supabase에 저장
   */
  static async saveMatchToSupabase(match: Match): Promise<boolean> {
    try {
      if (!supabaseAdmin) {
        console.log('ℹ️ Supabase Admin이 설정되지 않아 매치 저장을 건너뜁니다.');
        return false;
      }

      const safeBasePrice = Number(match.basePrice) || 0;
      const safeInitialPrice = Number(match.initialPrice) || safeBasePrice;
      const safeCurrentPrice = Number(match.currentPrice) || safeBasePrice;
      const safeMaxPrice = Number(match.maxPrice) || (safeBasePrice * 3);

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
        base_price: safeBasePrice,
        initial_price: safeInitialPrice,
        current_price: safeCurrentPrice,
        max_price: safeMaxPrice,
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
        is_closed: match.isClosed || false, // 🔥 isClosed 상태를 Supabase에 저장
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

  // ... (나머지 메서드들은 기존 코드와 동일)

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

      const convertedMatches = supabaseMatches.map(this.convertSupabaseToMatch);
      console.log(`✅ Supabase에서 ${convertedMatches.length}개 매치 로드 완료`);
      
      return convertedMatches;
    } catch (error) {
      console.error('💥 getAllMatches 오류:', error);
      return fallbackMatches;
    }
  }

  /**
   * 일회성으로 지정된 개수만큼 더미 매치 생성
   */
  static async generateOneTimeDummyMatches(count: number = 10): Promise<Match[]> {
    try {
      if (!supabaseAdmin) {
        console.log('ℹ️ Supabase Admin 클라이언트가 설정되지 않음. 로컬 더미 데이터만 사용합니다.');
        return [];
      }

      const newMatches: Match[] = [];
      
      console.log(`🎾 일회성 더미 매치 ${count}개 생성 시작...`);
      
      for (let i = 0; i < count; i++) {
        newMatches.push(this.generateNewMatch());
      }
      
      try {
        const savePromises = newMatches.map(match => this.saveMatchToSupabase(match));
        const results = await Promise.all(savePromises);
        
        const successCount = results.filter(result => result).length;
        
        if (successCount === 0) {
          console.log('❌ 모든 매치 저장 실패');
          return [];
        }
        
        console.log(`✅ ${successCount}개의 일회성 더미 매치가 Supabase에 저장되었습니다.`);
        return newMatches.slice(0, successCount);
        
      } catch (supabaseError: any) {
        console.log('ℹ️ Supabase 저장 중 오류:', supabaseError?.message);
        return [];
      }
      
    } catch (error: any) {
      console.log('ℹ️ 일회성 더미 매치 생성 중 오류:', error?.message);
      return [];
    }
  }

  /**
   * 모든 더미 매치 삭제
   */
  static async deleteAllDummyMatches(): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    try {
      if (!supabaseAdmin) {
        console.log('ℹ️ Supabase Admin 클라이언트가 설정되지 않음. 삭제를 건너뜁니다.');
        return {
          success: false,
          deletedCount: 0,
          error: 'Supabase Admin 연결이 설정되지 않았습니다.'
        };
      }

      const currentCount = await this.getDummyMatchCount();
      console.log(`📊 삭제할 더미 매치: ${currentCount}개`);

      const { error } = await supabaseAdmin
        .from('matches')
        .delete()
        .eq('is_dummy', true);

      if (error) {
        console.log('ℹ️ 더미 매치 삭제 실패:', error.message);
        return {
          success: false,
          deletedCount: 0,
          error: error.message
        };
      }

      console.log(`✅ ${currentCount}개의 더미 매치가 성공적으로 삭제되었습니다.`);
      
      return {
        success: true,
        deletedCount: currentCount,
      };

    } catch (error: any) {
      console.log('ℹ️ 더미 매치 삭제 중 오류:', error?.message);
      return {
        success: false,
        deletedCount: 0,
        error: error?.message || '알 수 없는 오류'
      };
    }
  }

  /**
   * 현재 더미 매치 개수 조회
   */
  static async getDummyMatchCount(): Promise<number> {
    try {
      if (!supabase) {
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

  // 헬퍼 메소드들
  private static generateMatchTitle(matchType: '단식' | '남복' | '여복' | '혼복'): string {
    return this.MATCH_TITLES[Math.floor(Math.random() * this.MATCH_TITLES.length)];
  }

  private static generateMatchDescription(matchType: '단식' | '남복' | '여복' | '혼복'): string {
    return this.DESCRIPTIONS[Math.floor(Math.random() * this.DESCRIPTIONS.length)];
  }

  /**
   * 매치 통계 생성
   */
  static generateMatchStats(matches: Match[]) {
    const stats = {
      total: matches.length,
      closed: matches.filter(m => m.isClosed).length,
      active: matches.filter(m => !m.isClosed).length,
      byType: {
        '단식': 0,
        '남복': 0,
        '여복': 0,
        '혼복': 0,
      },
      avgPrice: 0,
      avgParticipants: 0,
      totalNicknames: new Set(matches.map(m => m.seller.name)).size, // 고유 닉네임 수
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

  /**
   * 매일 새로운 더미 매치들 생성 및 Supabase에 저장
   */
  static async generateAndSaveDailyMatches(count: number = 10): Promise<Match[]> {
    try {
      if (!supabaseAdmin) {
        console.log('ℹ️ Supabase Admin 클라이언트가 설정되지 않음. 로컬 더미 데이터만 사용합니다.');
        return [];
      }

      const newMatches: Match[] = [];
      
      for (let i = 0; i < count; i++) {
        newMatches.push(this.generateNewMatch());
      }
      
      try {
        const savePromises = newMatches.map(match => this.saveMatchToSupabase(match));
        const results = await Promise.all(savePromises);
        
        const successCount = results.filter(result => result).length;
        console.log(`✅ ${successCount}개의 새로운 더미 매치가 Supabase에 저장되었습니다.`);
        return newMatches.slice(0, successCount);
        
      } catch (supabaseError: any) {
        console.log('ℹ️ Supabase 저장 중 오류:', supabaseError?.message);
        return [];
      }
    } catch (error: any) {
      console.log('ℹ️ 더미 매치 생성 중 오류:', error?.message);
      return [];
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

      if (error && error.code !== 'PGRST116') {
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
   * 특정 매치 타입의 더미 매치 생성 (테스트용)
   */
  static generateMatchByType(matchType: Match['matchType']): Match {
    const match = this.generateNewMatch();
    return { ...match, matchType };
  }

  /**
   * 닉네임 생성 테스트 메서드 (디버그용)
   */
  static testNicknameGeneration(count: number = 10): string[] {
    const nicknames: string[] = [];
    for (let i = 0; i < count; i++) {
      nicknames.push(this.generateNickname());
    }
    return nicknames;
  }

  /**
   * 서울 테니스 코트 리스트 반환 (디버그용)
   */
  static getSeoulCourts(): string[] {
    return [...this.SEOUL_COURTS];
  }
}