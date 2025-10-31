// utils/dataGenerator.ts - 정리된 버전

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
  is_closed?: boolean;
}

export class DataGenerator {
  private static readonly LOCATIONS = [
    '서울시', '경기북부', '경기남부', '경기서부', '경기동부',
    '인천시', '대전시', '대구시', '부산시', '울산시',
    '광주시', '세종시', '강원도', '충북', '충남',
    '경북', '경남', '전북', '전남', '제주도'
  ];

  private static readonly SEOUL_COURTS = [
    '춘천시 드림실내테니스코트', '김천종합스포츠타운테니스장', '여수시 진남시립테니스장',
    '예천군 공설운동장테니스장', '아산시 이순신테니스코트', '속초시 시립테니스코트',
    '순창군 공설운동장테니스코트', '고척동 귀뚜라기크린 테니스장', '고양시 그린테니스장',
    '양평군 지평테니스장', '마루공원 테니스장', '서울숲 테니스장',
    '장충 테니스장', '계남근린공원 테니스장', '신도림 테니스장',
    '잠실유수지 테니스장', '어린이대공원 테니스장', '목동 테니스장',
    '손기정 테니스장', '서울 테니스클럽', '서울시립대 테니스장',
    '반얀트리 클럽앤스파서울', '서울대학교 테니스장', '서울공고 테니스장',
    '서울특별시인재개발원테니스장', '서울대 시흥캠퍼스 테니스장', '서울에너지공사 목동 테니스장',
    '도봉초등학교 테니스장', '철매아파트 테니스장', '서울 문화고등학교 테니스장',
    '서울고등학교 테니스장', '경희대학교 서울캠퍼스 테니스장', '서울 지방조달청 테니스장',
    '서울 북부지방법원 테니스장', '서울 교육대학교 테니스장', '서울 의료원 테니스장',
    '국립서울현충원테니스장', '그랜드하얏트 서울 테니스장', '금촌체육공원',
    '통일공원테니스장', '연풍리체육공원', '월롱테니스장',
    '적성체육공원', '미사한강5호공원 테니스장', '안성맞춤소프트테니스구장',
    '안성맞춤테니스구장', '가평 테니스장', '성저테니스장',
    '성라공원테니스장', '환경에너지 시설 내테니스장', '화정제8호근린공원테니스장',
    '고양스포츠타운내 성저테니스장', '과천시 문원체육공원테니스장', '곤지암생활체육공원',
    '광주시민체육관', '왕숙체육공원', 'TS SPORT TENNIS CLUB',
    'Tennis Arena 테니스 아레나', '광명시립테니스장', 'MK 테니스파크',
    '팔탄테니스장', '테니스팩토리', '숲속실내테니스장',
    '보평실내테니스장(SH테니스)', '대화동레포츠공원테니스장', '과천관문체육공원테니스장',
    '송산배수지체육시설', '푸른마당테니스장', '호원실내테니스장',
    '성남시립테니스장', '용문테니스코트(미지테니스코트)', '지평체육공원',
    '위례숲속테니스코트', 'KBS스포츠월드 제2체육관 실내테니스장', '플렉스 테니스클럽 앳 강남',
    '성남시 분당복합화력발전처', '연천군 공설테니스코트', '용인시 용인테니스아카데미',
    '코오롱스포렉스 이천스포츠센터', '양주시 에덴테니스캠핑', '진남테니스장',
    '아시아드주경기장 테니스장', '원신 테니스장', '진주 테니스장',
    '월디테니스장', '영종국제도시 테니스장', '고염나무골 다목적구장',
    '용유동 동네 체육시설 다목적구장', '부산 고등법원 테니스장', '부산 종합실내테니스장',
    '한국폴리텍대학동부산캠퍼스테니스장', '부산 은행연수원 테니스장', '부산환경공단기장사업소테니스장',
    '부산광역시인재개발원테니스장', '부산환경공단수영사업소 테니스장', '부산외국인학교테니스장',
    '부산 가톨릭대학교 테니스장', '부산대학교 테니스장', '부산지방검찰청동부지청테니스장1',
    '부산지방검찰청동부지청테니스장2', '부산사회체육센터테니스장', '부산광역시교육연수원테니스장',
    '부산교육대학교테니스장', '부산고등검찰청테니스장', '부산지방고용노동청테니스장',
    '동의대학교양정캠퍼스테니스장', '동의과학대학교테니스장', '부산광역시교육청테니스장',
    '황령산레포츠공원테니스장', '부산광역시남부교육지원청테니스장', '감삼테니스장',
    '상리테니스장', '상리공원', '비산철로변',
    '대구대학교테니스장', '나이스테니스장', '대구가톨릭대학교테니스장1',
    '대구가톨릭대학교효성캠퍼스테니스장2', '진량테니스장', '시지실내테니스장',
    '백천실내테니스장', '경산생활체육공원테니스장', '영남대학교 중앙 테니스장',
    '힐즈테니스아카데미', '영남대학교테니스장', '영남대학교교직원테니스장',
    '대신대학교테니스장', '경산공원테니스장', '율하테니스장',
    '도동 제1테니스장(팔공)', '도동 제2테니스장', '대전도시철도공사테니스장',
    '대전지방검찰청테니스장', '대전 지방법원 홍성지원 테니스장', '대전우편집중국테니스장',
    '대전 지방법원 서산지원 테니스장 2', '대전 지방법원 서산지원 테니스장 1', '대전교육연수원테니스장',
    '대전가톨릭대학교테니스장2', '대전가톨릭대학교테니스장1', '대전실내테니스팡',
    '대전대학교테니스장', '정부대전청사테니스장2', '정부대전청사테니스장1',
    '대전고등검찰청테니스장', '대전 고등법원 테니스장', '* 근로복지공단대전병원테니스장',
    '대전보건환경연구원테니스장', '대전솔로몬로파크테니스장', '송강실내테니스장',
    '비와이 테니스장 (실내)', '울룰루테니스장', '메가테니스 남한산성점',
    '올테니스아카데미 광주점', '대한상공회의소광주인력개발원테니스장', '현실내테니스장',
    '광주시민체육관 테니스장', '광주 지방법원 해남지원 테니스장', '광주광역시학생교육원테니스장',
    '광주지방검찰청테니스장', '광주가톨릭대학교테니스장', '광주 지방검찰청 순천지청 테니스장',
    '광주 지방법원 순천지원 테니스장', '한국고용노동교육원테니스장', '광주교육대학교테니스장',
    '광주광역시공무원교육원테니스장', '광주여자대학교테니스장', '광주지방기상청테니스장',
    '정부광주지방합동청사테니스장', '광주광역시경찰청테니스장', '소촌구립테니스장',
    '전천후테니스장', '염주테니스장', '진월국제테니스장',
    '첨단체육공원 체육시설', '보라매공원 테니스장', '탄천 종합운동장 테니스장',
    '수내 시립 테니스장', '구미테니스장', '낙생대 테니스장',
    '분당 주택공원 테니스장', '토탈테니스제이', '매화마을2단지테니스장',
    '시범우성 테니스장', '야탑 테니스장', '티맥스타워 테니스장',
    '신원테니스장', '구미공원테니스장', '선경테니스장',
    '위너테니스아카데미미금점', '판교수질복원센터테니스장', 'BTA테니스아카데미정자점',
    '성남시 체육회 테니스장', '테니스박스', '건영1차아파트테니스장',
    '탑골공원테니스장', '양지한양테니스장', '테니스데이',
    '성남 영어마을 테니스장', '정현중보들테니스센터', '만석공원 내 실내 테니스장'
  ];

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
    // 강남/서초/송파 (강남권)
    '강남에서 같이 치실 분~', '서초 주말에 한게임 어때요?', '송파 실력자들 모여라!',
    '강남 테니스 메이트 구해요', '서초 복식 같이 하실분', '송파에서 친목 테니스!',
    '강남 퇴근길에 한판', '서초 주말 아침 테니스', '송파 저녁 가볍게 치실 분',
    '강남 실력향상 같이해요', '서초에서 테니스 한게임', '송파 단식 파트너 구함',
    
