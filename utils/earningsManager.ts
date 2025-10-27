// utils/earningsManager.ts
import { supabaseAdmin } from '../lib/supabase';
import { Match } from '../types/tennis';

export interface EarningsData {
  id: string;
  match_id: string;
  seller_id: string;
  match_title: string;
  match_date: string;
  match_base_price: number;
  match_total_paid: number;
  match_base_cost: number;
  match_additional_revenue: number;
  ad_views: number;
  ad_clicks: number;
  ad_revenue: number;
  ad_share: number;
  total_revenue: number;
  created_at: string;
}

export interface MonthlySettlement {
  id: string;
  seller_id: string;
  year: number;
  month: number;
  match_count: number;
  total_revenue: number;
  additional_revenue: number;
  commission_due: number;
  payment_status: 'pending' | 'paid' | 'confirmed';
  payment_date?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  is_blocked: boolean;
  is_account_suspended: boolean;
  created_at: string;
}

export class EarningsManager {
  /**
   * 매치 완료 시 수익 데이터 생성 및 저장
   * 🔥 중복 방지: 기존 데이터가 있으면 삭제 후 재생성
   */
  static async createEarningFromMatch(match: Match): Promise<boolean> {
    try {
      console.log('=== 수익 데이터 생성 시작 ===');
      console.log('매치 ID:', match.id);
      
      // 🔥 0. 기존 수익 데이터 확인 및 삭제
      const existingEarning = await this.getEarningByMatchId(match.id);
      if (existingEarning) {
        console.log('⚠️ 기존 수익 데이터 발견, 삭제 후 재생성합니다.');
        await this.deleteEarningById(existingEarning.id);
      }
      
      // 1. 기본 데이터 계산
      const approvedApplications = (match.applications || []).filter(
        app => app.status === 'approved' || app.status === 'confirmed'
      );
      
      const participantCount = approvedApplications.length;
      const matchBasePrice = match.basePrice * participantCount;
      
      // 2. 실제 결제 금액 계산
      const matchTotalPaid = approvedApplications.reduce(
        (sum, app) => sum + (app.appliedPrice || match.basePrice),
        0
      );
      
      // 3. 추가 수익 계산 (기본가격 초과분 전체 100%)
      const additionalAmount = Math.max(0, matchTotalPaid - matchBasePrice);
      const commissionRate = 0.15;
      const matchAdditionalRevenue = additionalAmount; // 추가 수익 전체 (100%)
      const commissionDue = additionalAmount * commissionRate; // 플랫폼 수수료 15%
      
      // 4. 광고 수익
      const adViews = match.expectedViews || Math.floor(Math.random() * 2000) + 500;
      const adClicks = Math.floor(adViews * (Math.random() * 0.1 + 0.05));
      const adRevenue = adClicks * (Math.random() * 200 + 100);
      const adShare = match.adEnabled ? adRevenue * 0.5 : 0;
      
      // 5. 총 수익 (판매자 관점: 실제 받은 전체 금액 + 광고수익)
      const totalRevenue = matchTotalPaid + adShare;
      
      console.log('수익 계산 완료:', {
        participantCount,
        matchBasePrice,
        matchTotalPaid,
        additionalAmount,
        matchAdditionalRevenue,
        commissionDue,
        totalRevenue
      });
      
      // 6. Supabase에 저장
      const { data, error } = await supabaseAdmin
        .from('earnings')
        .insert({
          match_id: match.id,
          seller_id: match.sellerId,
          match_title: match.title,
          match_date: match.date,
          match_base_price: matchBasePrice,
          match_total_paid: matchTotalPaid,
          match_base_cost: matchBasePrice,
          match_additional_revenue: matchAdditionalRevenue,
          ad_views: adViews,
          ad_clicks: adClicks,
          ad_revenue: adRevenue,
          ad_share: adShare,
          total_revenue: totalRevenue,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Supabase earnings 저장 오류:', error);
        return false;
      }
      
      // 7. 월별 정산 데이터 업데이트
      await this.updateMonthlySettlement(match.sellerId, match.date, {
        totalRevenue: matchTotalPaid,
        additionalRevenue: additionalAmount,
        commissionDue: commissionDue
      });
      
      console.log('✅ 수익 데이터가 Supabase에 저장됨:', data.id);
      return true;
      
    } catch (error) {
      console.error('수익 데이터 생성 중 오류:', error);
      return false;
    }
  }
  
  /**
   * 🔥 수익 데이터 삭제
   */
  static async deleteEarningById(earningId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('earnings')
        .delete()
        .eq('id', earningId);
      
      if (error) {
        console.error('수익 데이터 삭제 오류:', error);
        return false;
      }
      
      console.log('✅ 기존 수익 데이터 삭제 완료:', earningId);
      return true;
    } catch (error) {
      console.error('수익 데이터 삭제 중 오류:', error);
      return false;
    }
  }
  
