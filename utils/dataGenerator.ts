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

  // 닉네임 생성용 데이터셋
  private static readonly KR_ADJECTIVES = [
    '배고픈', '졸린', '힘든', '신난', '우아한', '강력한', '소심한', '대범한', 
    '왼손잡이', '양손잡이', '발이빠른', '서브만좋은', '네트앞', '베이스라인', 
    '전위', '후위', '땀많은', '매너있는', '즐겜러', '빡겜러', '돌아온', '지친', 
    '새벽형', '저녁형', '주말', '평일', '가난한', '부유한', '행복한', '슬픈'
  ];

  private static readonly KR_NOUNS = [
    '테린이', '나달', '페더러', '조코비치', '라켓', '공', '스매싱', '발리', 
    '요정', '깎는노인', '장인', '몬스터', '형', '누나', '동생', '아재', 
    '직장인', '백수', '개발자', '디자이너', '의사', '변호사', '선생님', '학생',
    '코치', '감독', '캡틴', '대장', '쫄보', '고수', '중수', '하수', '회원'
  ];

  private static readonly EN_WORDS = [
    'Tennis', 'Racket', 'Ace', 'Smash', 'Volley', 'Net', 'Court', 'Ball',
    'Spin', 'Slice', 'Top', 'Pro', 'Master', 'King', 'Queen', 'Prince',
    'Winner', 'Loser', 'Lover', 'Hater', 'Player', 'Coach', 'Captain',
    'Sky', 'Moon', 'Sun', 'Star', 'Fire', 'Water', 'Wind', 'Storm'
  ];

  private static readonly PLAY_STYLES = ['공격형', '수비형', '올라운드'];
  private static readonly CAREER_TYPES = ['동호인', '선수'];
  private static readonly MATCH_TYPES = ['단식', '남복', '여복', '혼복'];

  // ==========================================
  // 제목 생성용 조합 데이터셋 (대폭 확장)
  // ==========================================

  // 접두사 풀
  private static readonly TITLE_PREFIXES = {
    urgent: ['[급구]', '[긴급]', '[오늘]', '[당일]', '[마감임박]', '⚡', '🔥', '🚨', '[ASAP]', '[지금]'],
    normal: ['[모집]', '[구함]', '[참가자]', '[멤버]', '[게스트]', ''],
    region: (loc: string) => [`[${loc}]`, `${loc}`, ''],
    time: (time: string) => [`[${time}]`, `${time}시`, ''],
    type: (type: string) => [`[${type}]`, `${type}`, ''],
    emoji: ['🎾', '🏸', '💪', '☀️', '🌙', '⭐', ''],
  };

  // 본문 구조 풀
  private static readonly TITLE_BODIES = {
    court: (court: string) => [court, court.split(' ')[0], ''],
    action: ['구합니다', '모집', '찾습니다', '구해요', '모셔요', '찾아요', '환영', 'ㄱㄱ', '고고', '함께해요'],
    count: ['한 분', '1명', '한명', '파트너', '게스트', '용병', '멤버', '두 분', ''],
    skill: (ntrp: number) => [`${ntrp}+`, `NTRP ${ntrp}`, `${ntrp} 이상`, `${ntrp}~${ntrp + 1}`, ''],
  };

  // 접미사 풀
  private static readonly TITLE_SUFFIXES = {
    courtesy: ['부탁드려요', '감사합니다', '환영합니다', '오세요', '와주세요', '모십니다', ''],
    condition: ['(코트비X)', '(코트비 무료)', '(신구)', '(주차가능)', '(샤워실有)', '(몸만오세요)', '(음료제공)', ''],
    urgency: ['급해요!', '!!', '~', '요', '^^', 'ㅠㅠ', '...'],
    emotion: ['🙏', '😊', '💯', '👍', '🔥', '🎾', ''],
  };

  // 시간대별 표현
  private static readonly TIME_EXPRESSIONS = {
    morning: ['모닝', '아침', '새벽', '오전', '기상', '출근전'],
    lunch: ['점심', '낮', '런치타임', '맛점'],
    afternoon: ['오후', '낮', '애프터눈'],
    evening: ['저녁', '퇴근후', '이브닝', '야간', '칼퇴'],
    night: ['심야', '밤', '올빼미', '야식타임'],
  };

  // 어미/종결 표현
  private static readonly ENDINGS = [
    '하실 분', '치실 분', '가능하신 분', '오실 분', '같이 치실 분',
    '함께 해요', '같이 쳐요', '모여요', '달려요', '뛰어요',
    '구합니다', '찾습니다', '모집합니다', '구해요', '찾아요',
    'ㄱㄱ', '고고', '렛츠고', 'Let\'s go', '납치해가세요',
  ];

  // ==========================================
  // 2. 생성 로직 (닉네임, 제목, 설명)
  // ==========================================

  private static generateNaturalNickname(): string {
    const patterns = [
      () => {
        const adj = this.KR_ADJECTIVES[Math.floor(Math.random() * this.KR_ADJECTIVES.length)];
        const noun = this.KR_NOUNS[Math.floor(Math.random() * this.KR_NOUNS.length)];
        return `${adj}${noun}`;
      },
      () => {
        const regions = ['강남', '서초', '송파', '마포', '용산', '분당', '판교', '수원', '일산', '목동', '잠실'];
        const nicknames = ['왕발', '핵서브', '통곡의벽', '보라매', '지킴이', '보안관', '주민', '토박이', '에이스'];
        return `${regions[Math.floor(Math.random() * regions.length)]}${nicknames[Math.floor(Math.random() * nicknames.length)]}`;
      },
      () => {
        const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오'];
        const positions = ['프로', '코치', '회원', '총무', '부장', '대리', '사원', '선수', '감독'];
        return `${lastNames[Math.floor(Math.random() * lastNames.length)]}${positions[Math.floor(Math.random() * positions.length)]}`;
      },
      () => {
        const word1 = this.EN_WORDS[Math.floor(Math.random() * this.EN_WORDS.length)];
        const word2 = this.EN_WORDS[Math.floor(Math.random() * this.EN_WORDS.length)];
        const separator = Math.random() > 0.5 ? '_' : '';
        return `${word1}${separator}${word2}`;
      },
      () => {
        if (Math.random() > 0.5) {
          const kr = this.KR_NOUNS[Math.floor(Math.random() * this.KR_NOUNS.length)];
          const en = this.EN_WORDS[Math.floor(Math.random() * this.EN_WORDS.length)];
          return `${en}${kr}`; 
        } else {
          const region = ['Seoul', 'Korea', 'Gangnam', 'Busan', 'Jeju'];
          const kr = this.KR_NOUNS[Math.floor(Math.random() * this.KR_NOUNS.length)];
          return `${region[Math.floor(Math.random() * region.length)]}_${kr}`; 
        }
      },
      () => {
        const word = this.EN_WORDS[Math.floor(Math.random() * this.EN_WORDS.length)];
        const num = Math.floor(Math.random() * 99) + 1;
        return `${word}${num}`;
      }
    ];

    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    let nickname = selectedPattern();

    if (Math.random() < 0.2) {
      nickname += Math.floor(Math.random() * 1000);
    }

    return nickname;
  }

  /**
   * 랜덤 요소 선택 헬퍼
   */
  private static pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * 조합 기반 제목 생성 (다양성 극대화)
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

    // 시간대 판별
    let timeCategory: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' = 'afternoon';
    if (hour >= 5 && hour < 11) timeCategory = 'morning';
    else if (hour >= 11 && hour < 14) timeCategory = 'lunch';
    else if (hour >= 14 && hour < 18) timeCategory = 'afternoon';
    else if (hour >= 18 && hour < 21) timeCategory = 'evening';
    else timeCategory = 'night';

    const timeExpr = this.pick(this.TIME_EXPRESSIONS[timeCategory]);

    // 제목 생성 패턴 (20가지 이상)
    const patterns: (() => string)[] = [
      // 패턴 1: [지역] 코트 타입 액션 (접미사)
      () => {
        const prefix = this.pick(this.TITLE_PREFIXES.region(shortLoc));
        const body = `${shortCourt} ${matchType} ${this.pick(this.TITLE_BODIES.action)}`;
        const suffix = this.pick(this.TITLE_SUFFIXES.condition);
        return `${prefix} ${body} ${suffix}`.trim();
      },
      // 패턴 2: [급구] 시간 코트 액션
      () => {
        const prefix = this.pick(this.TITLE_PREFIXES.urgent);
        const body = `${time}시 ${shortCourt} ${this.pick(this.TITLE_BODIES.count)} ${this.pick(this.TITLE_BODIES.action)}`;
        return `${prefix} ${body}`.trim();
      },
      // 패턴 3: 시간대표현 타입 어미
      () => {
        const emoji = this.pick(this.TITLE_PREFIXES.emoji);
        const body = `${timeExpr} ${matchType} ${this.pick(this.ENDINGS)}`;
        return `${emoji} ${body}`.trim();
      },
      // 패턴 4: 코트 타입 인원 액션 감정
      () => {
        const body = `${courtName} ${matchType} ${this.pick(this.TITLE_BODIES.count)} ${this.pick(this.TITLE_BODIES.action)}`;
        const emotion = this.pick(this.TITLE_SUFFIXES.emotion);
        return `${body} ${emotion}`.trim();
      },
      // 패턴 5: [타입] 코트 / 시간
      () => {
        const prefix = this.pick(this.TITLE_PREFIXES.type(matchType));
        return `${prefix} ${courtName} / ${time} 시작`;
      },
      // 패턴 6: 실력 타입 어미 (지역)
      () => {
        const skill = this.pick(this.TITLE_BODIES.skill(ntrp));
        const ending = this.pick(this.ENDINGS);
        return `${skill} ${matchType} ${ending} (${shortLoc})`;
      },
      // 패턴 7: 짧은 캐주얼
      () => {
        return `${shortCourt} ${matchType} ${this.pick(['ㄱㄱ', '고고', 'ㄱ?', '가즈아'])}`;
      },
      // 패턴 8: 이모지 + 시간 + 코트 + 타입
      () => {
        const emoji = this.pick(['🎾', '🏸', '💪', '⭐', '🔥']);
        return `${emoji} ${time}시 ${shortCourt} ${matchType}`;
      },
      // 패턴 9: 긴급 상황 묘사
      () => {
        const situations = [
          `갑자기 펑크! ${matchType} ${this.pick(this.TITLE_BODIES.count)} 급구`,
          `한 분 빠지셔서 급하게 ${this.pick(this.TITLE_BODIES.action)}`,
          `오늘 ${time}시 대타 필요해요 (${shortCourt})`,
          `${matchType} 자리 하나 났어요 (${shortLoc})`,
        ];
        return this.pick(situations);
      },
      // 패턴 10: 인원 특정
      () => {
        const genderNeeds = ['남1', '여1', '남2', '여2', '남1여1'];
        return `${matchType} ${this.pick(genderNeeds)} ${this.pick(this.TITLE_BODIES.action)} (${time}시)`;
      },
      // 패턴 11: 조건 강조
      () => {
        const conditions = ['코트비 무료', '신구 깔아요', '주차 가능', '샤워실 있음', '음료 제공'];
        return `${shortCourt} ${matchType} (${this.pick(conditions)})`;
      },
      // 패턴 12: 게임 성향
      () => {
        const styles = ['빡겜', '즐겜', '랠리', '게임 위주', '연습'];
        return `${this.pick(styles)} ${this.pick(this.ENDINGS)} - ${shortCourt} ${matchType}`;
      },
      // 패턴 13: 실력 범위 명시
      () => {
        return `NTRP ${ntrp}~${(ntrp + 1).toFixed(1)} ${matchType} ${this.pick(this.TITLE_BODIES.action)}`;
      },
      // 패턴 14: 모임/클럽 스타일
      () => {
        const clubStyles = ['월례회', '정기모임', '번개', '벙개', '게스트'];
        return `${shortCourt} ${this.pick(clubStyles)} ${this.pick(this.TITLE_BODIES.count)} 모셔요`;
      },
      // 패턴 15: 질문형
      () => {
        const questions = [
          `${time}시 ${matchType} 같이 치실 분?`,
          `${shortCourt}에서 ${matchType} 한 게임 하실 분?`,
          `오늘 ${matchType} 가능하신 분 계신가요?`,
          `${timeExpr} 테니스 치실 분 있나요?`,
        ];
        return this.pick(questions);
      },
      // 패턴 16: 감성/분위기
      () => {
        const moods = [
          `${timeExpr} 테니스로 하루 시작해요 ☀️`,
          `퇴근 후 스트레스 해소 ${matchType} 🎾`,
          `주말 ${matchType} 함께해요 💪`,
          `오늘 하루 마무리는 테니스로! 🌙`,
        ];
        return this.pick(moods);
      },
      // 패턴 17: 초보 환영
      () => {
        const beginnerFriendly = [
          `테린이 환영! ${shortCourt} ${matchType}`,
          `초보도 OK! ${matchType} 편하게 쳐요`,
          `구력 무관 ${matchType} ${this.pick(this.TITLE_BODIES.action)}`,
          `실력 상관없이 즐겁게! (${shortLoc})`,
        ];
        return this.pick(beginnerFriendly);
      },
      // 패턴 18: 고수 모집
      () => {
        const proLevel = [
          `${ntrp}+ 고수님들 ${matchType} 빡겜 🔥`,
          `실력자 ${this.pick(this.TITLE_BODIES.action)} - ${matchType}`,
          `${matchType} 강한 랠리 원합니다 (${shortCourt})`,
        ];
        return this.pick(proLevel);
      },
      // 패턴 19: 날씨/계절
      () => {
        const weatherMoods = [
          `날씨 좋은 날 ${matchType} 한판!`,
          `시원한 ${timeExpr} 테니스 🎾`,
          `야외에서 상쾌하게! ${shortCourt}`,
        ];
        return this.pick(weatherMoods);
      },
      // 패턴 20: 단순 정보
      () => {
        return `${location} ${courtName} ${matchType} ${time}시`;
      },
      // 패턴 21: 파트너 구함
      () => {
        return `${matchType} 파트너 ${this.pick(this.TITLE_BODIES.action)} (${shortLoc} ${time}시)`;
      },
      // 패턴 22: 양도/대타
      () => {
        const transfers = [
          `${courtName} 코트 양도 (${time}시 ${matchType})`,
          `급 양도! ${shortCourt} ${matchType}`,
          `대타 급구 - ${time}시 ${shortLoc}`,
        ];
        return this.pick(transfers);
      },
    ];

    // 랜덤 패턴 선택 및 실행
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

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const intro = intros[Math.floor(Math.random() * intros.length)];
    const closing = closings[Math.floor(Math.random() * closings.length)];

    // 10% 확률로만 [진행 방식 및 정보] 섹션 포함
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
  // 3. 메인 매치 생성 함수
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
    let selectedRegion = regions[Math.floor(Math.random() * regions.length)];
    if (Math.random() < 0.6) {
      selectedRegion = Math.random() > 0.5 ? '서울시' : '경기도';
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

    // 마감 여부 결정: forceClose가 true이거나, 40% 확률로 마감
    const shouldClose = forceClose || Math.random() < 0.4;
    
    let currentMale: number;
    let currentFemale: number;
    
    if (shouldClose) {
      // 마감된 매치: 정원이 다 찼거나 초과
      currentMale = expectedMale;
      currentFemale = expectedFemale;
    } else {
      // 진행 중인 매치: 50~90% 채워짐
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
      waitingApplicants: shouldClose ? Math.floor(Math.random() * 3) : 0, // 마감된 매치는 대기자 있을 수 있음
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
  // 4. Supabase 연동 및 유틸리티
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
      matchType: supabaseMatch.match_type as '단식' | '남복' | '여복' | '혼복',
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
        match_type: match.matchType,
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
    
    // 40%는 마감, 60%는 진행 중
    const closedCount = Math.floor(count * 0.4);
    
    for (let i = 0; i < count; i++) {
      const shouldClose = i < closedCount;
      matches.push(this.generateNewMatch(shouldClose));
    }
    
    // 셔플해서 마감/진행중이 섞이도록
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