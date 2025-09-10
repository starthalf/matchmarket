import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// 하드코딩된 Supabase 설정 (환경변수 시스템 문제로 인해)
const supabaseUrl = 'https://xroiblqjsxxoewfyrzjy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyb2libHFqc3h4b2V3Znlyemp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjYwNDUsImV4cCI6MjA3MjQ0MjA0NX0.fmgpJ8m2kJTDMi4YjCE2HVL8oLOEJ8Zm-XhjTKYgpKU';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyb2libHFqc3h4b2V3Znlyemp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg2NjA0NSwiZXhwIjoyMDcyNDQyMDQ1fQ.ZKkFNqnlt3IJKLUizIaC4oOKXp9NAao8YOW5Z_fZduA';

console.log('🔧 DEBUG: 하드코딩된 설정 사용:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined',
  serviceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'undefined'
});

// Supabase 클라이언트 생성
export const supabase = (() => {
  try {
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20) {
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: Platform.OS !== 'web',
          autoRefreshToken: true,
        }
      });
      console.log('🔧 DEBUG: Supabase 클라이언트 생성 성공:', !!client);
      return client;
    }
    console.warn('⚠️ Supabase 설정이 올바르지 않습니다:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      urlValid: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
      keyValid: supabaseAnonKey ? supabaseAnonKey.length > 20 : false
    });
    return null;
  } catch (error) {
    console.warn('Supabase 클라이언트 생성 실패:', error);
    return null;
  }
})();

export const supabaseAdmin = (() => {
  try {
    if (supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith('https://') && supabaseServiceKey.length > 20) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('🔧 DEBUG: Supabase Admin 클라이언트 생성 성공:', !!adminClient);
      console.log('🔧 DEBUG: 최종 supabaseAdmin 클라이언트 상태:', !!adminClient);
      return adminClient;
    }
    console.warn('⚠️ Supabase Admin 설정이 올바르지 않습니다:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlValid: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
      keyValid: supabaseServiceKey ? supabaseServiceKey.length > 20 : false
    });
    return null;
  } catch (error) {
    console.warn('Supabase Admin 클라이언트 생성 실패:', error);
    return null;
  }
})();

// Supabase 연결 상태 확인
export const isSupabaseConfigured = () => {
  return !!(supabase && typeof supabase.from === 'function');
};

// Supabase Admin 연결 상태 확인
export const isSupabaseAdminConfigured = () => {
  return !!(supabaseAdmin && typeof supabaseAdmin.from === 'function');
};

// 하드코딩 상태 로깅
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  console.log('🔧 Supabase 하드코딩 설정 상태:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
  });
}

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