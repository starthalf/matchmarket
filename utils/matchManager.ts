import { Match } from '../types/tennis';

export class MatchManager {
  /**
   * 매치 자동 취소 체크 (매치 시작 1시간 전)
   */
  static checkAutoCancel(match: Match): { shouldCancel: boolean; reason?: string } {
    const now = new Date();
    const matchTime = new Date(`${match.date}T${match.time}`);
    const hoursUntilMatch = (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // 매치 시작 1시간 전에 인원 미달 시 자동 취소
    if (hoursUntilMatch <= 1 && match.currentApplicants.total < match.expectedParticipants.total) {
      return {
        shouldCancel: true,
        reason: `인원 미달로 자동 취소 (${match.currentApplicants.total}/${match.expectedParticipants.total}명)`
      };
    }
    
    return { shouldCancel: false };
  }

  /**
   * 매치 자동 취소 처리
   */
  static async processCancellation(match: Match): Promise<void> {
    console.log(`🚫 매치 자동 취소: ${match.title}`);
    
    // 1. 참가자들에게 환불 처리
    await this.processRefunds(match);
    
    // 2. 대기자들에게 취소 알림
    await this.notifyWaitingList(match);
    
    // 3. 판매자에게 취소 알림
    await this.notifySeller(match);
    
    // 4. 매치 상태 업데이트
    // match.status = 'cancelled';
  }

  /**
   * 참가자 환불 처리
   */
  private static async processRefunds(match: Match): Promise<void> {
    console.log(`💰 환불 처리 시작: ${match.title}`);
    
    // 실제로는 결제 시스템과 연동하여 환불 처리
    // 여기서는 시뮬레이션
    const refundAmount = match.currentPrice * match.currentApplicants.total;
    
    console.log(`환불 대상자: ${match.currentApplicants.total}명`);
    console.log(`총 환불 금액: ${refundAmount.toLocaleString()}원`);
    
    // 각 참가자에게 환불 알림 발송
    for (let i = 0; i < match.currentApplicants.total; i++) {
      await this.sendRefundNotification(`participant_${i}`, match.currentPrice);
    }
  }

  /**
   * 환불 알림 발송
   */
  private static async sendRefundNotification(userId: string, amount: number): Promise<void> {
    const notification = {
      title: '💰 매치 취소 환불',
      body: `인원 미달로 매치가 취소되어 ${amount.toLocaleString()}원이 환불됩니다.`,
      data: {
        type: 'refund',
        amount: amount
      }
    };
    
    console.log(`📱 환불 알림 발송 to ${userId}:`, notification);
  }

  /**
   * 대기자 알림
   */
  private static async notifyWaitingList(match: Match): Promise<void> {
    for (const waiter of match.waitingList) {
      const notification = {
        title: '📅 매치 취소 안내',
        body: `"${match.title}" 매치가 인원 미달로 취소되었습니다.`,
        data: {
          type: 'match_cancelled',
          matchId: match.id
        }
      };
      
      console.log(`📱 취소 알림 발송 to ${waiter.userName}:`, notification);
    }
  }

  /**
   * 판매자 알림
   */
  private static async notifySeller(match: Match): Promise<void> {
    const notification = {
      title: '📅 매치 자동 취소',
      body: `"${match.title}" 매치가 인원 미달로 자동 취소되었습니다.`,
      data: {
        type: 'match_auto_cancelled',
        matchId: match.id,
        reason: 'insufficient_participants'
      }
    };
    
    console.log(`📱 판매자 알림 발송:`, notification);
  }

  /**
   * 매치 확정 후 알림 (판매자용)
   */
  static async sendMatchCompletionReminder(match: Match): Promise<void> {
    const now = new Date();
    const matchTime = new Date(`${match.date}T${match.time}`);
    
    // 매치 시작 시간이 지났는지 확인
    if (now <= matchTime) {
      return;
    }
    
    const notification = {
      title: '🎾 매치 확정 요청',
      body: `"${match.title}" 매치가 진행되었나요? 확정 버튼을 눌러주세요.`,
      data: {
        type: 'match_completion_reminder',
        matchId: match.id
      }
    };
    
    console.log(`📱 매치 확정 알림 발송:`, notification);
  }

  /**
   * 정기적인 매치 상태 체크 (크론잡 시뮬레이션)
   */
  static startMatchMonitoring(matches: Match[]): void {
    const checkInterval = setInterval(() => {
      matches.forEach(async (match) => {
        // 1. 자동 취소 체크
        const cancelCheck = this.checkAutoCancel(match);
        if (cancelCheck.shouldCancel) {
          await this.processCancellation(match);
        }
        
        // 2. 매치 완료 알림 체크
        const now = new Date();
        const matchTime = new Date(`${match.date}T${match.time}`);
        const hoursAfterMatch = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);
        
        // 매치 시작 1시간 후에 확정 알림 발송
        if (hoursAfterMatch >= 1 && hoursAfterMatch <= 2) {
          await this.sendMatchCompletionReminder(match);
        }
      });
    }, 60000); // 1분마다 체크
    
    console.log('🔄 매치 모니터링 시작');
    return checkInterval;
  }
}