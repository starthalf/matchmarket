import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// 환경변수에서 설정 읽기 (fallback으로 하드코딩 값 사용)
const getSupabaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const fallbackUrl = 'https://xroiblqjsxxoewfyrzjy.supabase.co';
  
  console.log('🔧 DEBUG: Supabase URL 확인:', {
    fromEnv: envUrl || 'undefined',
    usingFallback: !envUrl,
    final: envUrl || fallbackUrl
  });
  
  return envUrl || fallbackUrl;
};

const getSupabaseAnonKey = () => {
  const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyb2libHFqc3h4b2V3Znlyemp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NjYwNDUsImV4cCI6MjA3MjQ0MjA0NX0.7yJY-u-L-_UdZgMVKFJlR2mmJel-wLt9ItehVMt0wNo';
  
  console.log('🔧 DEBUG: Supabase Anon Key 확인:', {
    fromEnv: envKey ? `${envKey.substring(0, 20)}...` : 'undefined',
    usingFallback: !envKey,
    final: envKey ? `${envKey.substring(0, 20)}...` : `${fallbackKey.substring(0, 20)}...`
  });
  
  return envKey || fallbackKey;
};

const getSupabaseServiceKey = () => {
  // 여러 환경변수 위치 확인
  const envKey1 = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const envKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyb2libHFqc3h4b2V3Znlyemp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njg2NjA0NSwiZXhwIjoyMDcyNDQyMDQ1fQ.ZKkFNqnlt3IJKLUizIaC4oOKXp9NAao8YOW5Z_fZduA';
  
  const finalKey = envKey1 || envKey2 || fallbackKey;
  
  console.log('🔧 DEBUG: Supabase Service Key 확인:', {
    fromEnv1: envKey1 ? `${envKey1.substring(0, 20)}...` : 'undefined',
    fromEnv2: envKey2 ? `${envKey2.substring(0, 20)}...` : 'undefined',
    usingFallback: !envKey1 && !envKey2,
    final: finalKey ? `${finalKey.substring(0, 20)}...` : 'undefined'
  });
  
  return finalKey;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();
const supabaseServiceKey = getSupabaseServiceKey();

// Supabase 클라이언트 생성
let supabase: any = null;
try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 20) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: Platform.OS !== 'web',
        autoRefreshToken: true,
      }
    });
    console.log('✅ Supabase 클라이언트 생성 성공');
  } else {
    console.warn('⚠️ Supabase 설정이 누락되거나 올바르지 않습니다');
  }
} catch (error) {
  console.error('❌ Supabase 클라이언트 생성 실패:', error);
  supabase = null;
}

// Supabase Admin 클라이언트 생성 (Service Role Key 사용)
let supabaseAdmin: any = null;
try {
  if (supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith('https://') && supabaseServiceKey.length > 20) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase Admin 클라이언트 생성 성공');
  } else {
    console.warn('⚠️ Supabase Admin 설정이 누락되거나 올바르지 않습니다');
  }
} catch (error) {
  console.error('❌ Supabase Admin 클라이언트 생성 실패:', error);
  supabaseAdmin = null;
}

export { supabase, supabaseAdmin };

// Supabase 연결 상태 확인
export const isSupabaseConfigured = () => {
  const configured = !!(supabase && typeof supabase.from === 'function');
  console.log('🔧 DEBUG: isSupabaseConfigured =', configured);
  return configured;
};

// Supabase Admin 연결 상태 확인
export const isSupabaseAdminConfigured = () => {
  const configured = !!(supabaseAdmin && typeof supabaseAdmin.from === 'function');
  console.log('🔧 DEBUG: isSupabaseAdminConfigured =', configured);
  return configured;
};