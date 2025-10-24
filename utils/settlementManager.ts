import { supabaseAdmin } from '../lib/supabase';

export interface SettlementPayment {
  id: string;
  settlement_id: string;
  paid_amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface MonthlySettlementWithPayments {
  id: string;
  seller_id: string;
  year: number;
  month: number;
  match_count: number;
  total_revenue: number;
  additional_revenue: number;
  commission_due: number;
  total_paid_amount: number;
  unpaid_amount: number;
  payment_status: 'pending' | 'paid' | 'confirmed';
  is_account_suspended: boolean;
  suspension_date?: string;
  admin_notes?: string;
  created_at: string;
  payments?: SettlementPayment[];
  seller_name?: string;
}

export class SettlementManager {
  static async getAllSettlementsByMonth(year: number, month: number): Promise<MonthlySettlementWithPayments[]> {
    try {
      const { data: settlements, error } = await supabaseAdmin
        .from('monthly_settlements')
        .select(`
          *,
          users:seller_id (
            name
          )
        `)
        .eq('year', year)
        .eq('month', month)
        .order('unpaid_amount', { ascending: false });

      if (error) {
        console.error('월별 정산 조회 실패:', error);
        return [];
      }

      const settlementsWithPayments: MonthlySettlementWithPayments[] = [];

      for (const settlement of settlements || []) {
        const payments = await this.getPaymentsBySettlementId(settlement.id);

        settlementsWithPayments.push({
          ...settlement,
          seller_name: settlement.users?.name || '알 수 없음',
          payments
        });
      }

      return settlementsWithPayments;
    } catch (error) {
      console.error('월별 정산 조회 중 오류:', error);
      return [];
    }
  }

  static async getPaymentsBySettlementId(settlementId: string): Promise<SettlementPayment[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('settlement_payments')
        .select('*')
        .eq('settlement_id', settlementId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('정산 입금 내역 조회 실패:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('정산 입금 내역 조회 중 오류:', error);
      return [];
    }
  }

  static async addPayment(
    settlementId: string,
    paidAmount: number,
    paymentDate: string,
    paymentMethod: string,
    notes?: string,
    adminUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: settlement, error: fetchError } = await supabaseAdmin
        .from('monthly_settlements')
        .select('commission_due, total_paid_amount, unpaid_amount')
        .eq('id', settlementId)
        .single();

      if (fetchError || !settlement) {
        return { success: false, error: '정산 정보를 찾을 수 없습니다.' };
      }

      const currentPaid = settlement.total_paid_amount || 0;
      const newTotalPaid = currentPaid + paidAmount;

      if (newTotalPaid > settlement.commission_due) {
        return {
          success: false,
          error: `입금액이 수수료를 초과합니다. (수수료: ${settlement.commission_due}원, 현재 입금 합계: ${currentPaid}원)`
        };
      }

      const { error: insertError } = await supabaseAdmin
        .from('settlement_payments')
        .insert({
          settlement_id: settlementId,
          paid_amount: paidAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          notes: notes,
          created_by: adminUserId
        });

      if (insertError) {
        console.error('입금 내역 저장 실패:', insertError);
        return { success: false, error: '입금 내역 저장에 실패했습니다.' };
      }

      const newUnpaidAmount = settlement.commission_due - newTotalPaid;
      const newPaymentStatus = newUnpaidAmount === 0 ? 'confirmed' : 'pending';

      const { error: updateError } = await supabaseAdmin
        .from('monthly_settlements')
        .update({
          total_paid_amount: newTotalPaid,
          unpaid_amount: newUnpaidAmount,
          payment_status: newPaymentStatus
        })
        .eq('id', settlementId);

      if (updateError) {
        console.error('정산 상태 업데이트 실패:', updateError);
        return { success: false, error: '정산 상태 업데이트에 실패했습니다.' };
      }

      return { success: true };
    } catch (error) {
      console.error('입금 처리 중 오류:', error);
      return { success: false, error: '시스템 오류가 발생했습니다.' };
    }
  }

