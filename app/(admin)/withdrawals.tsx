import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { CreditCard, Calendar, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle, Building, User, Copy } from 'lucide-react-native';

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  requestedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  adminNote?: string;
  processedAt?: string;
  processedBy?: string;
}

const mockWithdrawalRequests: WithdrawalRequest[] = [
  {
    id: 'wr1',
    userId: '1',
    userName: '김테니스',
    amount: 125000,
    requestedAt: '2024-12-27T09:30:00Z',
    status: 'pending',
    bankName: '국민은행',
    accountNumber: '123-456-789012',
    accountHolder: '김테니스',
  },
  {
    id: 'wr2',
    userId: '2',
    userName: '박라켓',
    amount: 89000,
    requestedAt: '2024-12-27T14:15:00Z',
    status: 'pending',
    bankName: '신한은행',
    accountNumber: '987-654-321098',
    accountHolder: '박라켓',
  },
  {
    id: 'wr3',
    userId: '3',
    userName: '최스매시',
    amount: 67500,
    requestedAt: '2024-12-26T16:45:00Z',
    status: 'processing',
    bankName: '우리은행',
    accountNumber: '456-789-123456',
    accountHolder: '최스매시',
    adminNote: '송금 처리중',
    processedBy: 'admin1',
  },
  {
    id: 'wr4',
    userId: '4',
    userName: '이서브',
    amount: 45000,
    requestedAt: '2024-12-25T11:20:00Z',
    status: 'completed',
    bankName: '하나은행',
    accountNumber: '789-123-456789',
    accountHolder: '이서브',
    processedAt: '2024-12-25T15:30:00Z',
    processedBy: 'admin1',
    adminNote: '송금 완료',
  },
];

