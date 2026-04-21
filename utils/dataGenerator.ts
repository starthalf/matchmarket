// utils/dataGenerator.ts

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
  // ==========================================
  // 1. 기초 데이터셋 (지역별 코트 매핑)
  // ==========================================

  private static readonly COURTS_BY_REGION: { [key: string]: string[] } = {
    '서울시': [
      '장충 테니스장', '목동 테니스장', '올림픽공원 테니스장', '반얀트리 클럽', '서울숲 테니스장',
      '남산 테니스장', '귀뚜라미 크린 테니스장', '잠원 한강공원', '망원 한강공원', '양재 시민의숲',
      '서울대 테니스장', '연세대 테니스장', 'KBS 88체육관', '고척동 귀뚜라기크린', '마루공원',
      '계남근린공원', '신도림 테니스장', '잠실유수지', '어린이대공원', '손기정 테니스장',
      '서울시립대', '서울공고', '인재개발원', '도봉초등학교', '철매아파트', '문화고등학교',
      '서울고등학교', '경희대 서울캠퍼스', '지방조달청', '북부지방법원', '서울교대', '국립서울현충원',
      '그랜드하얏트', '서남물재생센터', '육사 테니스장'
    ],
    '경기도': [
      '구리 왕숙 체육공원', '하남 유니온파크', '고양 성저파크', '안양 종합운동장', '부천 종합운동장',
      '수원 만석공원', '분당 수내 시립', '성남 탄천 종합운동장', '과천시 문원체육공원', '광주시민체육관',
      '광명시립', '성남시립', '용인 테니스아카데미', '이천 스포츠센터', '양주 에덴테니스',
      '가평 테니스장', '안성맞춤 테니스장', '미사한강5호공원', '파주 통일공원', '파주 연풍리체육공원',
      '고양 그린테니스장', '양평 지평테니스장', '일산 호수공원', '판교 수질복원센터'
    ],
    '인천시': [
      '인천 아시아드주경기장', '영종국제도시 테니스장', '인천대공원', '가좌 시립테니스장', 
      '송도 달빛공원', '부평구청 테니스장', '열우물 테니스경기장'
    ],
    '강원도': [
      '춘천시 드림실내테니스', '속초시 시립테니스코트', '강릉 올림픽파크', '원주 종합운동장'
    ],
    '충청도': [
      '대전 시립', '세종 중앙공원', '천안 종합운동장', '아산 이순신테니스코트', '청주 국제테니스장',
      '정부대전청사', '대전 관저테니스장', '대전 충남대'
    ],
    '경상도': [
      '부산 사직실내테니스장', '부산 금정체육공원', '대구 두류공원', '대구 유니버시아드',
      '울산 문수테니스장', '김천 종합스포츠타운', '경주 시민운동장', '포항 종합운동장',
      '창원 시립테니스장', '진주 테니스장', '부산대 테니스장', '영남대 테니스장'
    ],
    '전라도': [
      '광주 진월국제테니스장', '광주 염주체육관', '전주 완산체육공원', '여수 진남시립',
      '순천 팔마체육관', '목포 국제축구센터 내 테니스장', '순창 공설운동장'
    ],
    '제주도': [
      '제주 연정테니스코트', '서귀포 테니스장', '제주대 테니스장'
    ]
  };

  // ==========================================
  // 2. 닉네임 생성용 데이터셋 (대폭 확장)
  // ==========================================

  // [영어] 감성/일상/기록용 단어 (인스타 아이디용) - 대폭 추가
  private static readonly EN_VIBE_WORDS = [
    'daily', 'mood', 'vibes', 'archive', 'log', 'record', 'official', 'studio', 
    'planet', 'space', 'moment', 'day', 'night', 'blue', 'sunset', 'slow',
    'calm', 'urban', 'city', 'summer', 'winter', 'spring', 'autumn', 'picnic',
    'lover', 'holic', 'dreamer', 'traveler', 'runner', 'player', 'maker',
    'project', 'life', 'style', 'pure', 'snow', 'rain', 'cloud', 'star',
    'moon', 'flower', 'ocean', 'wave', 'forest', 'wood', 'film', 'photo',
    'focus', 'view', 'scene', 'page', 'note', 'draw', 'art', 'design',
    'gray', 'black', 'white', 'deep', 'soft', 'cozy', 'home', 'stay',
    'youth', 'glow', 'flow', 'surf', 'camp', 'hike', 'swim', 'walk',
    'coffee', 'brew', 'cafe', 'cake', 'bread', 'cook', 'eat', 'yummy'
  ];

  // [영어] 이름/별명 파트 (한국 이름 로마자 + 영어 이름) - 대폭 추가
  private static readonly EN_NAMES_PART = [
    'min', 'jun', 'seoul', 'kate', 'james', 'lucy', 'jay', 'won', 'ho', 'jin',
    'soo', 'young', 'lee', 'park', 'kim', 'choi', 'han', 'song', 'moon', 'sky',
    'coco', 'leo', 'max', 'ruby', 'luna', 'chloe', 'bella', 'chris', 'alex',
    'sam', 'tomy', 'kelly', 'anna', 'sophie', 'david', 'mike', 'daniel',
    'ji', 'hyun', 'woo', 'chan', 'kyung', 'hye', 'yoon', 'sub', 'chul',
    'minji', 'jiwon', 'minsu', 'dohyun', 'seojin', 'yujin', 'siyoon'
  ];

  // [한글] 상태/감성 수식어
  private static readonly KR_ADJECTIVES = [
    '소소한', '행복한', '자유로운', '바쁜', '즐거운', '멍때리는', '퇴근한', 
    '배고픈', '신난', '졸린', '성실한', '게으른', '용감한', '소심한', 
    '지친', '활기찬', '돌아온', '떠나는', '꿈꾸는', '노래하는', '춤추는',
    '센치한', '우아한', '수상한', '평범한', '이상한', '귀여운', '시크한',
    '따뜻한', '시원한', '달콤한', '매콤한', '심심한', '복잡한'
  ];

  // [한글] 명사 (일상, 자연, 역할, 사물)
  private static readonly KR_NOUNS = [
    '일상', '기록', '공간', '하루', '생각', '여행자', '직장인', '개발자', 
    '백수', '사장님', '대장', '꿈나무', '매니아', '집사', '주민', '나그네',
    '고양이', '강아지', '구름', '바람', '나무', '바다', '하늘', '별', '달',
    '커피', '라떼', '아아', '맥주', '소주', '와인', '빵', '떡볶이', '감자',
    '고구마', '두부', '만두', '호떡', '치킨', '피자', '햄버거', '마카롱'
  ];

  // [한글] 커뮤니티 스타일 (유행어, 줄임말, 합성어)
  private static readonly KR_COMMUNITY_STYLE = [
    '월급루팡', '칼퇴기원', '다이어터', '아가리어터', '헬린이', '등린이', 
    '커피수혈', '빵순이', '빵돌이', '면치기', '먹깨비', '쩝쩝박사',
    '소확행', '욜로인생', '갓생살기', '새벽감성', '한강러버', '민초단',
    '반민초', '얼죽아', '뜨죽따', '퇴사꿈나무', '로또1등', '건물주',
    '집순이', '집돌이', '프로자취러', '서울상경', '제주살이', '맛점',
    '치킨에진심', '떡볶이킬러', '여행중독', '캠핑러', '차박러'
  ];

  private static readonly PLAY_STYLES = ['공격형', '수비형', '올라운드'];
  private static readonly CAREER_TYPES = ['동호인', '선수'];
  private static readonly MATCH_TYPES = ['단식', '남복', '여복', '혼복'];

  // ==========================================
  // 제목 생성용 데이터셋
  // ==========================================

  private static readonly PREFIXES = {
    bracket: ['[모집]', '[구함]', '[급구]', '[벙개]', '[번개]', '[정모]', '[게스트]', '[용병]', '[대타]', '[양도]'],
    emoji: ['🎾', '🏸', '💪', '☀️', '🌙', '⭐', '🔥', '✨', '🙌', '👋', '🤝'],
    time: ['오전', '오후', '저녁', '아침', '점심', '밤', '새벽', '주말', '평일', '퇴근후'],
    casual: ['', '', '', ''],
  };

  private static readonly ACTIONS = {
    formal: ['모집합니다', '구합니다', '찾습니다', '모십니다', '초대합니다'],
    casual: ['구해요', '찾아요', '모셔요', '와주세요', '함께해요', '같이쳐요'],
    short: ['구함', '모집', '환영', 'ㄱㄱ', '고고', 'ㄱ?', '가즈아', '달려요'],
  };

  private static readonly TARGETS = {
    count: ['한 분', '1명', '한명', '두 분', '2명', '몇 분'],
    role: ['파트너', '게스트', '용병', '멤버', '동료', '메이트'],
    gender: ['남성분', '여성분', '남1', '여1', '남2', '여2', '성별무관'],
  };

  private static readonly CONDITIONS = {
    cost: ['코트비 무료', '코트비X', '무료', '비용없음', '게임비만'],
    facility: ['주차가능', '샤워실有', '조명有', '실내', '야외'],
    ball: ['신구', '새공', '연습구', '볼제공'],
    vibe: ['매너게임', '즐겜', '빡겜', '편하게', '가볍게', '진지하게'],
  };

  private static readonly SKILL_EXPR = {
    range: (n: number) => [`${n}~${(n+1).toFixed(1)}`, `${n}+`, `${n} 이상`, `${n} 전후`],
    level: ['초보환영', '테린이환영', '구력무관', '실력무관', '중수이상', '고수만'],
    ntrp: (n: number) => [`NTRP ${n}`, `NTRP ${n}+`, `${n}레벨`],
  };

  private static readonly TIME_EXPR = {
    specific: (t: string) => [`${t}시`, `${t}:00`, `${parseInt(t)}시`],
    range: (t: string) => {
      const h = parseInt(t);
      return [`${h}~${h+2}시`, `${t}~${h+2}:00`];
    },
    casual: ['오늘', '내일', '이번주', '주말', '평일'],
  };

  private static readonly ENDINGS = {
    polite: ['하실 분', '치실 분', '오실 분', '가능하신 분', '계신가요', '있으신가요'],
    casual: ['하실분', '칠분', '올분', '가능한분', '있나요', '없나요'],
    question: ['같이 치실 분?', '한 게임 하실 분?', '함께 하실 분?', '참여하실 분?'],
    exclaim: ['오세요!', '환영해요!', '기다려요!', '연락주세요!', '신청주세요!'],
  };

  private static readonly SUFFIXES = {
    emoji: ['🎾', '💪', '😊', '👍', '🙏', '✨', ''],
    punct: ['!', '~', '!!', '^^', 'ㅎㅎ', ':)', ''],
    extra: ['급해요', '급함', '선착순', '마감임박', '자리얼마없음', ''],
  };

  // ==========================================
  // 3. 로직 구현 (닉네임, 제목, 설명)
  // ==========================================

  /**
   * 자연스럽고 다양한 닉네임 생성 (영어 비중 높임)
   */
  private static generateNaturalNickname(): string {
    // 80% 영어, 20% 한글
    const useKorean = Math.random() < 0.2;
    
    if (useKorean) {
      // --- 한국어 패턴 (20%) ---
      const krPatterns = [
        // 한글 형용사 + 명사 (예: 행복한고양이)
        () => `${this.pick(this.KR_ADJECTIVES)}${this.pick(this.KR_NOUNS)}`,
        // 커뮤니티 스타일 (예: 월급루팡)
        () => this.pick(this.KR_COMMUNITY_STYLE),
        // 한글 명사 + 숫자 (예: 주민1, 나그네82)
        () => `${this.pick(this.KR_NOUNS)}${Math.floor(Math.random() * 100) + 1}`,
      ];
      return this.pick(krPatterns)();
    } else {
      // --- 영어 패턴 (80%) ---
      const enPatterns = [
        // 1. 영어_영어 (예: daily_mood)
        () => `${this.pick(this.EN_VIBE_WORDS)}_${this.pick(this.EN_VIBE_WORDS)}`,
        // 2. 이름.영어 (예: min.official)
        () => `${this.pick(this.EN_NAMES_PART)}.${this.pick(this.EN_VIBE_WORDS)}`,
        // 3. 영어_이름 (예: urban_jun)
        () => `${this.pick(this.EN_VIBE_WORDS)}_${this.pick(this.EN_NAMES_PART)}`,
        // 4. 영어 + 숫자 (예: sky0214)
        () => {
          const word = Math.random() > 0.5 ? this.pick(this.EN_NAMES_PART) : this.pick(this.EN_VIBE_WORDS);
          const num = Math.random() > 0.5 ? Math.floor(Math.random() * 90) + 10 : Math.floor(Math.random() * 2000) + 1000;
          return `${word}${num}`;
        },
        // 5. 밑줄 감성 (예: _mood, _jun_)
        () => Math.random() > 0.5 ? `_${this.pick(this.EN_VIBE_WORDS)}` : `_${this.pick(this.EN_NAMES_PART)}_`,
        // 6. 감성 기록형 (예: jun.log, min.record)
        () => `${this.pick(this.EN_NAMES_PART)}.${this.pick(['log', 'record', 'archive', 'page', 'daily', 'official'])}`,
        // 7. 반복형 (예: min_min, daily_daily)
        () => {
          const word = Math.random() > 0.5 ? this.pick(this.EN_NAMES_PART) : this.pick(this.EN_VIBE_WORDS);
          return `${word}_${word}`;
        },
        // 8. 이름+이름 (예: minjun, jiwon)
        () => `${this.pick(this.EN_NAMES_PART)}${this.pick(this.EN_NAMES_PART)}`,
        // 9. 대문자 시작 (예: Daily_life, Urban.mood)
        () => {
          const word = this.pick(this.EN_VIBE_WORDS);
          const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
          const second = this.pick(this.EN_VIBE_WORDS);
          return Math.random() > 0.5 ? `${capitalized}_${second}` : `${capitalized}.${second}`;
        },
        // 10. 숫자 사이 (예: 2min4u, 4ever_tennis)
        () => {
          const nums = ['2', '4', '7', '9'];
          const word = this.pick(this.EN_NAMES_PART);
          return Math.random() > 0.5 ? `${this.pick(nums)}${word}` : `${word}${this.pick(nums)}u`;
        },
      ];
      return this.pick(enPatterns)();
    }
  }

  private static pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * 자연스러운 제목 생성
   */
  private static generateContextualTitle(
    location: string, 
    time: string, 
    matchType: string, 
    courtName: string,
    ntrp: number
  ): string {
    const hour = parseInt(time.split(':')[0]);
    const shortCourt = courtName.split(' ')[0].replace('시', '').replace('군', '');
    const shortLoc = location.substring(0, 2);

    let timePeriod = '오후';
    if (hour >= 5 && hour < 9) timePeriod = '아침';
    else if (hour >= 9 && hour < 12) timePeriod = '오전';
    else if (hour >= 12 && hour < 14) timePeriod = '점심';
    else if (hour >= 14 && hour < 18) timePeriod = '오후';
    else if (hour >= 18 && hour < 21) timePeriod = '저녁';
    else timePeriod = '밤';

    const patterns: (() => string)[] = [
      // 기본 정보 전달형
      () => `${shortCourt} ${matchType} ${this.pick(this.ACTIONS.formal)}`,
      () => `${shortCourt} ${matchType} ${this.pick(this.TARGETS.count)} ${this.pick(this.ACTIONS.casual)}`,
      () => `${time}시 ${shortCourt} ${matchType}`,
      () => `${shortCourt}에서 ${matchType} 치실 분`,
      () => `${matchType} ${this.pick(this.TARGETS.role)} ${this.pick(this.ACTIONS.formal)}`,
      
      // 브래킷 접두사형
      () => `${this.pick(this.PREFIXES.bracket)} ${shortCourt} ${matchType}`,
      () => `${this.pick(this.PREFIXES.bracket)} ${time}시 ${matchType} ${this.pick(this.TARGETS.count)}`,
      () => `${this.pick(this.PREFIXES.bracket)} ${matchType} ${this.pick(this.ACTIONS.short)}`,
      () => `[${shortLoc}] ${shortCourt} ${matchType} ${this.pick(this.ACTIONS.casual)}`,
      () => `[${time}시] ${shortCourt} ${matchType}`,
      
      // 이모지 활용형
      () => `${this.pick(this.PREFIXES.emoji)} ${shortCourt} ${matchType}`,
      () => `${matchType} ${this.pick(this.ENDINGS.question)} ${this.pick(this.SUFFIXES.emoji)}`,
      () => `${timePeriod} 테니스 ${this.pick(this.ENDINGS.question)} ${this.pick(this.SUFFIXES.emoji)}`,
      () => `${this.pick(this.PREFIXES.emoji)} ${time}시 ${matchType} ${this.pick(this.ACTIONS.short)}`,
      
      // 시간 강조형
      () => `${timePeriod} ${matchType} ${this.pick(this.ENDINGS.polite)}`,
      () => `오늘 ${time}시 ${matchType} ${this.pick(this.ACTIONS.casual)}`,
      () => `${time}시 ${matchType} ${this.pick(this.ENDINGS.question)}`,
      () => `${timePeriod}에 ${shortCourt}에서 ${matchType}`,
      () => `퇴근후 ${matchType} 한판 ${this.pick(this.ENDINGS.question)}`,
      
      // 실력/조건 명시형
      () => `${this.pick(this.SKILL_EXPR.range(ntrp))} ${matchType} ${this.pick(this.ACTIONS.formal)}`,
      () => `${this.pick(this.SKILL_EXPR.level)} ${matchType} ${this.pick(this.ACTIONS.casual)}`,
      () => `NTRP ${ntrp} ${matchType} ${this.pick(this.TARGETS.role)} ${this.pick(this.ACTIONS.short)}`,
      () => `${matchType} ${this.pick(this.SKILL_EXPR.level)} (${shortCourt})`,
      
      // 분위기/성향형
      () => `${this.pick(this.CONDITIONS.vibe)} ${matchType} ${this.pick(this.ACTIONS.casual)}`,
      () => `${this.pick(this.CONDITIONS.vibe)}으로 ${matchType} 치실 분`,
      () => `스트레스 해소 ${matchType} ${this.pick(this.ENDINGS.question)}`,
      () => `재밌게 ${matchType} ${this.pick(this.ENDINGS.polite)}`,
      
      // 조건 강조형
      () => `${shortCourt} ${matchType} (${this.pick(this.CONDITIONS.cost)})`,
      () => `${matchType} ${this.pick(this.ACTIONS.formal)} (${this.pick(this.CONDITIONS.ball)})`,
      () => `${this.pick(this.CONDITIONS.facility)} ${shortCourt} ${matchType}`,
      
      // 인원 특정형
      () => `${matchType} ${this.pick(this.TARGETS.gender)} ${this.pick(this.ACTIONS.casual)}`,
      () => `${this.pick(this.TARGETS.count)} ${this.pick(this.ACTIONS.short)} - ${shortCourt} ${matchType}`,
      () => `${matchType} ${this.pick(this.TARGETS.role)} ${this.pick(this.TARGETS.count)} 모집`,
      
      // 질문형
      () => `${shortCourt} ${matchType} ${this.pick(this.ENDINGS.question)}`,
      () => `${time}시 ${matchType} 가능하신 분 ${this.pick(this.SUFFIXES.emoji)}`,
      () => `오늘 ${matchType} 치실 분 있나요?`,
      () => `${timePeriod}에 테니스 ${this.pick(this.ENDINGS.polite)}`,
      
      // 상황 묘사형
      () => `한 분 빠져서 ${matchType} ${this.pick(this.TARGETS.count)} ${this.pick(this.ACTIONS.short)}`,
      () => `급하게 ${matchType} ${this.pick(this.TARGETS.role)} ${this.pick(this.ACTIONS.casual)}`,
      () => `자리 났어요! ${shortCourt} ${matchType}`,
      () => `${matchType} 인원 부족 - ${this.pick(this.TARGETS.count)} ${this.pick(this.ACTIONS.short)}`,
      
      // 캐주얼/짧은형
      () => `${shortCourt} ${matchType} ㄱㄱ`,
      () => `${time}시 ${matchType} 고고`,
      () => `${matchType} 달려요 ${this.pick(this.SUFFIXES.emoji)}`,
      () => `${shortCourt} ${matchType} 가즈아`,
      
      // 감성형
      () => `${timePeriod} 테니스로 하루 시작해요`,
      () => `오늘 하루 마무리는 ${matchType}으로`,
      () => `주말 ${matchType} 함께해요`,
      () => `테니스 치면서 힐링해요 (${shortCourt})`,
      
      // 복합 조합형
      () => `${this.pick(this.PREFIXES.bracket)} ${shortCourt} ${matchType} ${this.pick(this.CONDITIONS.cost)} ${this.pick(this.SUFFIXES.emoji)}`,
      () => `${timePeriod} ${shortCourt} ${matchType} ${this.pick(this.TARGETS.count)} ${this.pick(this.ACTIONS.casual)}`,
      () => `${this.pick(this.SKILL_EXPR.level)} ${shortCourt} ${matchType} ${this.pick(this.ENDINGS.exclaim)}`,
    ];

    return this.pick(patterns)();
  }

  private static generateContextualDescription(matchType: string, ntrp: number): string {
    const greetings = [
      '안녕하세요!', 
      '반갑습니다.', 
      '즐거운 테니스 하실 분!', 
      '안녕하세요, 테니스 좋아하시는 분 찾습니다.',
      '안녕하세요, 테니스 열정 가득한 분 모십니다.',
      ''
    ];
    
    const intros = [
      `급하게 ${matchType} 빈자리가 생겨서 글 올립니다.`,
      `저희 실력은 ${ntrp} 정도 되구요, 비슷하신 분이면 좋겠습니다.`,
      `매너 게임 하실 분 찾고 있어요. 승패보다는 즐겁게 치고 싶습니다.`,
      `꾸준히 같이 치실 파트너 찾고 있습니다.`,
      `코트 예약은 어렵게 성공했는데 사람이 없네요 ㅠ`,
      `가볍게 몸 풀고 게임 진행하려고 합니다.`,
      `인원이 한 명 부족해서 급하게 게스트 모십니다.`,
      `서로 배려하면서 재밌게 쳤으면 좋겠습니다.`
    ];
    
    const details = [
      '- 주차 가능합니다 (유료).',
      '- 주차 무료입니다.',
      '- 샤워실 이용 가능해요.',
      '- 신구(New Ball) 깝니다.',
      '- 연습구 많이 있습니다.',
      '- 코트비는 1/N 입니다.',
      '- 끝나고 시간 되시면 음료 한 잔 해요.',
      '- 칼퇴근 보장해드립니다.',
      '- 게임비만 준비해주시면 됩니다.',
      '- 물은 제공해드립니다.'
    ];

    const closings = [
      '편하게 신청 주세요!', 
      '채팅 주시면 바로 답장 드릴게요.', 
      '기다리겠습니다.', 
      '감사합니다.', 
      '매너 좋으신 분 환영합니다 ^^',
      '많은 관심 부탁드려요!'
    ];

    const greeting = this.pick(greetings);
    const intro = this.pick(intros);
    const closing = this.pick(closings);

    const includeDetails = Math.random() < 0.1;
    
    if (includeDetails) {
      const selectedDetails = details
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .join('\n');
      
      return `${greeting}\n\n${intro}\n\n[진행 방식 및 정보]\n${selectedDetails}\n\n${closing}`;
    } else {
      return `${greeting}\n\n${intro}\n\n${closing}`;
    }
  }

  // ==========================================
  // 4. 메인 매치 생성 함수
  // ==========================================

  static generateNewMatch(forceClose: boolean = false): Match {
    const sellerId = `seller_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const matchId = `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const sellerName = this.generateNaturalNickname();
    const sellerGender = Math.random() > 0.3 ? '남성' : '여성';

    const seller: User = {
      id: sellerId,
      name: sellerName,
      gender: sellerGender,
      ageGroup: ['20대', '30대', '40대', '50대'][Math.floor(Math.random() * 4)] as any,
      ntrp: Math.round((2.0 + Math.random() * 3.0) * 10) / 10,
      experience: 6 + Math.floor(Math.random() * 120),
      playStyle: this.PLAY_STYLES[Math.floor(Math.random() * this.PLAY_STYLES.length)] as any,
      careerType: Math.random() < 0.9 ? '동호인' : '선수',
      certification: {
        ntrp: Math.random() < 0.3 ? 'verified' : 'none',
        career: Math.random() < 0.2 ? 'verified' : 'none',
        youtube: Math.random() < 0.1 ? 'verified' : 'none',
        instagram: Math.random() < 0.15 ? 'verified' : 'none',
      },
      profileImage: Math.random() > 0.5 ? `https://picsum.photos/seed/${sellerId}/200/200` : undefined,
      viewCount: Math.floor(Math.random() * 1000),
      likeCount: Math.floor(Math.random() * 200),
      avgRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    };

    const regions = Object.keys(this.COURTS_BY_REGION);
    let selectedRegion: string;
    
    if (Math.random() < 0.85) {
      selectedRegion = Math.random() < 0.57 ? '서울시' : '경기도';
    } else {
      const otherRegions = regions.filter(r => r !== '서울시' && r !== '경기도');
      selectedRegion = otherRegions[Math.floor(Math.random() * otherRegions.length)];
    }

    const courtsInRegion = this.COURTS_BY_REGION[selectedRegion];
    const court = courtsInRegion[Math.floor(Math.random() * courtsInRegion.length)];

    const matchType = (['단식', '남복', '여복', '혼복'] as const)[Math.floor(Math.random() * 4)];
    
    const startHour = 6 + Math.floor(Math.random() * 16);
    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(startHour + 2).toString().padStart(2, '0')}:00`;
    
    const randomDayOffset = Math.floor(Math.random() * 6);
    const matchDate = new Date();
    matchDate.setDate(matchDate.getDate() + randomDayOffset);

    const ntrpMin = 2.0 + Math.floor(Math.random() * 3) * 0.5;

    const title = this.generateContextualTitle(selectedRegion, startTime, matchType, court, ntrpMin);
    const description = this.generateContextualDescription(matchType, ntrpMin);

    let expectedMale = 0, expectedFemale = 0;
    if (matchType === '단식') {
      if (sellerGender === '남성') expectedMale = 2; else expectedFemale = 2;
    } else if (matchType === '남복') {
      expectedMale = 4;
    } else if (matchType === '여복') {
      expectedFemale = 4;
    } else { 
      expectedMale = 2; expectedFemale = 2;
    }

    const shouldClose = forceClose || Math.random() < 0.35;
    
    let currentMale: number;
    let currentFemale: number;
    
    if (shouldClose) {
      currentMale = expectedMale;
      currentFemale = expectedFemale;
    } else {
      currentMale = Math.floor(expectedMale * (0.5 + Math.random() * 0.4));
      currentFemale = Math.floor(expectedFemale * (0.5 + Math.random() * 0.4));
    }

    const basePrice = [10000, 15000, 20000, 25000, 30000][Math.floor(Math.random() * 5)];

    return {
      id: matchId,
      sellerId: sellerId,
      seller: seller,
      title: title,
      date: matchDate.toISOString().split('T')[0],
      time: startTime,
      endTime: endTime,
      court: court,
      description: description,
      basePrice: basePrice,
      initialPrice: basePrice,
      currentPrice: basePrice,
      maxPrice: basePrice * 3,
      expectedViews: Math.floor(Math.random() * 300),
      expectedWaitingApplicants: Math.floor(Math.random() * 5),
      expectedParticipants: { male: expectedMale, female: expectedFemale, total: expectedMale + expectedFemale },
      currentApplicants: { male: currentMale, female: currentFemale, total: currentMale + currentFemale },
      matchType: matchType,
      waitingApplicants: shouldClose ? Math.floor(Math.random() * 3) : 0,
      waitingList: [],
      participants: [],
      adEnabled: Math.random() > 0.8,
      ntrpRequirement: { min: ntrpMin, max: ntrpMin + 1.5 },
      weather: Math.random() > 0.8 ? '흐림' : '맑음',
      location: selectedRegion,
      createdAt: new Date().toISOString(),
      isClosed: shouldClose,
    } as any;
  }

  // ==========================================
  // 5. Supabase 연동 및 유틸리티
  // ==========================================

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
  matchType: supabaseMatch.match_type.includes(',') 
        ? supabaseMatch.match_type.split(',') as any
        : supabaseMatch.match_type as any,
      waitingApplicants: supabaseMatch.waiting_applicants,
      waitingList: [],
      participants: (supabaseMatch as any).participants || [],
      applications: (supabaseMatch as any).applications || [],
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

  static async saveMatchToSupabase(match: Match): Promise<boolean> {
    try {
      if (!supabaseAdmin) {
        console.log('Supabase Admin 미설정으로 저장 건너뜀');
        return false;
      }
      
      const isDummyMatch = (match as any).isDummy ?? true;

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
      match_type: Array.isArray(match.matchType) ? match.matchType.join(',') : match.matchType,
        waiting_applicants: match.waitingApplicants,
        ad_enabled: match.adEnabled,
        ntrp_min: match.ntrpRequirement.min,
        ntrp_max: match.ntrpRequirement.max,
        weather: match.weather,
        location: match.location,
        is_dummy: isDummyMatch,
        created_at: match.createdAt,
        is_closed: match.isClosed || false,
        applications: (match as any).applications || [],
        participants: (match as any).participants || [],
      };

      const { error } = await supabaseAdmin.from('matches').insert([supabaseData]);

      if (error) {
        console.error('매치 저장 실패:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('saveMatchToSupabase 에러:', error);
      return false;
    }
  }

  static async getAllMatches(fallbackMatches: Match[]): Promise<Match[]> {
    try {
      if (!supabase) return fallbackMatches;
      const { data, error } = await supabase.from('matches').select('*').order('created_at', { ascending: false });
      if (error || !data) return fallbackMatches;
      return data.map(this.convertSupabaseToMatch);
    } catch {
      return fallbackMatches;
    }
  }

  static async generateOneTimeDummyMatches(count: number = 10): Promise<Match[]> {
    const matches: Match[] = [];
    
    const closedCount = Math.floor(count * 0.4);
    
    for (let i = 0; i < count; i++) {
      const shouldClose = i < closedCount;
      matches.push(this.generateNewMatch(shouldClose));
    }
    
    for (let i = matches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matches[i], matches[j]] = [matches[j], matches[i]];
    }
    
    const promises = matches.map(m => this.saveMatchToSupabase(m));
    await Promise.all(promises);
    return matches;
  }

  static async deleteAllDummyMatches(): Promise<{ success: boolean; deletedCount: number }> {
    if (!supabaseAdmin) return { success: false, deletedCount: 0 };
    const { count } = await supabaseAdmin.from('matches').select('*', { count: 'exact', head: true }).eq('is_dummy', true);
    const { error } = await supabaseAdmin.from('matches').delete().eq('is_dummy', true);
    if (error) return { success: false, deletedCount: 0 };
    return { success: true, deletedCount: count || 0 };
  }

  static async deleteAllMatches(): Promise<{ success: boolean; deletedCount: number }> {
     if (!supabaseAdmin) return { success: false, deletedCount: 0 };
     const { count } = await supabaseAdmin.from('matches').select('*', { count: 'exact', head: true });
     const { error } = await supabaseAdmin.from('matches').delete().neq('id', '0');
     if (error) return { success: false, deletedCount: 0 };
     return { success: true, deletedCount: count || 0 };
  }

  static async getDummyMatchCount(): Promise<number> {
    if (!supabase) return 0;
    const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_dummy', true);
    return count || 0;
  }
}