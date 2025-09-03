import { supabase, supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';

export class SupabaseConnectionTest {
  /**
   * Supabase 연결 상태 전체 테스트
   */
  static async runFullConnectionTest(): Promise<{
    isConfigured: boolean;
    clientConnection: boolean;
    adminConnection: boolean;
    tablesExist: boolean;
    canRead: boolean;
    canWrite: boolean;
    errors: string[];
  }> {
    const result = {
      isConfigured: false,
      clientConnection: false,
      adminConnection: false,
      tablesExist: false,
      canRead: false,
      canWrite: false,
      errors: [] as string[]
    };

    try {
      // 1. 환경변수 설정 확인
      result.isConfigured = isSupabaseConfigured();
      if (!result.isConfigured) {
        result.errors.push('Supabase 환경변수가 설정되지 않았습니다.');
        return result;
      }

      // 2. 클라이언트 연결 테스트
      if (supabase) {
        try {
          const { data, error } = await supabase.from('matches').select('count').limit(1);
          result.clientConnection = !error;
          if (error) {
            result.errors.push(`클라이언트 연결 실패: ${error.message}`);
          }
        } catch (e) {
          result.errors.push(`클라이언트 연결 오류: ${e}`);
        }
      }

      // 3. 관리자 연결 테스트
      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin.from('matches').select('count').limit(1);
          result.adminConnection = !error;
          if (error) {
            result.errors.push(`관리자 연결 실패: ${error.message}`);
          }
        } catch (e) {
          result.errors.push(`관리자 연결 오류: ${e}`);
        }
      }

      // 4. 테이블 존재 확인
      if (supabase) {
        try {
          const { data: matchesData, error: matchesError } = await supabase
            .from('matches')
            .select('id')
            .limit(1);

          const { data: waitingData, error: waitingError } = await supabase
            .from('waiting_applicants')
            .select('id')
            .limit(1);

          const { data: settingsData, error: settingsError } = await supabase
            .from('app_settings')
            .select('key')
            .limit(1);

          result.tablesExist = !matchesError && !waitingError && !settingsError;
          
          if (matchesError) result.errors.push(`matches 테이블 오류: ${matchesError.message}`);
          if (waitingError) result.errors.push(`waiting_applicants 테이블 오류: ${waitingError.message}`);
          if (settingsError) result.errors.push(`app_settings 테이블 오류: ${settingsError.message}`);
        } catch (e) {
          result.errors.push(`테이블 확인 오류: ${e}`);
        }
      }

      // 5. 읽기 권한 테스트
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('matches')
            .select('*')
            .limit(5);

          result.canRead = !error;
          if (error) {
            result.errors.push(`읽기 권한 오류: ${error.message}`);
          } else {
            console.log(`✅ 읽기 테스트 성공: ${data?.length || 0}개 매치 조회됨`);
          }
        } catch (e) {
          result.errors.push(`읽기 테스트 오류: ${e}`);
        }
      }

      // 6. 쓰기 권한 테스트 (테스트 데이터 삽입 후 삭제)
      if (supabase) {
        try {
          const testId = `test_${Date.now()}`;
          
          // 테스트 데이터 삽입
          const { error: insertError } = await supabase
            .from('app_settings')
            .insert({
              key: testId,
              value: 'test_value'
            });

          if (!insertError) {
            // 삽입 성공 시 바로 삭제
            const { error: deleteError } = await supabase
              .from('app_settings')
              .delete()
              .eq('key', testId);

            result.canWrite = !deleteError;
            if (deleteError) {
              result.errors.push(`쓰기 테스트 정리 오류: ${deleteError.message}`);
            } else {
              console.log('✅ 쓰기 테스트 성공');
            }
          } else {
            result.errors.push(`쓰기 권한 오류: ${insertError.message}`);
          }
        } catch (e) {
          result.errors.push(`쓰기 테스트 오류: ${e}`);
        }
      }

    } catch (error) {
      result.errors.push(`전체 테스트 오류: ${error}`);
    }

    return result;
  }

  /**
   * 환경변수 상태 확인
   */
  static checkEnvironmentVariables(): {
    hasUrl: boolean;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
    urlPreview?: string;
  } {
    const hasUrl = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const hasServiceKey = !!(process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const urlPreview = hasUrl 
      ? `${process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 20)}...`
      : undefined;

    return {
      hasUrl,
      hasAnonKey,
      hasServiceKey,
      urlPreview
    };
  }

  /**
   * 데이터베이스 통계 조회
   */
  static async getDatabaseStats(): Promise<{
    totalMatches: number;
    dummyMatches: number;
    waitingApplicants: number;
    appSettings: number;
  }> {
    const stats = {
      totalMatches: 0,
      dummyMatches: 0,
      waitingApplicants: 0,
      appSettings: 0
    };

    try {
      if (!supabase) return stats;

      // 매치 통계
      const { count: totalMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true });

      const { count: dummyMatches } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('is_dummy', true);

      // 대기자 통계
      const { count: waitingApplicants } = await supabase
        .from('waiting_applicants')
        .select('*', { count: 'exact', head: true });

      // 설정 통계
      const { count: appSettings } = await supabase
        .from('app_settings')
        .select('*', { count: 'exact', head: true });

      stats.totalMatches = totalMatches || 0;
      stats.dummyMatches = dummyMatches || 0;
      stats.waitingApplicants = waitingApplicants || 0;
      stats.appSettings = appSettings || 0;

    } catch (error) {
      console.error('데이터베이스 통계 조회 오류:', error);
    }

    return stats;
  }
}