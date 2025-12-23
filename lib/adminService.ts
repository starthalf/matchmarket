// lib/adminService.ts
import { supabase, supabaseAdmin } from './supabase';

// 데모 관리자 이메일 목록
const DEMO_ADMIN_EMAILS = ['admin@demo.com', 'hcgkhlee@gmail.com'];

export interface AdminUser {
  id: string;
  userId: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  adminNote?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentConfirmation {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  amount: number;
  depositorName: string;
  status: 'pending' | 'confirmed' | 'rejected';
  adminNote?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export class AdminService {
  /**
   * 현재 사용자가 관리자인지 확인
   */
  static async isCurrentUserAdmin(): Promise<boolean> {
    try {
      // 데모 환경에서는 간단한 체크
      if (!supabase) {
        console.log('Supabase 연결 없음 - 데모 모드에서는 false 반환');
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Supabase 사용자 없음');
        return false;
      }

      // 데모 관리자 계정 확인
      if (user.email && DEMO_ADMIN_EMAILS.includes(user.email)) {
        console.log('데모 관리자 계정 확인됨:', user.email);
        return true;
      }

      // 실제 관리자 권한 확인 (RPC 함수 사용)
      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user.id });

      if (error) {
        console.error('관리자 권한 확인 RPC 오류:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('관리자 권한 확인 오류:', error);
      return false;
    }
  }

  /**
   * 관리자 로그인
   */
  static async adminLogin(email: string, password: string): Promise<{
    success: boolean;
    error?: string;
    adminUser?: AdminUser;
  }> {
    try {
      // 데모 계정 로그인
      if (DEMO_ADMIN_EMAILS.includes(email)) {
        console.log('데모 관리자 로그인 시도:', email);
        
        const demoAdminUser: AdminUser = {
          id: 'demo-admin-id',
          userId: 'demo-user-id',
          email: email,
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return {
          success: true,
          adminUser: demoAdminUser
        };
      }

      if (!supabase) {
        return { success: false, error: 'Supabase가 설정되지 않았습니다.' };
      }

      // Supabase Auth로 로그인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || '로그인에 실패했습니다.' };
      }

      // 관리자 권한 확인
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        return { success: false, error: '관리자 권한이 없습니다.' };
      }

      // 마지막 로그인 시간 업데이트
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminData.id);

      // 로그인 로그 기록
      await this.logAdminAction(adminData.id, 'login', 'system', 'login', {
        email: email,
        loginTime: new Date().toISOString()
      });

      return {
        success: true,
        adminUser: this.dbToAdminUser(adminData)
      };
    } catch (error) {
      console.error('관리자 로그인 오류:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  }

  /**
   * DB 데이터를 AdminUser 타입으로 변환
   */
  private static dbToAdminUser(dbData: any): AdminUser {
    return {
      id: dbData.id,
      userId: dbData.user_id,
      email: dbData.email,
      role: dbData.role,
      permissions: dbData.permissions || [],
      isActive: dbData.is_active,
      lastLoginAt: dbData.last_login_at,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    };
  }

  /**
   * 관리자 활동 로그 기록
   */
  static async logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: any
  ): Promise<void> {
    try {
      if (!supabaseAdmin) return;

      await supabaseAdmin
        .from('admin_logs')
        .insert({
          admin_id: adminId,
          action,
          target_type: targetType,
          target_id: targetId,
          details,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('관리자 로그 기록 오류:', error);
    }
  }

  // ... 기타 메서드들은 원본과 동일하게 유지
}