  /**
 * 월별 정산 데이터 업데이트 (재계산 방식)
 * 🔥 earnings 테이블에서 매번 다시 계산하여 정확성 보장
 */
static async updateMonthlySettlement(
  sellerId: string, 
  matchDate: string,
  revenue: {
    totalRevenue: number;
    additionalRevenue: number;
    commissionDue: number;
  }
): Promise<void> {
  try {
    const date = new Date(matchDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    console.log(`🔄 월별 정산 재계산 시작: ${year}년 ${month}월`);
    
    // 🔥 해당 월의 모든 earnings 데이터를 다시 집계
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    
    const { data: earningsData, error: earningsError } = await supabaseAdmin
      .from('earnings')
      .select('match_total_paid, match_base_price')
      .eq('seller_id', sellerId)
      .gte('match_date', startDate)
      .lt('match_date', endDate);
    
    if (earningsError) {
      console.error('earnings 조회 오류:', earningsError);
      return;
    }
    
    if (!earningsData || earningsData.length === 0) {
      console.log('⚠️ 해당 월에 수익 데이터가 없습니다.');
      return;
    }
    
    // 📊 재계산
    const matchCount = earningsData.length;
    let totalRevenue = 0;
    let additionalRevenue = 0;
    
    earningsData.forEach((earning) => {
      totalRevenue += earning.match_total_paid;
      const additionalAmount = Math.max(0, earning.match_total_paid - earning.match_base_price);
      additionalRevenue += additionalAmount;
    });
    
    const commissionDue = additionalRevenue * 0.15;
    
    console.log('📊 재계산 결과:', {
      matchCount,
      totalRevenue,
      additionalRevenue,
      commissionDue
    });
    
    // 기존 정산 데이터 조회
    const { data: existing } = await supabaseAdmin
      .from('monthly_settlements')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('year', year)
      .eq('month', month)
      .single();
    
    if (existing) {
      // 업데이트 (재계산된 값으로 덮어쓰기)
      const { error: updateError } = await supabaseAdmin
        .from('monthly_settlements')
        .update({
          match_count: matchCount,
          total_revenue: totalRevenue,
          additional_revenue: additionalRevenue,
          commission_due: commissionDue,
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error('월별 정산 업데이트 오류:', updateError);
      } else {
        console.log('✅ 월별 정산 재계산 완료 (업데이트)');
      }
    } else {
      // 새로 생성
      const { error: insertError } = await supabaseAdmin
        .from('monthly_settlements')
        .insert({
          seller_id: sellerId,
          year,
          month,
          match_count: matchCount,
          total_revenue: totalRevenue,
          additional_revenue: additionalRevenue,
          commission_due: commissionDue,
          payment_status: 'pending',
          is_blocked: false,
          is_account_suspended: false,
        });
      
      if (insertError) {
        console.error('월별 정산 생성 오류:', insertError);
      } else {
        console.log('✅ 월별 정산 신규 생성 완료');
      }
    }
  } catch (error) {
    console.error('월별 정산 업데이트 중 오류:', error);
  }
}
  
  /**
   * 특정 판매자의 당월 정산 데이터 조회
   */
  static async getCurrentMonthSettlement(sellerId: string): Promise<MonthlySettlement | null> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const { data, error } = await supabaseAdmin
        .from('monthly_settlements')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('year', year)
        .eq('month', month)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('당월 정산 조회 오류:', error);
        return null;
      }
      
      return data || null;
    } catch (error) {
      console.error('당월 정산 조회 중 오류:', error);
      return null;
    }
  }
  
  /**
   * 미정산 내역 조회 (pending 상태)
   */
  static async getUnpaidSettlements(sellerId: string): Promise<MonthlySettlement[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('monthly_settlements')
        .select('*')
        .eq('seller_id', sellerId)
        .neq('payment_status', 'confirmed')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) {
        console.error('미정산 내역 조회 오류:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('미정산 내역 조회 중 오류:', error);
      return [];
    }
  }
  
  /**
   * 판매자 차단 여부 확인
   */
  static async isSellerBlocked(sellerId: string): Promise<boolean> {
    try {
      const unpaid = await this.getUnpaidSettlements(sellerId);
      return unpaid.some(settlement => settlement.is_blocked || settlement.is_account_suspended);
    } catch (error) {
      console.error('판매자 차단 여부 확인 오류:', error);
      return false;
    }
  }
  
  /**
   * 특정 판매자의 수익 내역 조회
   */
  static async getEarningsBySeller(sellerId: string): Promise<EarningsData[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('earnings')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('수익 데이터 조회 오류:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('수익 데이터 조회 중 오류:', error);
      return [];
    }
  }
  
  /**
   * 특정 매치의 수익 데이터 조회
   */
  static async getEarningByMatchId(matchId: string): Promise<EarningsData | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('earnings')
        .select('*')
        .eq('match_id', matchId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('매치 수익 조회 오류:', error);
        return null;
      }
      
      return data || null;
    } catch (error) {
      console.error('매치 수익 조회 중 오류:', error);
      return null;
    }
  }
}