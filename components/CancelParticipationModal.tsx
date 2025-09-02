import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { X, Building, CreditCard, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface CancelParticipationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (refundAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }) => void;
  matchTitle: string;
  refundAmount: number;
}

export function CancelParticipationModal({
  visible,
  onClose,
  onConfirm,
  matchTitle,
  refundAmount,
}: CancelParticipationModalProps) {
  const [accountInfo, setAccountInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  const handleSubmit = () => {
    if (!accountInfo.bankName || !accountInfo.accountNumber || !accountInfo.accountHolder) {
      Alert.alert('입력 오류', '모든 계좌 정보를 입력해주세요.');
      return;
    }

    Alert.alert(
      '참가 취소 확인',
      `정말로 매치 참가를 취소하시겠습니까?\n\n매치: ${matchTitle}\n환불 금액: ${refundAmount.toLocaleString()}원\n환불 계좌: ${accountInfo.bankName} ${accountInfo.accountNumber}`,
      [
        { text: '취소', style: 'cancel' },
        { text: '참가 취소', style: 'destructive', onPress: () => {
          onConfirm(accountInfo);
          setAccountInfo({ bankName: '', accountNumber: '', accountHolder: '' });
        }}
      ]
    );
  };

  const handleClose = () => {
    setAccountInfo({ bankName: '', accountNumber: '', accountHolder: '' });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>참가 취소</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.submitText}>확인</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.warningSection}>
            <AlertTriangle size={24} color="#f59e0b" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>참가 취소 안내</Text>
              <Text style={styles.warningText}>
                매치 참가를 취소하시면 환불 처리됩니다.{'\n'}
                환불은 영업일 기준 3-5일 소요됩니다.
              </Text>
            </View>
          </View>

          <View style={styles.matchInfoSection}>
            <Text style={styles.sectionTitle}>매치 정보</Text>
            <View style={styles.matchInfoCard}>
              <Text style={styles.matchTitle}>{matchTitle}</Text>
              <Text style={styles.refundAmount}>
                환불 금액: {refundAmount.toLocaleString()}원
              </Text>
            </View>
          </View>

          <View style={styles.accountSection}>
            <Text style={styles.sectionTitle}>환불 계좌 정보</Text>
            <Text style={styles.sectionDescription}>
              환불받을 계좌 정보를 정확히 입력해주세요.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>은행명 *</Text>
              <TextInput
                style={styles.textInput}
                value={accountInfo.bankName}
                onChangeText={(text) => setAccountInfo({...accountInfo, bankName: text})}
                placeholder="예) 국민은행"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>계좌번호 *</Text>
              <TextInput
                style={styles.textInput}
                value={accountInfo.accountNumber}
                onChangeText={(text) => setAccountInfo({...accountInfo, accountNumber: text})}
                placeholder="예) 123-456-789012"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>예금주 *</Text>
              <TextInput
                style={styles.textInput}
                value={accountInfo.accountHolder}
                onChangeText={(text) => setAccountInfo({...accountInfo, accountHolder: text})}
                placeholder="예) 홍길동"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.noticeSection}>
            <Text style={styles.noticeTitle}>📋 환불 처리 안내</Text>
            <Text style={styles.noticeText}>
              • 환불은 영업일 기준 3-5일 내에 처리됩니다{'\n'}
              • 계좌 정보가 정확하지 않으면 환불이 지연될 수 있습니다{'\n'}
              • 매치 시작 24시간 전부터는 취소 수수료가 발생할 수 있습니다{'\n'}
              • 환불 관련 문의는 고객센터로 연락해주세요
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  warningSection: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  matchInfoSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  matchInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  accountSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  noticeSection: {
    backgroundColor: '#f0f9ff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});