    // 마포/용산/성동 (서북권)
    '마포 친목 테니스 하실 분', '용산에서 레벨업 같이해요', '성동 테니스 메이트 구함',
    '마포 주말 테니스 ㄱㄱ', '용산 평일 저녁 치실분', '성동구 같이 치실 분~',
    '마포 복식 한게임 어때요', '용산 단식 파트너 구해요', '성동 테니스 같이 쳐요',
    
    // 홍대/신촌/건대 (대학가)
    '홍대 근처 테니스 치실 분', '신촌에서 복식 한 게임!', '건대 근처 같이 치실 분',
    '홍대 주말 테니스 ㄱㄱ', '신촌 평일 저녁에 한판', '건대 테니스 모임 오세요',
    '홍대 테린이 환영합니다', '신촌 실력자 모십니다', '건대 친목 위주 테니스',
    
    // 잠실/압구정/여의도 (프리미엄)
    '잠실 주말 복식 하실분~', '압구정 테니스 같이 쳐요', '여의도 저녁 테니스 어때요?',
    '잠실 테니스 한게임!', '압구정에서 복식 구합니다', '여의도 주말 아침 테니스',
    '잠실 평일 저녁 치실 분', '압구정 단식 파트너 구함', '여의도 퇴근하고 한판',
    
