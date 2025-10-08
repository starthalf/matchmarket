import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Send, Check, Clock, Youtube, Instagram, Award } from 'lucide-react-native';
import { useSafeStyles } from '../constants/Styles';

export default function CertificationScreen() {
  const { user } = useAuth();
  const safeStyles = useSafeStyles();
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCertType, setSelectedCertType] = useState('');
  const [formData, setFormData] = useState({
    ntrpLevel: '',
    playerCareer: '',
    youtubeUrl: '',
    instagramUrl: '',
    additionalInfo: ''
  });

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <Text>로그인이 필요합니다.</Text>
      </SafeAreaView>
    );
  }

  const handleSubmitCertification = () => {
    if (!selectedCertType) {
      Alert.alert('알림', '인증 타입을 선택해주세요.');
      return;
    }

    // 입력값 검증
    if (selectedCertType === 'NTRP' && !formData.ntrpLevel.trim()) {
      Alert.alert('알림', 'NTRP 레벨을 입력해주세요.');
      return;
    }
    if (selectedCertType === '선수' && !formData.playerCareer.trim()) {
      Alert.alert('알림', '선수 경력을 입력해주세요.');
      return;
    }
    if (selectedCertType === '유튜버' && !formData.youtubeUrl.trim()) {
      Alert.alert('알림', '유튜브 채널 URL을 입력해주세요.');
      return;
    }
    if (selectedCertType === '인플루언서' && !formData.instagramUrl.trim()) {
      Alert.alert('알림', '인스타그램 URL을 입력해주세요.');
      return;
    }

    // 메일 본문 생성
    let emailBody = `
=== 인증 신청 ===

사용자: ${user?.name || '이름 없음'} (${user?.email || '이메일 없음'})
인증 타입: ${selectedCertType}

`;

    if (selectedCertType === 'NTRP') {
      emailBody += `NTRP 레벨: ${formData.ntrpLevel}\n`;
    } else if (selectedCertType === '선수') {
      emailBody += `선수 경력:\n${formData.playerCareer}\n`;
    } else if (selectedCertType === '유튜버') {
      emailBody += `유튜브 채널: ${formData.youtubeUrl}\n`;
    } else if (selectedCertType === '인플루언서') {
      emailBody += `인스타그램: ${formData.instagramUrl}\n`;
    }

    if (formData.additionalInfo.trim()) {
      emailBody += `\n추가 정보:\n${formData.additionalInfo}\n`;
    }

    // TODO: 실제 이메일 전송 로직 구현
    console.log('Email to send:', emailBody);

    Alert.alert(
      '신청 완료',
      '인증 신청이 접수되었습니다.\n관리자 검토 후 승인 여부를 알려드립니다.',
      [
        {
          text: '확인',
          onPress: () => {
            setShowCertModal(false);
            setSelectedCertType('');
            setFormData({
              ntrpLevel: '',
              playerCareer: '',
              youtubeUrl: '',
              instagramUrl: '',
              additionalInfo: ''
            });
          }
        }
      ]
    );
  };

  const getCertificationStatus = (status: 'none' | 'pending' | 'verified') => {
    switch (status) {
      case 'verified':
        return { text: '인증완료', color: '#16a34a', icon: <Check size={16} color="#16a34a" /> };
      case 'pending':
        return { text: '검토중', color: '#f59e0b', icon: <Clock size={16} color="#f59e0b" /> };
      default:
        return { text: '미인증', color: '#6b7280', icon: null };
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <TouchableOpacity 
            style={safeStyles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={safeStyles.headerTitle}>인증 신청</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 인증 혜택 */}
        <View style={styles.infoSection}>
          <View style={styles.benefitHeader}>
            <Award size={24} color="#FFD700" />
            <Text style={styles.infoTitle}>인증 혜택</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>• 인증 배지로 신뢰도 향상</Text>
            <Text style={styles.infoText}>• 매치 등록 시 우선 노출</Text>
            <Text style={styles.infoText}>• 프리미엄 기능 이용 가능</Text>
          </View>
        </View>

        {/* NTRP 인증 */}
        <View style={styles.certificationCard}>
          <View style={styles.certificationHeader}>
            <View style={styles.certificationInfo}>
              <View style={styles.certIcon}>
                <Text style={styles.certIconText}>🎾</Text>
              </View>
              <View style={styles.certificationDetails}>
                <Text style={styles.certificationTitle}>NTRP 인증</Text>
                <Text style={styles.certificationDescription}>
                  공식 NTRP 레벨 인증
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              {getCertificationStatus(user.certification.ntrp).icon}
              <Text style={[
                styles.statusText,
                { color: getCertificationStatus(user.certification.ntrp).color }
              ]}>
                {getCertificationStatus(user.certification.ntrp).text}
              </Text>
            </View>
          </View>
        </View>

        {/* 선수 경력 인증 */}
        <View style={styles.certificationCard}>
          <View style={styles.certificationHeader}>
            <View style={styles.certificationInfo}>
              <View style={styles.certIcon}>
                <Text style={styles.certIconText}>🏆</Text>
              </View>
              <View style={styles.certificationDetails}>
                <Text style={styles.certificationTitle}>선수 경력 인증</Text>
                <Text style={styles.certificationDescription}>
                  프로/실업팀 선수 경력 인증
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              {getCertificationStatus(user.certification.career).icon}
              <Text style={[
                styles.statusText,
                { color: getCertificationStatus(user.certification.career).color }
              ]}>
                {getCertificationStatus(user.certification.career).text}
              </Text>
            </View>
          </View>
        </View>

        {/* 유튜버 인증 */}
        <View style={styles.certificationCard}>
          <View style={styles.certificationHeader}>
            <View style={styles.certificationInfo}>
              <View style={styles.certIcon}>
                <Youtube size={20} color="#FF0000" />
              </View>
              <View style={styles.certificationDetails}>
                <Text style={styles.certificationTitle}>유튜버 인증</Text>
                <Text style={styles.certificationDescription}>
                  테니스 관련 유튜브 채널 운영자 인증
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              {getCertificationStatus(user.certification.youtube).icon}
              <Text style={[
                styles.statusText,
                { color: getCertificationStatus(user.certification.youtube).color }
              ]}>
                {getCertificationStatus(user.certification.youtube).text}
              </Text>
            </View>
          </View>
        </View>

        {/* 인플루언서 인증 */}
        <View style={styles.certificationCard}>
          <View style={styles.certificationHeader}>
            <View style={styles.certificationInfo}>
              <View style={styles.certIcon}>
                <Instagram size={20} color="#E4405F" />
              </View>
              <View style={styles.certificationDetails}>
                <Text style={styles.certificationTitle}>인플루언서 인증</Text>
                <Text style={styles.certificationDescription}>
                  테니스 관련 인스타그램 인플루언서 인증
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              {getCertificationStatus(user.certification.instagram).icon}
              <Text style={[
                styles.statusText,
                { color: getCertificationStatus(user.certification.instagram).color }
              ]}>
                {getCertificationStatus(user.certification.instagram).text}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => setShowCertModal(true)}
        >
          <Text style={styles.applyButtonText}>인증 신청하기</Text>
        </TouchableOpacity>
      </View>

      {/* 통합 인증 신청 모달 */}
      <Modal
        visible={showCertModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCertModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>인증 신청</Text>
            <TouchableOpacity onPress={handleSubmitCertification}>
              <Text style={styles.modalSubmitText}>신청</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              {/* 인증 타입 선택 */}
              <Text style={styles.inputLabel}>인증 타입 *</Text>
              <View style={styles.certTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.certTypeButton,
                    selectedCertType === 'NTRP' && styles.certTypeButtonActive
                  ]}
                  onPress={() => setSelectedCertType('NTRP')}
                >
                  <Text style={[
                    styles.certTypeButtonText,
                    selectedCertType === 'NTRP' && styles.certTypeButtonTextActive
                  ]}>🎾 NTRP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.certTypeButton,
                    selectedCertType === '선수' && styles.certTypeButtonActive
                  ]}
                  onPress={() => setSelectedCertType('선수')}
                >
                  <Text style={[
                    styles.certTypeButtonText,
                    selectedCertType === '선수' && styles.certTypeButtonTextActive
                  ]}>🏆 선수</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.certTypeButton,
                    selectedCertType === '유튜버' && styles.certTypeButtonActive
                  ]}
                  onPress={() => setSelectedCertType('유튜버')}
                >
                  <Text style={[
                    styles.certTypeButtonText,
                    selectedCertType === '유튜버' && styles.certTypeButtonTextActive
                  ]}>📹 유튜버</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.certTypeButton,
                    selectedCertType === '인플루언서' && styles.certTypeButtonActive
                  ]}
                  onPress={() => setSelectedCertType('인플루언서')}
                >
                  <Text style={[
                    styles.certTypeButtonText,
                    selectedCertType === '인플루언서' && styles.certTypeButtonTextActive
                  ]}>📸 인플루언서</Text>
                </TouchableOpacity>
              </View>

              {/* NTRP 인증 입력 */}
              {selectedCertType === 'NTRP' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NTRP 레벨 *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="예: 4.0"
                    placeholderTextColor="#9ca3af"
                    value={formData.ntrpLevel}
                    onChangeText={(text) => setFormData({...formData, ntrpLevel: text})}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* 선수 경력 인증 입력 */}
              {selectedCertType === '선수' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>선수 경력 *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="예: 2018-2020 OO실업팀 소속&#10;2021 전국대회 우승"
                    placeholderTextColor="#9ca3af"
                    value={formData.playerCareer}
                    onChangeText={(text) => setFormData({...formData, playerCareer: text})}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {/* 유튜버 인증 입력 */}
              {selectedCertType === '유튜버' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>유튜브 채널 URL *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://youtube.com/@channel"
                    placeholderTextColor="#9ca3af"
                    value={formData.youtubeUrl}
                    onChangeText={(text) => setFormData({...formData, youtubeUrl: text})}
                  />
                </View>
              )}

              {/* 인플루언서 인증 입력 */}
              {selectedCertType === '인플루언서' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>인스타그램 URL *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://instagram.com/username"
                    placeholderTextColor="#9ca3af"
                    value={formData.instagramUrl}
                    onChangeText={(text) => setFormData({...formData, instagramUrl: text})}
                  />
                </View>
              )}

              {/* 추가 정보 (공통) */}
              {selectedCertType && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>추가 정보</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="인증에 도움이 될 추가 정보를 입력해주세요"
                    placeholderTextColor="#9ca3af"
                    value={formData.additionalInfo}
                    onChangeText={(text) => setFormData({...formData, additionalInfo: text})}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 16,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  infoContent: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  certificationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  certificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  certIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certIconText: {
    fontSize: 20,
  },
  certificationDetails: {
    flex: 1,
  },
  certificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  certificationDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ec4899',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  certTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  certTypeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  certTypeButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  certTypeButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  certTypeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
});