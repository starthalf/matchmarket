import { supabase, supabaseAdmin } from './supabase';

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
      if (!supabase) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .rpc('is_admin', { user_id: user.id });

      return !error && data === true;
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
   * 출금 신청 목록 조회
   */
  static async getWithdrawalRequests(status?: string): Promise<WithdrawalRequest[]> {
    try {
      if (!supabaseAdmin) return [];

      let query = supabaseAdmin
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('출금 신청 조회 오류:', error);
        return [];
      }

      return data.map(this.dbToWithdrawalRequest);
    } catch (error) {
      console.error('출금 신청 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * 출금 신청 상태 업데이트
   */
  static async updateWithdrawalStatus(
    requestId: string,
    status: 'processing' | 'completed' | 'failed',
    adminId: string,
    adminNote?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: 'Supabase Admin이 설정되지 않았습니다.' };
      }

      const updateData: any = {
        status,
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (adminNote) {
        updateData.admin_note = adminNote;
      }

      const { data, error } = await supabaseAdmin
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('출금 상태 업데이트 오류:', error);
        return { success: false, error: '출금 상태 업데이트에 실패했습니다.' };
      }

      // 관리자 활동 로그 기록
      await this.logAdminAction(adminId, 'update_withdrawal', 'withdrawal_request', requestId, {
        newStatus: status,
        adminNote: adminNote
      });

      return { success: true };
    } catch (error) {
      console.error('출금 상태 업데이트 중 오류:', error);
      return { success: false, error: '출금 상태 업데이트 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 입금 확인 대기 목록 조회
   */
  static async getPendingPayments(): Promise<PaymentConfirmation[]> {
    try {
      if (!supabaseAdmin) return [];

      const { data, error } = await supabaseAdmin
        .from('payment_confirmations')
        .select('*')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('입금 확인 목록 조회 오류:', error);
        return [];
      }

      return data.map(this.dbToPaymentConfirmation);
    } catch (error) {
      console.error('입금 확인 목록 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * 입금 확정 처리
   */
  static async confirmPayment(
    paymentId: string,
    adminId: string,
    adminNote?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: 'Supabase Admin이 설정되지 않았습니다.' };
      }

      const { data, error } = await supabaseAdmin
        .from('payment_confirmations')
        .update({
          status: 'confirmed',
          confirmed_by: adminId,
          confirmed_at: new Date().toISOString(),
          admin_note: adminNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        console.error('입금 확정 오류:', error);
        return { success: false, error: '입금 확정에 실패했습니다.' };
      }

      // 관리자 활동 로그 기록
      await this.logAdminAction(adminId, 'confirm_payment', 'payment_confirmation', paymentId, {
        matchId: data.match_id,
        userId: data.user_id,
        amount: data.amount,
        adminNote: adminNote
      });

      return { success: true };
    } catch (error) {
      console.error('입금 확정 중 오류:', error);
      return { success: false, error: '입금 확정 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 시스템 설정 조회
   */
  static async getSystemSettings(category?: string): Promise<Record<string, any>> {
    try {
      if (!supabase) return {};

      let query = supabase
        .from('system_settings')
        .select('key, value, data_type');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('시스템 설정 조회 오류:', error);
        return {};
      }

      const settings: Record<string, any> = {};
      data.forEach(setting => {
        let value = setting.value;
        
        // 데이터 타입에 따른 변환
        switch (setting.data_type) {
          case 'number':
            value = parseFloat(setting.value);
            break;
          case 'boolean':
            value = setting.value === 'true';
            break;
          case 'json':
            try {
              value = JSON.parse(setting.value);
            } catch {
              value = setting.value;
            }
            break;
        }
        
        settings[setting.key] = value;
      });

      return settings;
    } catch (error) {
      console.error('시스템 설정 조회 중 오류:', error);
      return {};
    }
  }

  /**
   * 시스템 설정 업데이트
   */
  static async updateSystemSetting(
    category: string,
    key: string,
    value: any,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabaseAdmin) {
        return { success: false, error: 'Supabase Admin이 설정되지 않았습니다.' };
      }

      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      const { error } = await supabaseAdmin
        .from('system_settings')
        .upsert({
          category,
          key,
          value: stringValue,
          updated_by: adminId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'category,key' });

      if (error) {
        console.error('시스템 설정 업데이트 오류:', error);
        return { success: false, error: '시스템 설정 업데이트에 실패했습니다.' };
      }

      // 관리자 활동 로그 기록
      await this.logAdminAction(adminId, 'update_setting', 'system_setting', `${category}.${key}`, {
        category,
        key,
        newValue: value
      });

      return { success: true };
    } catch (error) {
      console.error('시스템 설정 업데이트 중 오류:', error);
      return { success: false, error: '시스템 설정 업데이트 중 오류가 발생했습니다.' };
    }
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
          details: details ? JSON.stringify(details) : null,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('관리자 로그 기록 오류:', error);
    }
  }

  /**
   * 관리자 활동 로그 조회
   */
  static async getAdminLogs(limit: number = 50): Promise<AdminLog[]> {
    try {
      if (!supabaseAdmin) return [];

      const { data, error } = await supabaseAdmin
        .from('admin_logs')
        .select(`
          id, admin_id, action, target_type, target_id, details,
          ip_address, user_agent, created_at,
          admin_users(email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('관리자 로그 조회 오류:', error);
        return [];
      }

      return data.map(log => ({
        id: log.id,
        adminId: log.admin_id,
        action: log.action,
        targetType: log.target_type,
        targetId: log.target_id,
        details: log.details ? JSON.parse(log.details) : null,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at
      }));
    } catch (error) {
      console.error('관리자 로그 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * 대시보드 통계 조회
   */
  static async getDashboardStats(): Promise<{
    totalUsers: number;
    totalMatches: number;
    totalRevenue: number;
    pendingWithdrawals: number;
    pendingPayments: number;
    activeMatches: number;
  }> {
    try {
      if (!supabaseAdmin) {
        return {
          totalUsers: 0,
          totalMatches: 0,
          totalRevenue: 0,
          pendingWithdrawals: 0,
          pendingPayments: 0,
          activeMatches: 0
        };
      }

      // 병렬로 모든 통계 조회
      const [
        { count: totalMatches },
        { count: pendingWithdrawals },
        { count: pendingPayments },
        { count: activeMatches }
      ] = await Promise.all([
        supabaseAdmin.from('matches').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('payment_confirmations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('matches').select('*', { count: 'exact', head: true }).gte('date', new Date().toISOString().split('T')[0])
      ]);

      // 총 수익 계산 (완료된 출금 신청들의 합)
      const { data: completedWithdrawals } = await supabaseAdmin
        .from('withdrawal_requests')
        .select('amount')
        .eq('status', 'completed');

      const totalRevenue = completedWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

      return {
        totalUsers: 0, // auth.users 테이블에서 조회 필요
        totalMatches: totalMatches || 0,
        totalRevenue,
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingPayments: pendingPayments || 0,
        activeMatches: activeMatches || 0
      };
    } catch (error) {
      console.error('대시보드 통계 조회 오류:', error);
      return {
        totalUsers: 0,
        totalMatches: 0,
        totalRevenue: 0,
        pendingWithdrawals: 0,
        pendingPayments: 0,
        activeMatches: 0
      };
    }
  }

  /**
   * DB 형식을 AdminUser로 변환
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
   * DB 형식을 WithdrawalRequest로 변환
   */
  private static dbToWithdrawalRequest(dbData: any): WithdrawalRequest {
    return {
      id: dbData.id,
      userId: dbData.user_id,
      userName: dbData.user_name,
      amount: dbData.amount,
      bankName: dbData.bank_name,
      accountNumber: dbData.account_number,
      accountHolder: dbData.account_holder,
      status: dbData.status,
      adminNote: dbData.admin_note,
      processedBy: dbData.processed_by,
      processedAt: dbData.processed_at,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    };
  }

  /**
   * DB 형식을 PaymentConfirmation으로 변환
   */
  private static dbToPaymentConfirmation(dbData: any): PaymentConfirmation {
    return {
      id: dbData.id,
      matchId: dbData.match_id,
      userId: dbData.user_id,
      userName: dbData.user_name,
      amount: dbData.amount,
      depositorName: dbData.depositor_name,
      status: dbData.status,
      adminNote: dbData.admin_note,
      confirmedBy: dbData.confirmed_by,
      confirmedAt: dbData.confirmed_at,
      submittedAt: dbData.submitted_at,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    };
  }
}