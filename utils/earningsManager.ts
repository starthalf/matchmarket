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
      
      // 2. 실제 결제 금액 계산 (각 참여자의 appliedPrice 합계)
      const matchTotalPaid = approvedApplications.reduce(
        (sum, app) => sum + (app.appliedPrice || match.basePrice),
        0
      );
      
      // 3. 수익 계산
      const matchBaseCost = matchBasePrice; // 기본비용은 전액
      const additionalAmount = Math.max(0, matchTotalPaid - matchBasePrice);
      const matchAdditionalRevenue = additionalAmount * 0.85; // 15% 수수료
      
      // 4. 광고 수익 (mock - 실제로는 광고 시스템에서 가져와야 함)
      const adViews = match.expectedViews || Math.floor(Math.random() * 2000) + 500;
      const adClicks = Math.floor(adViews * (Math.random() * 0.1 + 0.05));
      const adRevenue = adClicks * (Math.random() * 200 + 100);
      const adShare = match.adEnabled ? adRevenue * 0.5 : 0;
      
      // 5. 총 수익
      const totalRevenue = matchBaseCost + matchAdditionalRevenue + adShare;
      
      console.log('수익 계산 완료:', {
        participantCount,
        matchBasePrice,
        matchTotalPaid,
        matchBaseCost,
        matchAdditionalRevenue,
        adShare,
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
          match_base_cost: matchBaseCost,
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
      
      console.log('✅ 수익 데이터가 Supabase에 저장됨:', data.id);
      return true;
      
    } catch (error) {
      console.error('수익 데이터 생성 중 오류:', error);
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