    // 일반적인 표현들
    '주말에 테니스 한판 어때요?', '퇴근하고 가볍게 한게임', '이번주 테니스 치실 분 구해요',
    '같이 실력 늘려봐요!', '테린이 환영 친목 매치', '고수분들 모십니다ㅎㅎ',
    '주말 오전 테니스 ㄱㄱ', '평일 저녁 가볍게 치실 분', '이번 주말 복식 하실분',
    '테니스 메이트 찾아요~', '같이 운동하실 분!', '실력 상관없이 환영해요',
    
    // 시간대별
    '아침 일찍 치실 분 구해요', '점심시간 짧게 한게임', '저녁 7시 테니스 어때요',
    '주말 오전 9시 테니스', '평일 저녁 복식 구합니다', '토요일 오후 치실 분~',
    '일요일 아침 테니스!', '퇴근 후 한게임 ㄱㄱ', '새벽 테니스 하실 분',
    
    // 실력/레벨 관련
    '초보 환영합니다!', '중급 이상 모십니다', '고수분들과 한게임',
    '실력 비슷한 분 구해요', '테린이도 괜찮아요~', 'NTRP 4.0 이상만',
    '레벨업 같이 하실 분', '실전 경험 쌓고 싶어요', '랠리 길게 치실 분',
    
    // 매치 유형별
    '단식 파트너 구합니다', '복식 한팀 모집해요', '남복 하실 분~',
    '여복 같이 치실 분', '혼복 팀 구성합니다', '단식 연습 하실분',
    '복식 게임 하실 분', '파트너 구해요!', '2:2 복식 구합니다',
    
    // 친목/분위기 강조
    '친목 위주로 치실 분', '재밌게 운동해요~', '분위기 좋은 모임',
    '매너 좋은 분만 ㅎㅎ', '즐겁게 운동하실 분', '편하게 치실 분 구해요',
    '같이 땀 흘려요!', '운동 후 식사도 ㄱㄱ', '정기모임 멤버 모집',
    
    // 목적 중심
    '다이어트 같이해요', '실력 늘리고 싶어요', '체력 기르실 분',
    '스트레스 풀러 가요', '건강 챙기실 분~', '취미로 즐기실 분',
    '운동 습관 만들어요', '건강한 주말 보내요', '활기찬 아침 시작!',
    
    // 지역별 추가
    '노원 테니스 치실 분', '구로 주말 한게임', '영등포 저녁 테니스',
    '강북 복식 하실분', '관악 테니스 구합니다', '동작구에서 치실 분',
    '성북 주말 테니스', '중랑 평일 저녁 ㄱㄱ', '강서 테니스 메이트',
    