  static async deletePayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: payment, error: fetchError } = await supabaseAdmin
        .from('settlement_payments')
        .select('settlement_id, paid_amount')
        .eq('id', paymentId)
        .single();

      if (fetchError || !payment) {
        return { success: false, error: '입금 내역을 찾을 수 없습니다.' };
      }

      const { error: deleteError } = await supabaseAdmin
        .from('settlement_payments')
        .delete()
        .eq('id', paymentId);

      if (deleteError) {
        console.error('입금 내역 삭제 실패:', deleteError);
        return { success: false, error: '입금 내역 삭제에 실패했습니다.' };
      }

      const { data: settlement, error: settlementError } = await supabaseAdmin
        .from('monthly_settlements')
        .select('commission_due, total_paid_amount')
        .eq('id', payment.settlement_id)
        .single();

      if (settlementError || !settlement) {
        return { success: true };
      }

      const newTotalPaid = Math.max(0, (settlement.total_paid_amount || 0) - payment.paid_amount);
      const newUnpaidAmount = settlement.commission_due - newTotalPaid;

      await supabaseAdmin
        .from('monthly_settlements')
        .update({
          total_paid_amount: newTotalPaid,
          unpaid_amount: newUnpaidAmount,
          payment_status: newUnpaidAmount === 0 ? 'confirmed' : 'pending'
        })
        .eq('id', payment.settlement_id);

      return { success: true };
    } catch (error) {
      console.error('입금 내역 삭제 중 오류:', error);
      return { success: false, error: '시스템 오류가 발생했습니다.' };
    }
  }

  static async suspendAccount(settlementId: string, suspend: boolean, adminNotes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        is_account_suspended: suspend,
        is_blocked: suspend
      };

      if (suspend) {
        updateData.suspension_date = new Date().toISOString();
      } else {
        updateData.suspension_date = null;
      }

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      console.log('계정 정지 상태 변경 시도:', { settlementId, suspend, updateData });

      const { data, error } = await supabaseAdmin
        .from('monthly_settlements')
        .update(updateData)
        .eq('id', settlementId)
        .select();

      if (error) {
        console.error('계정 정지 상태 변경 실패:', error);
        return { success: false, error: `계정 정지 상태 변경에 실패했습니다: ${error.message}` };
      }

      console.log('계정 정지 상태 변경 성공:', data);
      return { success: true };
    } catch (error: any) {
      console.error('계정 정지 처리 중 오류:', error);
      return { success: false, error: `시스템 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}` };
    }
  }

  static async updateAdminNotes(settlementId: string, notes: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('monthly_settlements')
        .update({ admin_notes: notes })
        .eq('id', settlementId);

      if (error) {
        console.error('관리자 메모 업데이트 실패:', error);
        return { success: false, error: '메모 업데이트에 실패했습니다.' };
      }

      return { success: true };
    } catch (error) {
      console.error('관리자 메모 업데이트 중 오류:', error);
      return { success: false, error: '시스템 오류가 발생했습니다.' };
    }
  }

  static async getSettlementStats(year: number, month: number) {
    try {
      const settlements = await this.getAllSettlementsByMonth(year, month);

      const totalSellers = settlements.length;
      const totalCommission = settlements.reduce((sum, s) => sum + s.commission_due, 0);
      const totalPaid = settlements.reduce((sum, s) => sum + (s.total_paid_amount || 0), 0);
      const totalUnpaid = settlements.reduce((sum, s) => sum + (s.unpaid_amount || 0), 0);
      const suspendedCount = settlements.filter(s => s.is_account_suspended).length;
      const completedCount = settlements.filter(s => s.unpaid_amount === 0).length;
      const completionRate = totalSellers > 0 ? (completedCount / totalSellers) * 100 : 0;

      return {
        totalSellers,
        totalCommission,
        totalPaid,
        totalUnpaid,
        suspendedCount,
        completedCount,
        completionRate
      };
    } catch (error) {
      console.error('정산 통계 조회 중 오류:', error);
      return {
        totalSellers: 0,
        totalCommission: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        suspendedCount: 0,
        completedCount: 0,
        completionRate: 0
      };
    }
  }
}