export default function AdminWithdrawalsScreen() {
  const [requests, setRequests] = useState(mockWithdrawalRequests);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');

  const filteredRequests = requests.filter(req => 
    filterStatus === 'all' || req.status === filterStatus
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const processingCount = requests.filter(r => r.status === 'processing').length;
  const totalPendingAmount = requests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleProcessWithdrawal = (request: WithdrawalRequest, newStatus: 'processing' | 'completed' | 'failed') => {
    setSelectedRequest(request);
    setAdminNote('');
    setShowProcessModal(true);
  };

  const confirmProcessWithdrawal = (newStatus: 'processing' | 'completed' | 'failed') => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map(req => {
      if (req.id === selectedRequest.id) {
        return {
          ...req,
          status: newStatus,
          adminNote: adminNote || undefined,
          processedAt: newStatus !== 'processing' ? new Date().toISOString() : undefined,
          processedBy: 'admin1',
        };
      }
      return req;
    });

    setRequests(updatedRequests);
    setShowProcessModal(false);
    setSelectedRequest(null);

    const statusText = {
      processing: '처리중으로 변경',
      completed: '완료 처리',
      failed: '실패 처리'
    }[newStatus];

    Alert.alert('처리 완료', `${selectedRequest.userName}님의 출금 신청이 ${statusText}되었습니다.`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'processing': return <AlertTriangle size={16} color="#3b82f6" />;
      case 'completed': return <CheckCircle size={16} color="#16a34a" />;
      case 'failed': return <AlertTriangle size={16} color="#dc2626" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'processing': return '처리중';
      case 'completed': return '완료';
      case 'failed': return '실패';
      default: return '알 수 없음';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'completed': return '#16a34a';
      case 'failed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    // 실제로는 Clipboard.setString(text) 사용
    Alert.alert('복사 완료', `${label}이(가) 복사되었습니다.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>출금 관리</Text>
        <Text style={styles.subtitle}>사용자 출금 신청 처리</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 출금 현황 요약 */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>출금 현황</Text>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Clock size={24} color="#f59e0b" />
              <Text style={styles.summaryAmount}>{pendingCount}건</Text>
              <Text style={styles.summaryLabel}>출금대기</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <AlertTriangle size={24} color="#3b82f6" />
              <Text style={styles.summaryAmount}>{processingCount}건</Text>
              <Text style={styles.summaryLabel}>출금처리중</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <CheckCircle size={24} color="#16a34a" />
              <Text style={styles.summaryAmount}>{totalPendingAmount.toLocaleString()}원</Text>
              <Text style={styles.summaryLabel}>대기 금액</Text>
            </View>
          </View>
        </View>

        {/* 필터 */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: '전체' },
              { key: 'pending', label: '대기중' },
              { key: 'processing', label: '처리중' },
              { key: 'completed', label: '완료' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  filterStatus === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus(filter.key as any)}
              >
                <Text style={[
                  styles.filterText,
                  filterStatus === filter.key && styles.filterTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 출금 신청 목록 */}
        <View style={styles.requestsSection}>
          <Text style={styles.sectionTitle}>
            출금 신청 ({filteredRequests.length})
          </Text>
          
          {filteredRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.userInfo}>
                  <User size={20} color="#6b7280" />
                  <Text style={styles.userName}>{request.userName}</Text>
                </View>
                <View style={styles.statusRow}>
                  {getStatusIcon(request.status)}
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(request.status) }
                  ]}>
                    {getStatusText(request.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.requestDetails}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>출금 금액</Text>
                  <Text style={styles.amountValue}>
                    {request.amount.toLocaleString()}원
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Calendar size={14} color="#6b7280" />
                  <Text style={styles.detailText}>
                    신청일: {formatDate(request.requestedAt)}
                  </Text>
                </View>
                
                {request.processedAt && (
                  <View style={styles.detailRow}>
                    <CheckCircle size={14} color="#6b7280" />
                    <Text style={styles.detailText}>
                      처리일: {formatDate(request.processedAt)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.accountInfo}>
                  <View style={styles.accountRow}>
                    <Building size={14} color="#6b7280" />
                    <Text style={styles.accountText}>
                      {request.bankName} {request.accountNumber}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => copyToClipboard(request.accountNumber, '계좌번호')}
                      style={styles.copyButton}
                    >
                      <Copy size={12} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.accountHolder}>
                    예금주: {request.accountHolder}
                  </Text>
                </View>
                
                {request.adminNote && (
                  <View style={styles.adminNote}>
                    <Text style={styles.adminNoteText}>
                      관리자 메모: {request.adminNote}
                    </Text>
                  </View>
                )}
              </View>
              
              {request.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.processingButton]}
                    onPress={() => handleProcessWithdrawal(request, 'processing')}
                  >
                    <Text style={styles.processingButtonText}>처리중</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleProcessWithdrawal(request, 'completed')}
                  >
                    <Text style={styles.completeButtonText}>완료</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {request.status === 'processing' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleProcessWithdrawal(request, 'completed')}
                  >
                    <Text style={styles.completeButtonText}>완료</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.failButton]}
                    onPress={() => handleProcessWithdrawal(request, 'failed')}
                  >
                    <Text style={styles.failButtonText}>실패</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 처리 확인 모달 */}
      <Modal
        visible={showProcessModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowProcessModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>출금 처리</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>출금 정보</Text>
                  <View style={styles.modalInfoCard}>
                    <Text style={styles.modalInfoText}>
                      사용자: {selectedRequest.userName}
                    </Text>
                    <Text style={styles.modalInfoText}>
                      금액: {selectedRequest.amount.toLocaleString()}원
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>관리자 메모</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="처리 관련 메모를 입력하세요..."
                    value={adminNote}
                    onChangeText={setAdminNote}
                    multiline
                  />
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.processingModalButton]}
                    onPress={() => confirmProcessWithdrawal('processing')}
                  >
                    <Text style={styles.processingModalButtonText}>처리중으로 변경</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.completeModalButton]}
                    onPress={() => confirmProcessWithdrawal('completed')}
                  >
                    <Text style={styles.completeModalButtonText}>완료 처리</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.failModalButton]}
                    onPress={() => confirmProcessWithdrawal('failed')}
                  >
                    <Text style={styles.failModalButtonText}>실패 처리</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  summarySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  requestsSection: {
    marginHorizontal: 16,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestDetails: {
    gap: 8,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  accountInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  copyButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  accountHolder: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 22,
  },
  adminNote: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  adminNoteText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  processingButton: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  processingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  completeButton: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  failButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  failButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomPadding: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingTop: 16,
  },
  modalSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalInfoCard: {
    gap: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalActions: {
    marginHorizontal: 16,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  processingModalButton: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  processingModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  completeModalButton: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  completeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
  },
  failModalButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  failModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  paymentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ec4899',
  },
  matchTitleRow: {
    marginBottom: 8,
  },
  matchTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  depositorInfo: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  depositorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  confirmPaymentButton: {
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#ec4899',
  },
  confirmPaymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#be185d',
  },
  emptyPaymentState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyPaymentText: {
    fontSize: 14,
    color: '#6b7280',
  },
  confirmationCard: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  confirmationText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  confirmPaymentModalButton: {
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#ec4899',
  },
  confirmPaymentModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#be185d',
  },
});