    // 감성/유머
    '날씨 좋을 때 치자!', '운동이 최고야', '테니스 중독자 모여라',
    '공 좀 치고 싶다...', '이번주는 꼭 치자!', '테니스가 하고파~',
    '라켓 먼지 털러 가요', '운동 안하면 안됨', '같이 땀 빼요!',
    
    // 요일별
    '월요일 저녁 테니스', '화요일 아침 운동', '수요일 점심 한게임',
    '목요일 저녁 치실분', '금요일 퇴근 후 ㄱㄱ', '토요일 테니스 모임',
    '일요일 오전 복식', '주중 저녁 치실 분', '주말 아침 테니스',
    
    // 계절/날씨
    '날씨 좋은데 치러가요', '봄 테니스 시즌 오픈', '여름 새벽 테니스',
    '가을 테니스 최고!', '겨울에도 치실 분', '따뜻한 날 한게임',
    
    // 특별한 경우
    '오늘 갑자기 시간 나서', '내일 급하게 구합니다', '이따 저녁 치실분',
    '한 시간 후 치실 분', '지금 바로 가능하신분', '당일 매칭 구해요',
    
    // 인원 모집
    '1명만 더 구해요!', '2명 더 모집합니다', '한 분만 오시면 돼요',
    '3명 모였어요 1명만!', '거의 다 찼어요~', '막차 탑승 ㄱㄱ',
    
    // 정기 모임
    '정기 멤버 찾아요', '매주 모이실 분', '고정 파트너 구합니다',
    '꾸준히 하실 분만', '장기 모임 멤버 모집', '레귤러 멤버 환영',
    
    // 실내/실외
    '실내 코트에서 치실 분', '야외 테니스 어때요', '실내라 날씨 걱정없어요',
    '실외 코트 예약했어요', '돔구장에서 치실분', '야외라 상쾌해요!',
    
    // 추가 다양한 표현
    '테니스 좋아하시는 분', '운동 파트너 구해요', '같이 성장하실 분',
    '테니스로 친구 만들어요', '새로운 사람 만나요', '동네 테니스 모임',
    '회사 근처에서 치실분', '집 근처 테니스장', '가까운 분 구해요',
    '초보 탈출 같이해요', '중수 레벨 환영', '상수 레벨 모집',
    '랠리 재밌게 치실 분', '게임 위주로 하실분', '연습 위주 테니스',
    '서브 연습하실 분', '발리 연습 같이해요', '스매싱 배우고 싶어요',
    '주말 테니스 루틴', '평일 저녁 취미', '아침 운동 습관',
    '테니스 하면서 수다도', '운동하고 커피 ㄱㄱ', '친해지실 분~',
    '매너 플레이어 환영', '즐테 하실 분', '진지하게 하실분',
    '가볍게 즐기실 분', '열심히 하실 분', '배우면서 치실분',
    '코칭 받으면서 게임', '실전 경험 쌓아요', '대회 준비하실분',
    '테니스 시작하신 분', '오랜만에 치시는 분', '복귀하시는 분 환영',
    '20대 테니스 모임', '30대 직장인 모임', '40대 동호인 환영',
    '또래끼리 치실 분', '나이 상관없어요~', '다양한 연령대 환영'
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
   * 닉네임 생성기
   */
  private static generateNickname(): string {
    const prefix = this.NICKNAME_PREFIXES[Math.floor(Math.random() * this.NICKNAME_PREFIXES.length)];
    const suffix = this.NICKNAME_SUFFIXES[Math.floor(Math.random() * this.NICKNAME_SUFFIXES.length)];
    const separator = Math.random() > 0.5 ? '.' : '_';
    
    const addNumber = Math.random() < 0.3;
    const number = addNumber ? Math.floor(Math.random() * 999) + 1 : '';
    
    return `${prefix}${separator}${suffix}${number}`;
  }

