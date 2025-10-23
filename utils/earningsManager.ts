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
  created_at: string;
}

export class EarningsManager {
  /**
   * 매치 완료 시 수익 데이터 생성 및 저장
   */
  static async createEarningFromMatch(match: Match): Promise<boolean> {
    try {
      console.log('=== 수익 데이터 생성 시작 ===');
      console.log('매치 ID:', match.id);
      
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
   * 월별 정산 데이터 업데이트
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
      
      // 기존 정산 데이터 조회
      const { data: existing } = await supabaseAdmin
        .from('monthly_settlements')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('year', year)
        .eq('month', month)
        .single();
      
      if (existing) {
        // 업데이트
        await supabaseAdmin
          .from('monthly_settlements')
          .update({
            match_count: existing.match_count + 1,
            total_revenue: existing.total_revenue + revenue.totalRevenue,
            additional_revenue: existing.additional_revenue + revenue.additionalRevenue,
            commission_due: existing.commission_due + revenue.commissionDue,
          })
          .eq('id', existing.id);
      } else {
        // 새로 생성
        await supabaseAdmin
          .from('monthly_settlements')
          .insert({
            seller_id: sellerId,
            year,
            month,
            match_count: 1,
            total_revenue: revenue.totalRevenue,
            additional_revenue: revenue.additionalRevenue,
            commission_due: revenue.commissionDue,
            payment_status: 'pending',
            is_blocked: false,
          });
      }
    } catch (error) {
      console.error('월별 정산 업데이트 오류:', error);
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
      return unpaid.some(settlement => settlement.is_blocked);
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
      
      if (error) {
        console.error('매치 수익 조회 오류:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('매치 수익 조회 중 오류:', error);
      return null;
    }
  }
}