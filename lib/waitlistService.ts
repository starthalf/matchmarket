import { supabase, supabaseAdmin, isSupabaseConfigured, isSupabaseAdminConfigured } from './supabase';
import { WaitingApplicant, Match, User } from '../types/tennis';

export interface WaitingApplicantDB {
  id: string;
  match_id: string;
  user_id: string;
  user_name: string;
  gender: string;
  ntrp: number;
  joined_at: string;
  status: string;
  payment_requested_at?: string;
  payment_expires_at?: string;
  payment_submitted_at?: string;
  depositor_name?: string;
  created_at: string;
  updated_at: string;
}

export class WaitlistService {
  /**
   * 대기자 목록 조회
   */
  static async getWaitingList(matchId: string): Promise<WaitingApplicant[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase가 설정되지 않음, 빈 대기자 목록 반환');
        return [];
      }

      const { data, error } = await supabase
        .from('waiting_applicants')
        .select('*')
        .eq('match_id', matchId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.warn('대기자 목록 조회 오류:', error);
        return [];
      }

      return data.map(this.dbToWaitingApplicant);
    } catch (error) {
      console.warn('대기자 목록 조회 중 오류:', error);
      return [];
    }
  }

  /**
   * 대기자 추가
   */
  static async addWaitingApplicant(
    matchId: string,
    user: User
  ): Promise<{ success: boolean; error?: string; position?: number }> {
    try {
      if (!isSupabaseAdminConfigured()) {
        return { success: false, error: 'Supabase Admin 클라이언트가 초기화되지 않았습니다.' };
      }

      // 이미 대기 중인지 확인
      const { data: existing } = await supabaseAdmin
        .from('waiting_applicants')
        .select('id')
        .eq('match_id', matchId)
        .eq('user_id', user.id)
        .eq('status', 'waiting')
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, error: '이미 대기자 목록에 등록되어 있습니다.' };
      }

      // 새 대기자 추가
      const { data, error } = await supabaseAdmin
        .from('waiting_applicants')
        .insert({
          match_id: matchId,
          user_id: user.id,
          user_name: user.name,
          gender: user.gender,
          ntrp: user.ntrp,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) {
        console.error('대기자 추가 오류:', error);
        return { success: false, error: '대기자 등록에 실패했습니다.' };
      }

      // 대기 순서 계산
      const { count } = await supabaseAdmin
        .from('waiting_applicants')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .eq('status', 'waiting')
        .lte('joined_at', data.joined_at);

      console.log(`✅ 대기자 등록 완료: ${user.name}님이 ${matchId} 매치 대기자로 등록`);
      
      return { success: true, position: count || 1 };
    } catch (error) {
      console.error('대기자 추가 중 오류:', error);
      return { success: false, error: '대기자 등록 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 대기자 제거
   */
  static async removeWaitingApplicant(
    matchId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseAdminConfigured()) {
        return { success: false, error: 'Supabase Admin 클라이언트가 초기화되지 않았습니다.' };
      }

      const { error } = await supabaseAdmin
        .from('waiting_applicants')
        .delete()
        .eq('match_id', matchId)
        .eq('user_id', userId);

      if (error) {
        console.error('대기자 제거 오류:', error);
        return { success: false, error: '대기자 제거에 실패했습니다.' };
      }

      console.log(`✅ 대기자 제거 완료: ${userId}님이 ${matchId} 매치 대기자에서 제거`);
      
      return { success: true };
    } catch (error) {
      console.error('대기자 제거 중 오류:', error);
      return { success: false, error: '대기자 제거 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 대기자 상태 업데이트
   */
  static async updateWaitingApplicantStatus(
    matchId: string,
    userId: string,
    status: string,
    additionalData?: Partial<WaitingApplicantDB>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isSupabaseAdminConfigured()) {
        return { success: false, error: 'Supabase Admin 클라이언트가 초기화되지 않았습니다.' };
      }

      const updateData = {
        status,
        ...additionalData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseAdmin
        .from('waiting_applicants')
        .update(updateData)
        .eq('match_id', matchId)
        .eq('user_id', userId);

      if (error) {
        console.error('대기자 상태 업데이트 오류:', error);
        return { success: false, error: '상태 업데이트에 실패했습니다.' };
      }

      console.log(`✅ 대기자 상태 업데이트: ${userId}님 -> ${status}`);
      
      return { success: true };
    } catch (error) {
      console.error('대기자 상태 업데이트 중 오류:', error);
      return { success: false, error: '상태 업데이트 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 매치의 대기자 수 조회
   */
  static async getWaitingCount(matchId: string): Promise<number> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase가 설정되지 않음, 대기자 수 0 반환');
        return 0;
      }

      const { count, error } = await supabase
        .from('waiting_applicants')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .eq('status', 'waiting');

      if (error) {
        console.error('대기자 수 조회 오류:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('대기자 수 조회 중 오류:', error);
      return 0;
    }
  }

  /**
   * 다음 대기자 조회 (성별별)
   */
  static async getNextWaiter(
    matchId: string,
    gender: '남성' | '여성'
  ): Promise<WaitingApplicant | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase가 설정되지 않음, 다음 대기자 없음');
        return null;
      }

      const { data, error } = await supabase
        .from('waiting_applicants')
        .select('*')
        .eq('match_id', matchId)
        .eq('gender', gender)
        .eq('status', 'waiting')
        .order('joined_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return this.dbToWaitingApplicant(data);
    } catch (error) {
      console.error('다음 대기자 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * DB 형식을 WaitingApplicant로 변환
   */
  private static dbToWaitingApplicant(dbData: WaitingApplicantDB): WaitingApplicant {
    return {
      id: dbData.id,
      userId: dbData.user_id,
      userName: dbData.user_name,
      gender: dbData.gender as '남성' | '여성',
      ntrp: dbData.ntrp,
      joinedAt: dbData.joined_at,
      status: dbData.status as any,
      paymentRequestedAt: dbData.payment_requested_at,
      paymentExpiresAt: dbData.payment_expires_at,
      paymentSubmittedAt: dbData.payment_submitted_at,
      depositorName: dbData.depositor_name,
    };
  }

  /**
   * WaitingApplicant를 DB 형식으로 변환
   */
  private static waitingApplicantToDb(waiter: WaitingApplicant): Omit<WaitingApplicantDB, 'id' | 'created_at' | 'updated_at'> {
    return {
      match_id: '', // 호출하는 곳에서 설정
      user_id: waiter.userId,
      user_name: waiter.userName,
      gender: waiter.gender,
      ntrp: waiter.ntrp,
      joined_at: waiter.joinedAt,
      status: waiter.status,
      payment_requested_at: waiter.paymentRequestedAt,
      payment_expires_at: waiter.paymentExpiresAt,
      payment_submitted_at: waiter.paymentSubmittedAt,
      depositor_name: waiter.depositorName,
    };
  }
}