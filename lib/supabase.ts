import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// 환경변수 안전하게 가져오기
const getEnvVar = (key: string): string | undefined => {
  try {
    return process.env[key];
  } catch (error) {
    console.warn(`환경변수 ${key} 접근 실패:`, error);
    return undefined;
  }
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');
const supabaseServiceKey = getEnvVar('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

// Supabase 클라이언트 생성 (환경변수가 없으면 null)
export const supabase = (() => {
  try {
    if (supabaseUrl && supabaseAnonKey) {
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: Platform.OS !== 'web',
          autoRefreshToken: true,
        }
      });
    }
    return null;
  } catch (error) {
    console.warn('Supabase 클라이언트 생성 실패:', error);
    return null;
  }
})();

export const supabaseAdmin = (() => {
  try {
    if (supabaseUrl && supabaseServiceKey) {
      return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    return null;
  } catch (error) {
    console.warn('Supabase Admin 클라이언트 생성 실패:', error);
    return null;
  }
})();

// Supabase 연결 상태 확인
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// 환경변수 상태 로깅
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  console.log('🔧 Supabase 환경변수 상태:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
  });
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
  is_closed: boolean; // 판매자가 수동으로 마감한 상태
}

// 앱 설정 타입
export interface AppSettings {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}