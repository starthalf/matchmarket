export interface PaymentRequest {
  id: string;
  matchId: string;
  userId: string;
  amount: number;
  bankAccount: string;
  accountHolder: string;
  depositorName?: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'expired' | 'cancelled';
  submittedAt?: string;
}

export class BankTransferManager {
  private static PAYMENT_TIMEOUT_MINUTES = 5; // 입금 제한시간 5분
  private static BANK_ACCOUNT = '국민은행 123-456-789012';
  private static ACCOUNT_HOLDER = 'MatchMarket';

  /**
   * 입금 요청 생성
   */
  static createPaymentRequest(match: any, userId: string): PaymentRequest {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

    return {
      id: `payment_${match.id}_${userId}_${Date.now()}`,
      matchId: match.id,
      userId: userId,
      amount: match.currentPrice,
      bankAccount: this.BANK_ACCOUNT,
      accountHolder: this.ACCOUNT_HOLDER,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'pending'
    };
  }

  /**
   * 입금 신고 처리 (사용자가 입금 후 신고)
   */
  static async submitPayment(paymentRequest: PaymentRequest, depositorName: string): Promise<{
    success: boolean;
    message: string;
  }> {
    console.log('=== BankTransferManager.submitPayment 함수 시작 ===');
    console.log('paymentRequest:', paymentRequest);
    console.log('depositorName:', depositorName);
    
    try {
      // 입금 완료 신고 처리
      paymentRequest.status = 'submitted';
      paymentRequest.depositorName = depositorName;
      paymentRequest.submittedAt = new Date().toISOString();
      
      console.log(`📝 입금 완료 신고:`, {
        account: paymentRequest.bankAccount,
        amount: paymentRequest.amount,
        depositorName: depositorName,
        submittedAt: paymentRequest.submittedAt
      });

      // 관리자에게 알림 발송
      await this.notifyAdminForPaymentConfirmation(paymentRequest);
      
      return {
        success: true,
        message: '입금 완료 신고가 접수되었습니다. 관리자 확인 후 참가가 확정됩니다.'
      };
    } catch (error) {
      console.error('입금 신고 중 오류:', error);
      return {
        success: false,
        message: '입금 신고 중 오류가 발생했습니다. 고객센터로 문의해주세요.'
      };
    }
  }


  /**
   * 은행 API 시뮬레이션
   */
  static async simulateBankAPI(paymentRequest: PaymentRequest, depositorName: string): Promise<{
    found: boolean;
    transaction?: any;
  }> {
    // 실제로는 은행 API를 통해 입금 내역 확인
    // 여기서는 시뮬레이션으로 항상 성공 반환
    return {
      found: true,
      transaction: {
        amount: paymentRequest.amount,
        depositorName: depositorName,
        timestamp: new Date().toISOString()
      }
    };
  }
  /**
   * 관리자 입금 확인 (관리자가 수동으로 확인)
   */
  static async confirmPaymentByAdmin(paymentRequest: PaymentRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (paymentRequest.status !== 'submitted') {
        return {
          success: false,
          message: '입금 신고가 되지 않은 요청입니다.'
        };
      }

      paymentRequest.status = 'confirmed';
      
      console.log(`✅ 관리자 입금 확인 완료:`, {
        paymentId: paymentRequest.id,
        amount: paymentRequest.amount,
        depositorName: paymentRequest.depositorName
      });

      // 사용자에게 확정 알림 발송
      await this.notifyUserPaymentConfirmed(paymentRequest);
      
      return {
        success: true,
        message: '입금이 확인되어 참가가 확정되었습니다.'
      };
    } catch (error) {
      console.error('관리자 입금 확인 중 오류:', error);
      return {
        success: false,
        message: '입금 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 관리자에게 입금 확인 요청 알림
   */
  private static async notifyAdminForPaymentConfirmation(paymentRequest: PaymentRequest): Promise<void> {
    const notification = {
      title: '💰 입금 확인 요청',
      body: `${paymentRequest.depositorName}님이 ${paymentRequest.amount.toLocaleString()}원 입금을 신고했습니다.`,
      data: {
        type: 'payment_confirmation_request',
        paymentRequestId: paymentRequest.id,
        amount: paymentRequest.amount,
        depositorName: paymentRequest.depositorName
      }
    };

    console.log(`📱 관리자 알림 발송:`, notification);
    
    // 실제로는 관리자 FCM 토큰으로 푸시 알림 발송
    // 이메일 알림도 함께 발송
    console.log(`📧 관리자 이메일 발송: 입금 확인 요청 - ${paymentRequest.depositorName}님`);
  }

  /**
   * 사용자에게 입금 확정 알림
   */
  private static async notifyUserPaymentConfirmed(paymentRequest: PaymentRequest): Promise<void> {
    const notification = {
      title: '🎾 매치 참가 확정!',
      body: `입금이 확인되어 매치 참가가 확정되었습니다.`,
      data: {
        type: 'payment_confirmed',
        matchId: paymentRequest.matchId,
        paymentRequestId: paymentRequest.id
      }
    };

    console.log(`📱 사용자 알림 발송 (userId: ${paymentRequest.userId}):`, notification);
  }

  /**
   * 입금 만료 처리
   */
  static handlePaymentExpiry(paymentRequest: PaymentRequest): void {
    paymentRequest.status = 'expired';
    
    console.log(`⏰ 입금 시간 만료: ${paymentRequest.id}`);
    
    // 실제로는 대기목록에서 제거, 알림 발송 등 처리
  }

  /**
   * 실시간 입금 모니터링 (웹훅 시뮬레이션)
   */
  static startPaymentMonitoring(paymentRequest: PaymentRequest, onConfirmed: (transaction: any) => void): void {
    const checkInterval = setInterval(async () => {
      if (paymentRequest.status !== 'pending') {
        clearInterval(checkInterval);
        return;
      }

      // 만료 시간 체크
      if (new Date() > new Date(paymentRequest.expiresAt)) {
        this.handlePaymentExpiry(paymentRequest);
        clearInterval(checkInterval);
        return;
      }

      // 입금 확인 (실제로는 웹훅으로 받음)
      const result = await this.simulateBankAPI(paymentRequest, paymentRequest.depositorName || '');
      
      if (result.found) {
        paymentRequest.status = 'confirmed';
        onConfirmed(result.transaction);
        clearInterval(checkInterval);
      }
    }, 10000); // 10초마다 확인
  }

  /**
   * 입금 정보 포맷팅
   */
  static formatPaymentInfo(paymentRequest: PaymentRequest): {
    account: string;
    amount: string;
    holder: string;
    timeLeft: number;
  } {
    const now = new Date();
    const expiresAt = new Date(paymentRequest.expiresAt);
    const timeLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return {
      account: paymentRequest.bankAccount,
      amount: paymentRequest.amount.toLocaleString(),
      holder: paymentRequest.accountHolder,
      timeLeft: timeLeft
    };
  }
}