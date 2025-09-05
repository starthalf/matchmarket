import { Match, WaitingApplicant, PaymentRequest } from '../types/tennis';
import { User } from '../types/tennis';
import { WaitlistService } from '../lib/waitlistService';

export class WaitlistManager {
  private static PAYMENT_TIMEOUT_MINUTES = 10; // 결제 제한시간 10분

  /**
   * 사용자를 대기자 목록에 추가
   */
  static async handleUserJoinWaitlist(
    match: Match, 
    user: User
  ): Promise<{ success: boolean; error?: string; position?: number }> {
    try {
      // 이미 대기 중인지 확인
      const existingWaiter = match.waitingList.find(w => w.userId === user.id);
      if (existingWaiter) {
        return { success: false, error: '이미 대기자 목록에 등록되어 있습니다.' };
      }

      // Supabase에 대기자 추가
      const dbResult = await WaitlistService.addWaitingApplicant(match.id, user);
      if (!dbResult.success) {
        return { success: false, error: dbResult.error };
      }

      // 새 대기자 생성
      const newWaiter: WaitingApplicant = {
        id: `waiter_${match.id}_${user.id}_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        gender: user.gender,
        ntrp: user.ntrp,
        joinedAt: new Date().toISOString(),
        status: 'waiting'
      };

      // 대기자 목록에 추가
      match.waitingList = [...match.waitingList, newWaiter];
      match.waitingApplicants += 1;
      
      console.log(`✅ 대기자 등록 완료: ${user.name}님이 ${match.title} 매치 대기자로 등록`);
      
      return { success: true, position: dbResult.position };
    } catch (error) {
      console.error('대기자 등록 중 오류:', error);
      return { success: false, error: '대기자 등록 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 대기자 제거 (취소)
   */
  static async handleWaitlistCancellation(
    match: Match,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Supabase에서 대기자 제거
      const dbResult = await WaitlistService.removeWaitingApplicant(match.id, userId);
      if (!dbResult.success) {
        return { success: false, error: dbResult.error };
      }

      // 로컬 매치 객체에서도 제거
      const waiterIndex = match.waitingList.findIndex(w => w.userId === userId);
      if (waiterIndex > -1) {
        match.waitingList.splice(waiterIndex, 1);
        match.waitingApplicants = Math.max(0, match.waitingApplicants - 1);
      }

      console.log(`✅ 대기자 취소 완료: ${userId}님이 ${match.title} 매치 대기자에서 제거`);
      
      return { success: true };
    } catch (error) {
      console.error('대기자 취소 중 오류:', error);
      return { success: false, error: '대기자 취소 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 참가자 취소 시 대기자에게 결제 요청 알림 발송
   */
  static async handleParticipantCancellation(
    match: Match, 
    cancelledGender: '남성' | '여성'
  ): Promise<{ success: boolean; notifiedUser?: WaitingApplicant; error?: string }> {
    try {
      // 1. 해당 성별의 대기자 중 가장 먼저 대기한 사람 찾기
      const eligibleWaiters = match.waitingList
        .filter(waiter => 
          waiter.gender === cancelledGender && 
          waiter.status === 'waiting'
        )
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      if (eligibleWaiters.length === 0) {
        return { success: false, error: '해당 성별의 대기자가 없습니다.' };
      }

      const nextWaiter = eligibleWaiters[0];
      
      // 2. 결제 요청 생성
      const paymentRequest = this.createPaymentRequest(match, nextWaiter);
      
      // 3. Supabase에서 대기자 상태 업데이트
      await WaitlistService.updateWaitingApplicantStatus(
        match.id,
        nextWaiter.userId,
        'payment_requested',
        {
          payment_requested_at: new Date().toISOString(),
          payment_expires_at: paymentRequest.expiresAt
        }
      );

      // 4. 로컬 대기자 상태 업데이트
      nextWaiter.status = 'payment_requested';
      nextWaiter.paymentRequestedAt = new Date().toISOString();
      nextWaiter.paymentExpiresAt = paymentRequest.expiresAt;

      // 5. 푸시 알림 발송
      await this.sendPaymentNotification(nextWaiter, match, paymentRequest);

      // 6. 결제 타이머 시작
      this.startPaymentTimer(paymentRequest, match, nextWaiter);

      console.log(`💳 결제 요청 발송: ${nextWaiter.userName}님에게 ${match.title} 매치 결제 알림`);
      
      return { success: true, notifiedUser: nextWaiter };
    } catch (error) {
      console.error('참가자 취소 처리 중 오류:', error);
      return { success: false, error: '시스템 오류가 발생했습니다.' };
    }
  }

  /**
   * 결제 요청 생성
   */
  private static createPaymentRequest(match: Match, waiter: WaitingApplicant): PaymentRequest {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000);

    return {
      id: `payment_${match.id}_${waiter.userId}_${Date.now()}`,
      matchId: match.id,
      userId: waiter.userId,
      amount: match.currentPrice,
      requestedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'pending'
    };
  }

  /**
   * 결제 알림 발송
   */
  private static async sendPaymentNotification(
    waiter: WaitingApplicant, 
    match: Match, 
    paymentRequest: PaymentRequest
  ): Promise<void> {
    // 실제 구현에서는 FCM, 이메일, SMS 등으로 알림 발송
    const notification = {
      title: '🎾 매치 참가 기회!',
      body: `${match.title} 매치에 참가할 수 있습니다. ${this.PAYMENT_TIMEOUT_MINUTES}분 내에 결제해주세요.`,
      data: {
        type: 'payment_request',
        matchId: match.id,
        paymentRequestId: paymentRequest.id,
        amount: paymentRequest.amount,
        expiresAt: paymentRequest.expiresAt
      }
    };

    // 푸시 알림 발송 시뮬레이션
    console.log(`📱 푸시 알림 발송 to ${waiter.userName}:`, notification);
    
    // 이메일 알림 발송 시뮬레이션
    console.log(`📧 이메일 발송 to ${waiter.userName}: 매치 참가 결제 요청`);
  }

  /**
   * 결제 타이머 시작
   */
  private static startPaymentTimer(
    paymentRequest: PaymentRequest, 
    match: Match, 
    waiter: WaitingApplicant
  ): void {
    const timeoutMs = this.PAYMENT_TIMEOUT_MINUTES * 60 * 1000;
    
    setTimeout(async () => {
      // 결제 상태 확인
      if (paymentRequest.status === 'pending') {
        console.log(`⏰ 결제 시간 만료: ${waiter.userName}님의 결제 요청 취소`);
        
        // 결제 요청 만료 처리
        paymentRequest.status = 'expired';
        waiter.status = 'cancelled';
        
        // 대기 목록에서 제거
        const waiterIndex = match.waitingList.findIndex(w => w.id === waiter.id);
        if (waiterIndex > -1) {
          match.waitingList.splice(waiterIndex, 1);
          match.waitingApplicants = Math.max(0, match.waitingApplicants - 1);
        }
        
        // 다음 대기자에게 알림 발송
        await this.handleParticipantCancellation(match, waiter.gender);
        
        // 만료 알림 발송
        await this.sendPaymentExpiredNotification(waiter, match);
      }
    }, timeoutMs);
  }

  /**
   * 결제 완료 처리
   */
  static async handlePaymentCompleted(
    paymentRequestId: string, 
    match: Match
  ): Promise<{ success: boolean; error?: string; updatedMatch: Match }> {
    console.log('=== WaitlistManager.handlePaymentCompleted 함수 시작 ===');
    console.log('paymentRequestId:', paymentRequestId);
    console.log('match:', match);
    
    try {
      // paymentRequestId에서 userId 추출
      // paymentRequestId 형식: payment_${match.id}_${userId}_${timestamp}
      const prefix = `payment_${match.id}_`;
      const suffixIndex = paymentRequestId.lastIndexOf('_'); // 타임스탬프 앞의 마지막 '_' 인덱스

      if (suffixIndex === -1 || !paymentRequestId.startsWith(prefix)) {
        console.error('결제 요청 ID 형식이 올바르지 않습니다:', paymentRequestId);
        return { success: false, error: '결제 요청 정보가 올바르지 않습니다.', updatedMatch: match };
      }

      const userId = paymentRequestId.substring(prefix.length, suffixIndex);
      console.log(`[WaitlistManager] Extracted userId: "${userId}"`);
      
      // mockUsers에서 사용자 정보 가져오기
      // 직접 import하여 사용자 정보 가져오기
      const mockUsers = (await import('../data/mockData')).mockUsers;
      console.log(`[WaitlistManager] mockUsers import successful, length: ${mockUsers.length}`);
      console.log(`[WaitlistManager] Available mockUsers IDs: [${mockUsers.map(u => `"${u.id}"`).join(', ')}]`);
      console.log(`[WaitlistManager] Searching for userId: "${userId}"`);
      const user = mockUsers.find(u => u.id === userId);
      console.log(`[WaitlistManager] Found user:`, user);
      
      if (!user) {
        console.log('사용자를 찾을 수 없음. userId:', userId);
        console.log('사용 가능한 사용자 ID들:', mockUsers.map(u => u.id));
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.', updatedMatch: match };
      }

      console.log(`입금 신고 처리 시작: ${user.name}님 (${user.gender})`);
      
      // Supabase에서 대기자 상태 업데이트
      await WaitlistService.updateWaitingApplicantStatus(
        match.id,
        userId,
        'payment_submitted',
        {
          payment_submitted_at: new Date().toISOString()
        }
      );

      // participants 배열에 사용자 추가 (입금 확인중 상태)
      const existingParticipant = match.participants.find(p => p.userId === userId);
      if (!existingParticipant) {
        console.log('새 참가자 추가 중...');
        match.participants = [...match.participants, {
          id: `participant_${match.id}_${userId}_${Date.now()}`,
          userId: userId,
          userName: user.name,
          gender: user.gender,
          ntrp: user.ntrp,
          joinedAt: new Date().toISOString(),
          status: 'payment_pending',
          paymentAmount: match.currentPrice,
          paymentSubmittedAt: new Date().toISOString(),
        }];
        
        // 참가자 수 증가 (입금 확인중이지만 자리는 예약됨)
        const newCurrentApplicants = { ...match.currentApplicants };
        if (user.gender === '남성') {
          newCurrentApplicants.male += 1;
        } else {
          newCurrentApplicants.female += 1;
        }
        newCurrentApplicants.total += 1;
        match.currentApplicants = newCurrentApplicants;
        
        console.log(`참가자 목록에 추가 (입금확인중): ${user.name}님`);
        console.log('현재 참가자 수:', match.currentApplicants);
      } else {
        console.log('이미 참가자 목록에 있음:', existingParticipant);
      }
      
      // 대기자 목록에서 해당 사용자 찾기
      const waiter = match.waitingList.find(w => w.userId === userId);
      
      // 대기자인 경우 상태를 입금확인중으로 변경
      if (waiter) {
        match.waitingList = match.waitingList.map(w => 
          w.userId === userId 
            ? { ...w, status: 'payment_submitted', paymentSubmittedAt: new Date().toISOString() }
            : w
        );
        
        console.log(`대기자 상태 변경: ${user.name}님 -> 입금확인중`);
      }
      
      console.log(`✅ 입금 신고 완료: ${user.name}님이 ${match.title} 매치 입금 신고`);
      
      return { success: true, updatedMatch: match };
    } catch (error) {
      console.error('입금 신고 처리 중 오류:', error);
      return { success: false, error: '입금 신고 처리 중 오류가 발생했습니다.', updatedMatch: match };
    }
  }

  /**
   * 관리자 입금 확정 처리
   */
  static async handleAdminPaymentConfirmation(
    paymentRequestId: string, 
    match: Match
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // paymentRequestId에서 userId 추출
      // paymentRequestId 형식: payment_${match.id}_${userId}_${timestamp}
      const prefix = `payment_${match.id}_`;
      const suffixIndex = paymentRequestId.lastIndexOf('_');

      if (suffixIndex === -1 || !paymentRequestId.startsWith(prefix)) {
        return { success: false, error: '결제 요청 정보가 올바르지 않습니다.' };
      }
      
      const userId = paymentRequestId.substring(prefix.length, suffixIndex);
      
      const mockUsers = (await import('../data/mockData')).mockUsers;
      const user = mockUsers.find(u => u.id === userId);
      
      if (!user) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
      }

      console.log(`관리자 입금 확정 처리 시작: ${user.name}님 (${user.gender})`);
      
      // Supabase에서 대기자 제거 (확정되면 대기자가 아님)
      await WaitlistService.removeWaitingApplicant(match.id, userId);

      // participants 배열에서 사용자 상태를 confirmed로 업데이트
      match.participants = match.participants.map(p => {
        if (p.userId === userId) {
          return { ...p, status: 'confirmed', paymentConfirmedAt: new Date().toISOString() };
        }
        return p;
      });
      console.log(`참가자 상태 업데이트: ${user.name}님 -> 참가확정`);
      
      // 대기자 목록에서 해당 사용자 찾기
      const waiter = match.waitingList.find(w => w.userId === userId);
      
      // 대기자인 경우 대기 목록에서 제거
      if (waiter) {
        match.waitingList = match.waitingList.filter(w => w.userId !== userId);
        match.waitingApplicants = Math.max(0, match.waitingApplicants - 1);
        console.log(`대기자 목록에서 제거: ${user.name}님`);
      }
      
      // 참가자 수는 이미 payment_pending 상태에서 증가했으므로 여기서는 업데이트하지 않음
      console.log(`참가자 상태만 업데이트 완료: 남성 ${match.currentApplicants.male}명, 여성 ${match.currentApplicants.female}명, 총 ${match.currentApplicants.total}명`);

      console.log(`✅ 관리자 입금 확정 완료: ${user.name}님이 ${match.title} 매치에 참가`);
      
      return { success: true };
    } catch (error) {
      console.error('관리자 입금 확정 처리 중 오류:', error);
      return { success: false, error: '입금 확정 처리 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 입금 신고 취소 처리
   */
  static async handlePaymentCancellation(
    paymentRequestId: string, 
    match: Match
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // paymentRequestId에서 userId 추출
      // paymentRequestId 형식: payment_${match.id}_${userId}_${timestamp}
      const prefix = `payment_${match.id}_`;
      const suffixIndex = paymentRequestId.lastIndexOf('_');

      if (suffixIndex === -1 || !paymentRequestId.startsWith(prefix)) {
        return { success: false, error: '결제 요청 정보가 올바르지 않습니다.' };
      }
      
      const userId = paymentRequestId.substring(prefix.length, suffixIndex);
      
      const mockUsers = (await import('../data/mockData')).mockUsers;
      const user = mockUsers.find(u => u.id === userId);
      
      if (!user) {
        return { success: false, error: '사용자 정보를 찾을 수 없습니다.' };
      }

      console.log(`입금 신고 취소 처리 시작: ${user.name}님 (${user.gender})`);
      
      // 대기자 목록에서 해당 사용자 찾기 및 제거
      const waiterIndex = match.waitingList.findIndex(w => w.userId === userId);
      if (waiterIndex > -1) {
        match.waitingList.splice(waiterIndex, 1);
        match.waitingApplicants = Math.max(0, match.waitingApplicants - 1);
        console.log(`대기자 목록에서 제거: ${user.name}님`);
      }
      
      // 사용자에게 취소 알림 발송
      await this.sendPaymentCancellationNotification(user, match);
      
      console.log(`✅ 입금 신고 취소 완료: ${user.name}님의 입금 신고가 취소됨`);
      
      return { success: true };
    } catch (error) {
      console.error('입금 신고 취소 처리 중 오류:', error);
      return { success: false, error: '입금 신고 취소 처리 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 매치 로드 시 Supabase에서 대기자 목록 동기화
   */
  static async syncWaitingListFromDB(match: Match): Promise<Match> {
    try {
      if (!supabase) {
        console.warn('⚠️ Supabase 클라이언트가 초기화되지 않았습니다. 로컬 대기자 목록을 유지합니다.');
        return {
          ...match,
          waitingApplicants: match.waitingList.length
        };
      }

      const waitingList = await WaitlistService.getWaitingList(match.id);
      const waitingCount = await WaitlistService.getWaitingCount(match.id);

      return {
        ...match,
        waitingList,
        waitingApplicants: waitingCount
      };
    } catch (error) {
      console.error('대기자 목록 동기화 중 오류:', error);
      // 오류 발생 시 기존 목록 유지
      return {
        ...match,
        waitingApplicants: match.waitingList.length
      };
    }
  }

  /**
   * 입금 신고 취소 알림 발송
   */
  private static async sendPaymentCancellationNotification(
    user: any, 
    match: Match
  ): Promise<void> {
    const notification = {
      title: '❌ 입금 신고 취소',
      body: `${match.title} 매치의 입금 신고가 관리자에 의해 취소되었습니다.`,
      data: {
        type: 'payment_cancelled',
        matchId: match.id
      }
    };

    console.log(`📱 입금 취소 알림 발송 to ${user.name}:`, notification);
  }

  /**
   * 결제 만료 알림 발송
   */
  private static async sendPaymentExpiredNotification(
    waiter: WaitingApplicant, 
    match: Match
  ): Promise<void> {
    const notification = {
      title: '⏰ 결제 시간 만료',
      body: `${match.title} 매치 결제 시간이 만료되어 대기가 취소되었습니다.`,
      data: {
        type: 'payment_expired',
        matchId: match.id
      }
    };

    console.log(`📱 만료 알림 발송 to ${waiter.userName}:`, notification);
  }

  /**
   * 대기 목록 조회
   */
  static getWaitingList(match: Match): WaitingApplicant[] {
    return match.waitingList
      .filter(w => w.status === 'waiting')
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  }

  /**
   * 대기 순서 조회
   */
  static getWaitingPosition(match: Match, userId: string): number {
    const waitingList = this.getWaitingList(match);
    const position = waitingList.findIndex(w => w.userId === userId);
    return position >= 0 ? position + 1 : -1;
  }
}