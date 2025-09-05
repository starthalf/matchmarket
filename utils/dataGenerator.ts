import { Match, User } from '../types/tennis';
import { supabase, supabaseAdmin, SupabaseMatch } from '../lib/supabase';

// 더 자연스럽고 다양한 더미 사용자 데이터
const dummyUsers: User[] = [
  // 여성 사용자들
  {
    id: 'dummy_f1',
    name: 'aesthetic.vibes',
    gender: '여성',
    ageGroup: '20대',
    ntrp: 4.2,
    experience: 30,
    playStyle: '공격형',
    careerType: '대학선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'none', instagram: 'verified' },
    profileImage: 'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 1850,
    likeCount: 142,
    avgRating: 4.7,
  },
  {
    id: 'dummy_f2',
    name: 'moonlight.cafe',
    gender: '여성',
    ageGroup: '30대',
    ntrp: 3.8,
    experience: 42,
    playStyle: '올라운드',
    careerType: '실업선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'verified', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 2100,
    likeCount: 189,
    avgRating: 4.8,
  },
  {
    id: 'dummy_f3',
    name: 'cherry.blossom',
    gender: '여성',
    ageGroup: '20대',
    ntrp: 3.5,
    experience: 24,
    playStyle: '수비형',
    careerType: '동호인',
    certification: { ntrp: 'pending', career: 'none', youtube: 'none', instagram: 'verified' },
    profileImage: 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 980,
    likeCount: 76,
    avgRating: 4.4,
  },
  {
    id: 'dummy_f4',
    name: 'golden.hour',
    gender: '여성',
    ageGroup: '30대',
    ntrp: 4.0,
    experience: 36,
    playStyle: '공격형',
    careerType: '대학선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'none', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 1650,
    likeCount: 128,
    avgRating: 4.6,
  },
  {
    id: 'dummy_f5',
    name: 'vintage.soul',
    gender: '여성',
    ageGroup: '40대',
    ntrp: 3.2,
    experience: 18,
    playStyle: '올라운드',
    careerType: '동호인',
    certification: { ntrp: 'none', career: 'none', youtube: 'none', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1858144/pexels-photo-1858144.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 720,
    likeCount: 54,
    avgRating: 4.2,
  },
  // 남성 사용자들
  {
    id: 'dummy_m1',
    name: 'urban.explorer',
    gender: '남성',
    ageGroup: '30대',
    ntrp: 4.5,
    experience: 48,
    playStyle: '공격형',
    careerType: '실업선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'verified', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 2350,
    likeCount: 198,
    avgRating: 4.9,
  },
  {
    id: 'dummy_m2',
    name: 'midnight.rider',
    gender: '남성',
    ageGroup: '20대',
    ntrp: 3.8,
    experience: 30,
    playStyle: '수비형',
    careerType: '대학선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'none', instagram: 'pending' },
    profileImage: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 1420,
    likeCount: 89,
    avgRating: 4.5,
  },
  {
    id: 'dummy_m3',
    name: 'coffee.addict',
    gender: '남성',
    ageGroup: '40대',
    ntrp: 3.5,
    experience: 60,
    playStyle: '올라운드',
    careerType: '동호인',
    certification: { ntrp: 'pending', career: 'none', youtube: 'none', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 890,
    likeCount: 67,
    avgRating: 4.3,
  },
  {
    id: 'dummy_m4',
    name: 'pixel.artist',
    gender: '남성',
    ageGroup: '30대',
    ntrp: 4.2,
    experience: 54,
    playStyle: '공격형',
    careerType: '실업선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'none', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 1780,
    likeCount: 134,
    avgRating: 4.6,
  },
  {
    id: 'dummy_m5',
    name: 'vintage.dad',
    gender: '남성',
    ageGroup: '50대+',
    ntrp: 3.0,
    experience: 72,
    playStyle: '수비형',
    careerType: '동호인',
    certification: { ntrp: 'none', career: 'none', youtube: 'none', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 650,
    likeCount: 45,
    avgRating: 4.1,
  },
  {
    id: 'dummy_m6',
    name: 'fresh.start',
    gender: '남성',
    ageGroup: '20대',
    ntrp: 3.3,
    experience: 18,
    playStyle: '올라운드',
    careerType: '동호인',
    certification: { ntrp: 'none', career: 'none', youtube: 'pending', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 420,
    likeCount: 32,
    avgRating: 4.0,
  },
  {
    id: 'dummy_f6',
    name: 'ocean.breeze',
    gender: '여성',
    ageGroup: '30대',
    ntrp: 3.7,
    experience: 33,
    playStyle: '수비형',
    careerType: '대학선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'none', instagram: 'verified' },
    profileImage: 'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 1320,
    likeCount: 98,
    avgRating: 4.5,
  },
  {
    id: 'dummy_f7',
    name: 'starry.night',
    gender: '여성',
    ageGroup: '20대',
    ntrp: 4.3,
    experience: 27,
    playStyle: '공격형',
    careerType: '대학선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'verified', instagram: 'verified' },
    profileImage: 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 2890,
    likeCount: 245,
    avgRating: 4.9,
  },
  {
    id: 'dummy_m7',
    name: 'silent.storm',
    gender: '남성',
    ageGroup: '40대',
    ntrp: 3.8,
    experience: 45,
    playStyle: '올라운드',
    careerType: '실업선수',
    certification: { ntrp: 'verified', career: 'verified', youtube: 'none', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 1560,
    likeCount: 112,
    avgRating: 4.4,
  },
  {
    id: 'dummy_f8',
    name: 'cozy.home',
    gender: '여성',
    ageGroup: '40대',
    ntrp: 2.8,
    experience: 15,
    playStyle: '수비형',
    careerType: '동호인',
    certification: { ntrp: 'none', career: 'none', youtube: 'none', instagram: 'none' },
    profileImage: 'https://images.pexels.com/photos/1858144/pexels-photo-1858144.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    viewCount: 380,
    likeCount: 28,
    avgRating: 3.9,
  },
];

// 매치 제목 템플릿 (스매시 앱, 테니스 프렌즈 카페 스타일)
const matchTitleTemplates = [
  '강남 테니스클럽에서 함께 치실 분!',
  '홍대 실내코트 복식 파트너 구해요~',
  '잠실 테니스장 레슨형 매치 (초보 환영)',
  '신촌 테니스클럽 주말 특별 매치',
  '서초 테니스센터 평일 오후 게임 모집',
  '여의도 테니스장 황금시간대 매치',
  '건대 스포츠센터에서 복식 한 게임!',
  '압구정 테니스클럽 고수들과 함께',
  '성수동 테니스장 초중급자 대환영',
  '이태원 실내코트 여성분들만!',
  '용산 테니스장 남성 단식 게임',
  '마포 스포츠센터 혼복 매치 모집중',
  '송파 테니스클럽 레슨 후 게임해요',
  '노원 테니스장 주말 오전 매치',
  '분당 테니스클럽 프리미엄 게임',
  '강동 테니스센터 복식 매치 참여자 모집',
  '관악 테니스장 초급자도 환영해요!',
  '동작 스포츠센터 평일 저녁 게임',
  '영등포 테니스클럽 단식 매치',
  '중구 테니스장 점심시간 게임 어때요?',
  '올림픽공원 테니스장 토너먼트식 매치',
  '반포 테니스클럽 여성 복식 모집',
  '청담 프리미엄 테니스장 특별 매치',
  '한강공원 테니스장 야외 게임',
  '목동 테니스센터 실력자 매치',
  '양재 테니스클럽 평일 모닝 게임',
  '강서 테니스장 핫한 매치',
  '노량진 테니스센터 직장인 매치',
  '상암 테니스장 주말 특별 이벤트',
  '종로 테니스클럽 도심 속 힐링 게임'
];

// 코트 위치 템플릿
const courtTemplates = [
  '양재테니스장',
  '내곡테니스장',
  '올림픽공원테니스장',
  '초안산테니스장',
  '목동테니스장',
  '양천테니스장',
  '항공대테니스장',
  '귀뚜라미테니스장',
  '장충테니스장',
  '한남테니스장',
  '반포테니스장',
  '시립대테니스장',
  '다락원테니스장',
  '테니스마스터',
  '테니스엠파이어',
  '루트82테니스장',
  '송도달빛공원테니스장',
  '부천종합운동장',
  '호원실내테니스장',
  '김포테니스장',
  '서울대테니스장',
  '성사테니스장',
  '구리왕숙테니스장',
  '만석테니스장',
  '동백테니스장',
  '성남시립테니스장',
  '봉은테니스장',
  '서울숲테니스장',
  '성서체육공원테니스장',
  '남구종합운동장',
  '사직운동장테니스장',
  '망원한강공원테니스장',
  '서남물테니스장',
  '중랑구립테니스장',
  '관문테니스장',
  '문원테니스장',
  '계양테니스장',
  '학익배수지테니스장',
  '지금배수지테니스장',
  '안양시민운동장테니스장',
  '운정체육공원테니스장',
  '용인시민체육공원',
  '탄천체육공원',
  '히든테니스파크',
  '파미르테니스장'
];

// 매치 설명 템플릿
const descriptionTemplates = [
  '함께 재미있게 운동해요! 초보자도 대환영입니다 😊',
  '실력 향상을 위한 좋은 기회예요. 많은 참여 부탁드려요!',
  '편안한 분위기에서 테니스를 즐겨봐요~',
  '경험 많은 플레이어들과 함께하는 매치입니다 🎾',
  '실력 상관없이 모두 환영해요! 함께 즐겨요!',
  '좋은 코트에서 최고의 게임을 만들어봐요 ⭐',
  '테니스 실력 향상과 새로운 인맥을 만들어보세요!',
  '프리미엄 코트에서 진행되는 특별한 매치예요 🏆',
  '초중급자 환영! 함께 성장해요 💪',
  '고수들과 함께하는 수준 높은 게임입니다',
  '운동 후 간단한 식사도 함께 해요 🍽️',
  '정기 모임으로 발전시켜 나가요!',
  '매너 있는 분들만 참여해주세요 🙏',
  '즐거운 테니스, 건강한 만남! 💚',
  '새로운 테니스 친구들을 만나보세요 👥',
  '실력보다는 매너가 우선이에요!',
  '코치님과 함께하는 레슨형 매치예요 📚',
  '주말 특별 이벤트 매치입니다 🎉',
  '평일 오후 여유로운 시간에 함께해요 ☀️',
  '테니스 동호회 정기 모임이에요!',
  '날씨 좋은 날 야외 코트에서 🌤️',
  '스트레스 해소하러 오세요! 💆‍♀️',
  '테니스로 건강한 하루 시작해요 🌅',
  '실내 코트라 날씨 걱정 없어요!',
  '친목 도모와 실력 향상 두 마리 토끼 🐰',
  '게임 후 카페에서 수다도 떨어요 ☕',
  '운동 부족한 직장인들 모여라! 💼',
  '주부님들 환영! 오전 시간 활용해요 🏠',
  '학생들도 환영! 방학 특별 매치 🎓',
  '시니어분들과 함께하는 여유로운 게임 👴👵'
];

// 지역 템플릿
const locationTemplates = [
  '강남구', '서초구', '마포구', '송파구', '서대문구',
  '용산구', '성동구', '광진구', '노원구', '분당구',
  '강동구', '관악구', '동작구', '영등포구', '중구'
];

export class DataGenerator {
  /**
   * 새로운 더미 매치 생성 (마감 상태로)
   */
  static generateNewMatch(): Match {
    // 랜덤 판매자 선택
    const seller = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
    
    // 랜덤 날짜 생성 (오늘부터 7일 이내)
    const today = new Date();
    const futureDate = new Date(today.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    const dateString = futureDate.toISOString().split('T')[0];
    
    // 랜덤 시간 생성
    const hours = Math.floor(Math.random() * 12) + 9; // 9시-21시
    const minutes = Math.random() < 0.5 ? '00' : '30';
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes}`;
    
    // 종료 시간 (2시간 후)
    const endHours = hours + 2;
    const endTimeString = `${endHours.toString().padStart(2, '0')}:${minutes}`;
    
    // 매치 타입 랜덤 선택
    const matchType = Math.random() < 0.7 ? '복식' : '단식';
    
    // 예상 참가자 수 설정
    const expectedParticipants = matchType === '복식' 
      ? { male: 2, female: 2, total: 4 }
      : { male: 1, female: 0, total: 1 };
    
    // 마감 상태로 설정 (currentApplicants = expectedParticipants)
    const currentApplicants = { ...expectedParticipants };
    
    // 기본 가격 설정
    const basePrice = Math.floor(Math.random() * 20000) + 25000; // 25,000-45,000원
    
    // 초기 가격 계산 (판매자 특성 반영)
    let initialPrice = basePrice;
    
    // 특별 조건: 모집인원이 남성만이고 판매자 NTRP가 3.7 이하인 경우
    const isMaleOnlyLowNtrp = expectedParticipants.male > 0 && expectedParticipants.female === 0 && seller.ntrp <= 3.7;
    
    if (isMaleOnlyLowNtrp) {
      // 특별 조건: basePrice와 initialPrice를 같게 설정
      initialPrice = basePrice;
    } else {
      // 일반적인 초기가격 계산
      // 여성 판매자 할증
      if (seller.gender === '여성') {
        initialPrice *= 1.15;
      }
      
      // 고수 할증
      if (seller.ntrp >= 4.0) {
        initialPrice *= 1.1;
      }
      
      // 황금시간대 할증 (18-21시)
      if (hours >= 18 && hours <= 21) {
        initialPrice *= 1.1;
      }
    }
    
    initialPrice = Math.round(initialPrice / 1000) * 1000;
    
    // 현재 가격 (초기가격에서 약간 상승)
    const currentPrice = Math.round(initialPrice * (1 + Math.random() * 0.3) / 1000) * 1000;
    
    // 대기자 수 (0-2명으로 제한)
    const waitingApplicants = Math.floor(Math.random() * 3); // 0-2명
    
    // 랜덤으로 마감 상태 결정 (80% 확률)
    const isClosed = Math.random() < 0.8;
    
    // NTRP 요구사항
    const ntrpMin = Math.floor(Math.random() * 3) + 2; // 2-4
    const ntrpMax = ntrpMin + Math.floor(Math.random() * 2) + 1; // ntrpMin + 1-2
    
    // 대기자 목록 생성 (적은 수)
    const waitingList = [];
    for (let i = 0; i < waitingApplicants; i++) {
      const waiterUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
      waitingList.push({
        id: `waiter_${Date.now()}_${i}`,
        userId: waiterUser.id,
        userName: waiterUser.name,
        gender: waiterUser.gender,
        ntrp: waiterUser.ntrp,
        joinedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        status: 'waiting' as const,
      });
    }

    const newMatch: Match = {
      id: `generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sellerId: seller.id,
      seller: seller,
      title: matchTitleTemplates[Math.floor(Math.random() * matchTitleTemplates.length)],
      date: dateString,
      time: timeString,
      endTime: endTimeString,
      court: courtTemplates[Math.floor(Math.random() * courtTemplates.length)],
      description: descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)],
      basePrice: basePrice,
      initialPrice: initialPrice,
      currentPrice: currentPrice,
      maxPrice: basePrice * 3,
      expectedViews: Math.floor(Math.random() * 1000) + 500,
      expectedWaitingApplicants: Math.floor(waitingApplicants / 2),
      expectedParticipants: expectedParticipants,
      currentApplicants: currentApplicants, // 마감 상태
      matchType: matchType,
      waitingApplicants: waitingApplicants,
      waitingList: waitingList,
      participants: [], // 새로 생성되는 매치는 참가자 없음
      adEnabled: Math.random() < 0.6, // 60% 확률로 광고 활성화
      ntrpRequirement: { min: ntrpMin, max: ntrpMax },
      weather: ['맑음', '흐림'][Math.floor(Math.random() * 2)] as '맑음' | '흐림',
      location: locationTemplates[Math.floor(Math.random() * locationTemplates.length)],
      createdAt: new Date().toISOString(),
      isClosed: isClosed,
    };
    
    // 마감된 매치의 경우 참가자 수를 예상 참가자 수와 동일하게 설정하고 대기자 수를 0으로 설정
    if (isClosed) {
      newMatch.currentApplicants = { ...newMatch.expectedParticipants };
      newMatch.waitingApplicants = 0;
      newMatch.waitingList = [];
    }

    return newMatch;
  }

  /**
   * Match 객체를 Supabase 형식으로 변환
   */
  private static matchToSupabaseFormat(match: Match): Omit<SupabaseMatch, 'created_at' | 'is_closed'> {
    return {
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
    };
  }

  /**
   * Supabase 형식을 Match 객체로 변환
   */
  private static supabaseToMatchFormat(supabaseMatch: SupabaseMatch): Match {
    const seller: User = {
      id: supabaseMatch.seller_id,
      name: supabaseMatch.seller_name,
      gender: supabaseMatch.seller_gender as '남성' | '여성',
      ageGroup: supabaseMatch.seller_age_group as '20대' | '30대' | '40대' | '50대+',
      ntrp: supabaseMatch.seller_ntrp,
      experience: supabaseMatch.seller_experience,
      playStyle: supabaseMatch.seller_play_style as '공격형' | '수비형' | '올라운드',
      careerType: supabaseMatch.seller_career_type as '동호인' | '대학선수' | '실업선수',
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
   * 매일 새로운 더미 매치들 생성 및 Supabase에 저장
   */
  static async generateAndSaveDailyMatches(count: number = 20): Promise<Match[]> {
    try {
      // Supabase 연결 확인
      if (!supabaseAdmin) {
        console.log('ℹ️ Supabase가 설정되지 않음. 로컬 더미 데이터만 사용합니다.');
        return [];
      }

      const newMatches: Match[] = [];
      
      for (let i = 0; i < count; i++) {
        newMatches.push(this.generateNewMatch());
      }
      
      try {
        // Supabase에 저장
        const supabaseMatches = newMatches.map(match => this.matchToSupabaseFormat(match));
        
        const { data, error } = await supabaseAdmin
          .from('matches')
          .insert(supabaseMatches);
        
        if (error) {
          console.log('ℹ️ Supabase 저장 실패:', error.message);
          console.log('로컬 더미 데이터를 사용합니다.');
          return [];
        }
        
        console.log(`✅ ${newMatches.length}개의 새로운 더미 매치가 Supabase에 저장되었습니다.`);
        return newMatches;
      } catch (fetchError) {
        console.log('ℹ️ Supabase 연결 실패 (환경변수 미설정):', fetchError);
        console.log('로컬 더미 데이터를 사용합니다.');
        return [];
      }
    } catch (error) {
      console.log('ℹ️ 더미 매치 생성 중 오류:', error);
      console.log('로컬 더미 데이터를 사용합니다.');
      return [];
    }
  }

  /**
   * Supabase에서 모든 매치 가져오기
   */
  static async getAllMatches(originalMatches: Match[]): Promise<Match[]> {
    try {
      // Supabase 연결 확인
      if (!supabase) {
        console.log('ℹ️ Supabase가 설정되지 않음 또는 네이티브 환경. 로컬 데이터만 사용합니다.');
        return originalMatches;
      }

      try {
        const { data: supabaseMatches, error } = await supabase
          .from('matches')
          .select(`
            id, seller_id, seller_name, seller_gender, seller_age_group, seller_ntrp, seller_experience,
            seller_play_style, seller_career_type, seller_certification_ntrp, seller_certification_career,
            seller_certification_youtube, seller_certification_instagram, seller_profile_image,
            seller_view_count, seller_like_count, seller_avg_rating, title, date, time, end_time, court,
            description, base_price, initial_price, current_price, max_price, expected_views,
            expected_waiting_applicants, expected_participants_male, expected_participants_female,
            expected_participants_total, current_applicants_male, current_applicants_female,
            current_applicants_total, match_type, waiting_applicants, ad_enabled, ntrp_min, ntrp_max,
            weather, location, is_dummy, created_at
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.log('ℹ️ Supabase 조회 실패:', error.message);
          console.log('로컬 데이터를 사용합니다.');
          return originalMatches;
        }
        
        // Supabase 데이터를 Match 형식으로 변환
        const convertedMatches = supabaseMatches.map(sm => this.supabaseToMatchFormat(sm));
        
        // 더미 매치들과 기본 매치들 합치기
        return [...convertedMatches, ...originalMatches];
      } catch (fetchError) {
        console.log('ℹ️ Supabase 연결 실패 (네이티브 환경에서는 정상):', fetchError);
        console.log('로컬 데이터를 사용합니다.');
        return originalMatches;
      }
    } catch (error) {
      console.log('ℹ️ 매치 데이터 조회 중 오류 (네이티브 환경에서는 정상):', error);
      console.log('로컬 데이터를 사용합니다.');
      return originalMatches;
    }
  }

  /**
   * 마지막 생성 날짜 확인 (Supabase에서)
   */
  static async getLastGenerationDate(): Promise<string | null> {
    try {
      // Supabase 연결 확인
      if (!supabase) {
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'last_dummy_generation_date')
          .single();
        
        if (error || !data) {
          return null;
        }
        
        return data.value;
      } catch (fetchError) {
        console.log('ℹ️ Supabase 연결 실패:', fetchError);
        return null;
      }
    } catch (error) {
      console.log('ℹ️ 마지막 생성 날짜 조회 실패:', error);
      return null;
    }
  }

  /**
   * 마지막 생성 날짜 업데이트 (Supabase에)
   */
  static async updateLastGenerationDate(): Promise<void> {
    try {
      // Supabase 연결 확인
      if (!supabaseAdmin) {
        return;
      }

      try {
        const today = new Date().toDateString();
        
        const { error } = await supabaseAdmin
          .from('app_settings')
          .upsert({
            key: 'last_dummy_generation_date',
            value: today,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });
        
        if (error) {
          console.log('ℹ️ 마지막 생성 날짜 업데이트 실패:', error.message);
        }
      } catch (fetchError) {
        console.log('ℹ️ Supabase 연결 실패:', fetchError);
      }
    } catch (error) {
      console.log('ℹ️ 마지막 생성 날짜 업데이트 중 오류:', error);
    }
  }

  /**
   * 오늘 새로운 더미 매치를 생성해야 하는지 확인
   */
  static async shouldGenerateNewMatches(): Promise<boolean> {
    try {
      // Supabase 연결 확인
      if (!supabase) {
        console.log('ℹ️ Supabase 미연결 또는 네이티브 환경 - 더미 매치 생성 건너뜀');
        return false;
      }

      const lastDate = await this.getLastGenerationDate();
      const today = new Date().toDateString();
      
      return !lastDate || lastDate !== today;
    } catch (error) {
      console.warn('⚠️ 생성 필요 여부 확인 중 오류 (네이티브 환경에서는 정상):', error);
      return false;
    }
  }

  /**
   * 더미 매치 개수 조회
   */
  static async getDummyMatchCount(): Promise<number> {
    try {
      if (!supabaseAdmin) {
        return 0;
      }
      
      const { count, error } = await supabaseAdmin
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('is_dummy', true);
      
      if (error) {
        console.error('더미 매치 개수 조회 오류:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('더미 매치 개수 조회 중 오류:', error);
      return 0;
    }
  }

  /**
   * 오래된 더미 매치 정리 (선택적)
   */
  static async cleanupOldDummyMatches(keepCount: number = 500): Promise<void> {
    try {
      if (!supabaseAdmin) {
        return;
      }
      
      // 가장 오래된 더미 매치들 조회
      const { data: oldMatches, error: selectError } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('is_dummy', true)
        .order('created_at', { ascending: true })
        .limit(1000); // 충분히 많은 수로 조회
      
      if (selectError || !oldMatches) {
        console.error('오래된 매치 조회 오류:', selectError);
        return;
      }
      
      // keepCount보다 많으면 오래된 것들 삭제
      if (oldMatches.length > keepCount) {
        const toDelete = oldMatches.slice(0, oldMatches.length - keepCount);
        const idsToDelete = toDelete.map(m => m.id);
        
        const { error: deleteError } = await supabaseAdmin
          .from('matches')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) {
          console.error('오래된 매치 삭제 오류:', deleteError);
        } else {
          console.log(`🗑️ ${toDelete.length}개의 오래된 더미 매치가 삭제되었습니다.`);
        }
      }
    } catch (error) {
      console.error('오래된 매치 정리 중 오류:', error);
    }
  }
}