  /**
   * 새로운 더미 매치 생성
   */
  static generateNewMatch(): Match {
    const sellerId = `seller_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const matchId = `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const sellerGender = Math.random() > 0.3 ? '남성' : '여성';
    const sellerName = this.generateNickname();

    const hasNtrpCert = Math.random() < 0.3;
    const hasCareerCert = Math.random() < 0.2;
    const hasYoutubeCert = Math.random() < 0.1;
    const hasInstagramCert = Math.random() < 0.15;

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

    const shouldBeClosed = Math.random() < 0.75;
    
    let currentMale = 0;
    let currentFemale = 0;
    
    if (shouldBeClosed) {
      currentMale = expectedMale;
      currentFemale = expectedFemale;
    } else {
      const fillRate = 0.2 + Math.random() * 0.6;
      currentMale = Math.floor(expectedMale * fillRate);
      currentFemale = Math.floor(expectedFemale * fillRate);
    }

    const basePrice = [15000, 20000, 25000, 30000, 35000][Math.floor(Math.random() * 5)];
    const initialPrice = basePrice;
    const currentPrice = basePrice;
    const maxPrice = basePrice * 3;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 1);
    
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
      court: this.SEOUL_COURTS[Math.floor(Math.random() * this.SEOUL_COURTS.length)],
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
      waitingApplicants: shouldBeClosed ? Math.floor(Math.random() * 5) : 0,
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
      isClosed: shouldBeClosed,
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
      participants: supabaseMatch.participants || [],
      applications: supabaseMatch.applications || [],
      adEnabled: supabaseMatch.ad_enabled,
      ntrpRequirement: {
        min: supabaseMatch.ntrp_min,
        max: supabaseMatch.ntrp_max,
      },
      weather: supabaseMatch.weather as '맑음' | '흐림' | '비',
      location: supabaseMatch.location,
      createdAt: supabaseMatch.created_at,
      isClosed: (supabaseMatch as any).is_closed || false,
    };
  }

  /**
   * 매치를 Supabase에 저장 (실제 사용자 매치 + 더미 매치 모두 처리)
   */
  static async saveMatchToSupabase(match: Match): Promise<boolean> {
    try {
      if (!supabaseAdmin) {
        console.log('Supabase Admin이 설정되지 않아 매치 저장을 건너뜁니다.');
        return false;
      }

      const safeBasePrice = Number(match.basePrice) || 0;
      const safeInitialPrice = Number(match.initialPrice) || safeBasePrice;
      const safeCurrentPrice = Number(match.currentPrice) || safeBasePrice;
      const safeMaxPrice = Number(match.maxPrice) || (safeBasePrice * 3);

      // 실제 사용자 매치는 isDummy: false, 더미 생성 매치는 isDummy가 없으므로 true로 처리
      const isDummyMatch = (match as any).isDummy ?? true; // 기본값은 true (더미)

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
        is_dummy: isDummyMatch, // 실제 사용자: false, 더미: true
        created_at: match.createdAt,
        is_closed: match.isClosed || false,
        applications: match.applications || [],
        participants: match.participants || [],
      };

      const { error } = await supabaseAdmin
        .from('matches')
        .insert([supabaseData]);

      if (error) {
        console.error('Supabase 매치 저장 오류:', error);
        return false;
      }

      console.log(`매치 ${match.id} Supabase 저장 완료`);
      return true;
    } catch (error) {
      console.error('saveMatchToSupabase 오류:', error);
      return false;
    }
  }

  /**
   * Supabase에서 모든 매치 가져오기
   */
  static async getAllMatches(fallbackMatches: Match[]): Promise<Match[]> {
    try {
      console.log('Supabase에서 매치 데이터 가져오는 중...');
      
      if (!supabase) {
        console.log('Supabase가 설정되지 않아 로컬 데이터만 사용합니다.');
        return fallbackMatches;
      }

      const { data: supabaseMatches, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase 조회 오류:', error.message);
        return fallbackMatches;
      }

      if (!supabaseMatches || supabaseMatches.length === 0) {
        console.log('Supabase에 저장된 매치가 없습니다. 로컬 데이터만 사용합니다.');
        return fallbackMatches;
      }

      const convertedMatches = supabaseMatches.map(this.convertSupabaseToMatch);
      console.log(`Supabase에서 ${convertedMatches.length}개 매치 로드 완료`);
      
      return convertedMatches;
    } catch (error) {
      console.error('getAllMatches 오류:', error);
      return fallbackMatches;
    }
  }

  /**
   * 일회성 더미 매치 생성
   */
  static async generateOneTimeDummyMatches(count: number = 10): Promise<Match[]> {
    try {
      if (!supabaseAdmin) {
        console.log('Supabase Admin 클라이언트가 설정되지 않음.');
        return [];
      }

      const newMatches: Match[] = [];
      
      console.log(`일회성 더미 매치 ${count}개 생성 시작...`);
      
      for (let i = 0; i < count; i++) {
        newMatches.push(this.generateNewMatch());
      }
      
      const savePromises = newMatches.map(match => this.saveMatchToSupabase(match));
      const results = await Promise.all(savePromises);
      
      const successCount = results.filter(result => result).length;
      
      if (successCount === 0) {
        console.log('모든 매치 저장 실패');
        return [];
      }
      
      console.log(`${successCount}개의 일회성 더미 매치가 Supabase에 저장되었습니다.`);
      return newMatches.slice(0, successCount);
        
    } catch (error: any) {
      console.log('일회성 더미 매치 생성 중 오류:', error?.message);
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
        console.log('Supabase Admin 클라이언트가 설정되지 않음.');
        return {
          success: false,
          deletedCount: 0,
          error: 'Supabase Admin 연결이 설정되지 않았습니다.'
        };
      }

      const currentCount = await this.getDummyMatchCount();
      console.log(`삭제할 더미 매치: ${currentCount}개`);

      const { error } = await supabaseAdmin
        .from('matches')
        .delete()
        .eq('is_dummy', true);

      if (error) {
        console.log('더미 매치 삭제 실패:', error.message);
        return {
          success: false,
          deletedCount: 0,
          error: error.message
        };
      }

      console.log(`${currentCount}개의 더미 매치가 성공적으로 삭제되었습니다.`);
      
      return {
        success: true,
        deletedCount: currentCount,
      };

    } catch (error: any) {
      console.log('더미 매치 삭제 중 오류:', error?.message);
      return {
        success: false,
        deletedCount: 0,
        error: error?.message || '알 수 없는 오류'
      };
    }
  }

  /**
   * 모든 매치 삭제 (더미 + 실제 사용자 매치 전부)
   */
  static async deleteAllMatches(): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    try {
      if (!supabaseAdmin) {
        console.log('Supabase Admin 클라이언트가 설정되지 않음.');
        return {
          success: false,
          deletedCount: 0,
          error: 'Supabase Admin 연결이 설정되지 않았습니다.'
        };
      }

      // 삭제할 전체 매치 개수 조회
      const { count, error: countError } = await supabaseAdmin
        .from('matches')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        return {
          success: false,
          deletedCount: 0,
          error: countError.message
        };
      }

      const currentCount = count || 0;
      console.log(`삭제할 전체 매치: ${currentCount}개`);

      // ⚠️ 모든 매치 삭제 (is_dummy 조건 없음)
      const { error } = await supabaseAdmin
        .from('matches')
        .delete()
        .neq('id', ''); // 모든 행 선택

      if (error) {
        console.log('모든 매치 삭제 실패:', error.message);
        return {
          success: false,
          deletedCount: 0,
          error: error.message
        };
      }

      console.log(`${currentCount}개의 모든 매치가 성공적으로 삭제되었습니다.`);
      
      return {
        success: true,
        deletedCount: currentCount,
      };

    } catch (error: any) {
      console.log('모든 매치 삭제 중 오류:', error?.message);
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
        console.log('더미 매치 개수 조회 실패:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.log('더미 매치 개수 조회 중 오류:', error?.message);
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
      totalNicknames: new Set(matches.map(m => m.seller.name)).size,
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