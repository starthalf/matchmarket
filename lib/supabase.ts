import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// 디버깅 로그 추가
console.log('🔧 DEBUG: Supabase 모듈 로드 시작');
console.log('🔧 DEBUG: Platform.OS:', Platform.OS);
console.log('🔧 DEBUG: process.env 객체 존재 여부:', typeof process !== 'undefined' && typeof process.env !== 'undefined');

// 환경변수 직접 접근 테스트
try {
  console.log('🔧 DEBUG: 직접 환경변수 접근 테스트');
  console.log('🔧 DEBUG: EXPO_PUBLIC_SUPABASE_URL (직접):', process.env.EXPO_PUBLIC_SUPABASE_URL ? `${process.env.EXPO_PUBLIC_SUPABASE_URL.substring(0, 30)}...` : 'undefined');
  console.log('🔧 DEBUG: EXPO_PUBLIC_SUPABASE_ANON_KEY (직접):', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...` : 'undefined');
  console.log('🔧 DEBUG: EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (직접):', process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? `${process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY.substring(0, 30)}...` : 'undefined');
} catch (directAccessError) {
  console.error('🔧 DEBUG: 직접 환경변수 접근 실패:', directAccessError);
}

// 환경변수 안전하게 가져오기
const getEnvVar = (key: string): string | undefined => {
  try {
    const value = process.env[key];
    console.log(`🔧 DEBUG: getEnvVar(${key}) 호출됨`);
    console.log(`🔧 DEBUG: getEnvVar(${key}) 결과:`, value ? `${value.substring(0, 30)}...` : 'undefined');
    console.log(`🔧 DEBUG: getEnvVar(${key}) 타입:`, typeof value);
    console.log(`🔧 DEBUG: getEnvVar(${key}) 길이:`, value ? value.length : 0);
    return value;
  } catch (error) {
    console.error(`🔧 DEBUG: 환경변수 ${key} 접근 실패:`, error);
    return undefined;
  }
};

console.log('🔧 DEBUG: getEnvVar 함수 정의 완료');

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');
const supabaseServiceKey = getEnvVar('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

console.log('🔧 DEBUG: 환경변수 추출 완료');
console.log('🔧 DEBUG: supabaseUrl 최종값:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined');
console.log('🔧 DEBUG: supabaseAnonKey 최종값:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'undefined');
console.log('🔧 DEBUG: supabaseServiceKey 최종값:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 30)}...` : 'undefined');

// Supabase 클라이언트 생성 (환경변수가 없으면 null)
export const supabase = (() => {
  try {
    console.log('🔧 DEBUG: Supabase 클라이언트 생성 시도 시작');
    console.log('🔧 DEBUG: URL 유효성 검사:', supabaseUrl ? supabaseUrl.startsWith('https://') : false);
    console.log('🔧 DEBUG: Anon Key 유효성 검사:', supabaseAnonKey ? supabaseAnonKey.length > 20 : false);
    
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20) {
      console.log('🔧 DEBUG: 조건 충족 - createClient 호출');
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: Platform.OS !== 'web',
          autoRefreshToken: true,
        }
      });
      console.log('🔧 DEBUG: Supabase 클라이언트 생성 성공:', !!client);
      return client;
    }
    console.error('🔧 DEBUG: ⚠️ Supabase 환경변수가 올바르지 않습니다:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      urlValid: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
      keyValid: supabaseAnonKey ? supabaseAnonKey.length > 20 : false
    });
    return null;
  } catch (error) {
    console.error('🔧 DEBUG: Supabase 클라이언트 생성 실패:', error);
    return null;
  }
})();

export const supabaseAdmin = (() => {
  try {
    console.log('🔧 DEBUG: Supabase Admin 클라이언트 생성 시도 시작');
    if (supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith('https://') && supabaseServiceKey.length > 20) {
      console.log('🔧 DEBUG: Admin 조건 충족 - createClient 호출');
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('🔧 DEBUG: Supabase Admin 클라이언트 생성 성공:', !!adminClient);
      return adminClient;
    }
    console.log('🔧 DEBUG: Admin 클라이언트 조건 미충족');
    return null;
  } catch (error) {
    console.error('🔧 DEBUG: Supabase Admin 클라이언트 생성 실패:', error);
    return null;
  }
})();

// Supabase 연결 상태 확인
export const isSupabaseConfigured = () => {
  const configured = !!(supabase && typeof supabase.from === 'function');
  console.log('🔧 DEBUG: isSupabaseConfigured 호출됨, 결과:', configured);
  return configured;
};

// Supabase Admin 연결 상태 확인
export const isSupabaseAdminConfigured = () => {
  const configured = !!(supabaseAdmin && typeof supabaseAdmin.from === 'function');
  console.log('🔧 DEBUG: isSupabaseAdminConfigured 호출됨, 결과:', configured);
  return configured;
};

// 환경변수 상태 로깅
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  console.log('🔧 DEBUG: 웹 환경 - Supabase 환경변수 상태:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
  });
} else {
  console.log('🔧 DEBUG: 네이티브 환경 - Supabase 환경변수 상태:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
  });
}

console.log('🔧 DEBUG: Supabase 모듈 로드 완료');
console.log('🔧 DEBUG: 최종 supabase 클라이언트 상태:', !!supabase);
console.log('🔧 DEBUG: 최종 supabaseAdmin 클라이언트 상태:', !!supabaseAdmin);

// 사용자 프로필 타입 정의
export interface UserProfile {
  id: string;
  name: string;
  gender: '남성' | '여성';
  age_group: '20대' | '30대' | '40대' | '50대+';
  ntrp: number;
  experience: number;
  play_style: '공격형' | '수비형' | '올라운드';
  career_type: '동호인' | '대학선수' | '실업선수';
  certification_ntrp: 'none' | 'pending' | 'verified';
  certification_career: 'none' | 'pending' | 'verified';
  certification_youtube: 'none' | 'pending' | 'verified';
  certification_instagram: 'none' | 'pending' | 'verified';
  profile_image?: string;
  view_count: number;
  like_count: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
}

// 매치 데이터 타입 정의 (Supabase용)
export interface SupabaseMatch {
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
  seller_profile_image?: string;
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
  created_at: string;
  is_dummy: boolean; // 더미 데이터 구분용
  is_closed?: boolean; // 판매자가 수동으로 마감한 상태 (선택적 - 데이터베이스에 없을 수 있음)
}

// 앱 설정 타입
export interface AppSettings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}
