// utils/supabaseDebug.ts
import { supabase, supabaseAdmin } from '../lib/supabase';

export class SupabaseDebug {
  
  /**
   * 사용자 계정 상태 상세 확인 (수정된 버전)
   */
  static async debugUserStatus(email: string): Promise<any> {
    try {
      console.log(`🔍 ${email} 계정 상태 조사 시작...`);
      
      if (!supabaseAdmin) {
        return { error: 'Supabase Admin이 설정되지 않았습니다.' };
      }

      // 1. Admin API를 통한 사용자 조회 (올바른 방법)
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        return { 
          step: 'listUsers',
          error: listError.message 
        };
      }

      // 해당 이메일 사용자 찾기
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return { 
          step: 'findUser',
          result: '사용자를 찾을 수 없음',
          totalUsers: users.length,
          availableEmails: users.map(u => u.email).slice(0, 3) // 처음 3개만 보여주기
        };
      }

      console.log('✅ Auth 사용자 발견:', {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        confirmed_at: user.confirmed_at,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      });

      // 2. Users 테이블에 프로필 있는지 확인
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('프로필 조회 결과:', {
        hasProfile: !!profileData,
        profileError: profileError?.message
      });

      // 3. 실제 로그인 시도 (테스트)
      const loginResult = await this.testDirectLogin(email, 'demo123');

      return {
        authUser: {
          id: user.id,
          email: user.email,
          emailConfirmed: !!user.email_confirmed_at,
          confirmed: !!user.confirmed_at,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at
        },
        profile: {
          exists: !!profileData,
          data: profileData,
          error: profileError?.message
        },
        loginTest: loginResult
      };

    } catch (error) {
      console.error('❌ 디버깅 실패:', error);
      return { error: `디버깅 실패: ${error}` };
    }
  }

  /**
   * 직접 로그인 테스트 (상세 로그)
   */
  static async testDirectLogin(email: string, password: string): Promise<any> {
    if (!supabase) {
      return { error: 'Supabase 클라이언트 없음' };
    }

    try {
      console.log(`🔐 직접 로그인 테스트: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ 로그인 실패:', error);
        return {
          success: false,
          error: error.message,
          code: error.status
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: '로그인 성공했지만 user 없음'
        };
      }

      console.log('✅ 로그인 성공:', {
        userId: data.user.id,
        email: data.user.email
      });

      // 프로필 조회 시도
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // 테스트 후 로그아웃
      await supabase.auth.signOut();

      return {
        success: true,
        userId: data.user.id,
        profileExists: !!profile,
        profileError: profileError?.message,
        profile: profile
      };

    } catch (error) {
      console.error('❌ 로그인 테스트 실패:', error);
      return {
        success: false,
        error: `테스트 실패: ${error}`
      };
    }
  }

  /**
   * 사용자 계정 강제 활성화 (수정된 버전)
   */
  static async forceActivateUser(email: string): Promise<any> {
    if (!supabaseAdmin) {
      return { error: 'Supabase Admin이 설정되지 않았습니다.' };
    }

    try {
      console.log(`🔧 ${email} 계정 강제 활성화...`);

      // 사용자 찾기
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        return { error: `사용자 목록 조회 실패: ${listError.message}` };
      }

      const user = users.find(u => u.email === email);
      
      if (!user) {
        return { error: `사용자를 찾을 수 없습니다: ${email}` };
      }

      // 이메일 확인 + 활성화
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          email_confirm: true
        }
      );

      if (error) {
        return { error: `활성화 실패: ${error.message}` };
      }

      console.log('✅ 계정 활성화 완료');
      return { 
        success: true, 
        message: '계정이 활성화되었습니다.' 
      };

    } catch (error) {
      return { error: `활성화 중 오류: ${error}` };
    }
  }

  /**
   * 누락된 프로필 생성
   */
  static async createMissingProfile(email: string): Promise<any> {
    if (!supabaseAdmin) {
      return { error: 'Supabase Admin이 설정되지 않았습니다.' };
    }

    try {
      // 사용자 찾기
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        return { error: '사용자 목록 조회 실패' };
      }

      const user = users.find(u => u.email === email);
      
      if (!user) {
        return { error: '사용자를 찾을 수 없습니다.' };
      }

      // 기본 프로필 생성
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          name: user.email?.split('@')[0] || 'Unknown',
          gender: '남성',
          age_group: '30대',
          ntrp: 3.0,
          experience: 12,
          play_style: '올라운드',
          career_type: '동호인',
          certification_ntrp: 'none',
          certification_career: 'none',
          certification_youtube: 'none',
          certification_instagram: 'none',
          view_count: 0,
          like_count: 0,
          avg_rating: 0
        });

      if (insertError) {
        return { error: `프로필 생성 실패: ${insertError.message}` };
      }

      return { success: true, message: '기본 프로필이 생성되었습니다.' };

    } catch (error) {
      return { error: `프로필 생성 중 오류: ${error}` };
    }
  }

  /**
   * 간단한 상태 확인 (가장 기본적인 방법)
   */
  static async simpleCheck(email: string): Promise<any> {
    try {
      console.log(`🔍 간단한 상태 확인: ${email}`);
      
      // 1. 일반 클라이언트로 로그인 시도
      if (!supabase) {
        return { error: 'Supabase 클라이언트가 없습니다.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'demo123'
      });

      if (error) {
        return {
          canLogin: false,
          error: error.message,
          errorCode: error.status
        };
      }

      if (data.user) {
        // 로그인 성공 - 프로필 확인
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // 테스트 후 로그아웃
        await supabase.auth.signOut();

        return {
          canLogin: true,
          userId: data.user.id,
          hasProfile: !!profile,
          profileError: profileError?.message
        };
      }

      return { canLogin: false, error: '알 수 없는 오류' };

    } catch (error) {
      return { error: `체크 실패: ${error}` };
    }
  }
}