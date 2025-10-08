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
import { ArrowLeft, Clock, Check, Award, Video, Image } from 'lucide-react-native';
import { useSafeStyles } from '../constants/Styles';

export default function CertificationScreen() {
  const { user, updateUser } = useAuth();
  const safeStyles = useSafeStyles();
  const [showNtrpModal, setShowNtrpModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  
  const [ntrpForm, setNtrpForm] = useState({
    requestedNtrp: '',
    description: '',
  });
  
  const [careerForm, setCareerForm] = useState({
    description: '',
  });

  const [youtubeForm, setYoutubeForm] = useState({
    description: '',
  });

  const [instagramForm, setInstagramForm] = useState({
    description: '',
  });

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <Text>로그인이 필요합니다.</Text>
      </SafeAreaView>
    );
  }

  const handleNtrpSubmit = () => {
    if (!ntrpForm.requestedNtrp || !ntrpForm.description) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }

    const ntrp = parseFloat(ntrpForm.requestedNtrp);
    if (isNaN(ntrp) || ntrp < 1.0 || ntrp > 7.0) {
      Alert.alert('입력 오류', 'NTRP는 1.0~7.0 사이의 값이어야 합니다.');
      return;
    }

    Alert.alert(
      'NTRP 인증 신청',
      `NTRP ${ntrp} 인증을 신청하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '신청', onPress: () => {
          const updatedUser = {
            ...user,
            certification: {
              ...user.certification,
              ntrp: 'pending' as const
            }
          };
          updateUser(updatedUser);
          setShowNtrpModal(false);
          setNtrpForm({ requestedNtrp: '', description: '' });
          Alert.alert('신청 완료', 'NTRP 인증 신청이 완료되었습니다. 검토 후 결과를 알려드리겠습니다.');
        }}
      ]
    );
  };

  const handleCareerSubmit = () => {
    if (!careerForm.description) {
      Alert.alert('입력 오류', '경력 설명을 입력해주세요.');
      return;
    }

    Alert.alert(
      '선수 경력 인증 신청',
      '선수 경력 인증을 신청하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '신청', onPress: () => {
          const updatedUser = {
            ...user,
            certification: {
              ...user.certification,
              career: 'pending' as const
            }
          };
          updateUser(updatedUser);
          setShowCareerModal(false);
          setCareerForm({ description: '' });
          Alert.alert('신청 완료', '선수 경력 인증 신청이 완료되었습니다. 검토 후 결과를 알려드리겠습니다.');
        }}
      ]
    );
  };

  const handleYoutubeSubmit = () => {
    if (!youtubeForm.description) {
      Alert.alert('입력 오류', '유튜브 채널 설명을 입력해주세요.');
      return;
    }

    Alert.alert(
      '유튜버 인증 신청',
      '유튜버 인증을 신청하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '신청', onPress: () => {
          const updatedUser = {
            ...user,
            certification: {
              ...user.certification,
              youtube: 'pending' as const
            }
          };
          updateUser(updatedUser);
          setShowYoutubeModal(false);
          setYoutubeForm({ description: '' });
          Alert.alert('신청 완료', '유튜버 인증 신청이 완료되었습니다. 검토 후 결과를 알려드리겠습니다.');
        }}
      ]
    );
  };

  const handleInstagramSubmit = () => {
    if (!instagramForm.description) {
      Alert.alert('입력 오류', '인스타그램 계정 설명을 입력해주세요.');
      return;
    }

    Alert.alert(
      '인플루언서 인증 신청',
      '인플루언서 인증을 신청하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '신청', onPress: () => {
          const updatedUser = {
            ...user,
            certification: {
              ...user.certification,
              instagram: 'pending' as const
            }
          };
          updateUser(updatedUser);
          setShowInstagramModal(false);
          setInstagramForm({ description: '' });
          Alert.alert('신청 완료', '인플루언서 인증 신청이 완료되었습니다. 검토 후 결과를 알려드리겠습니다.');
        }}
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
        {/* 인증 안내 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🏆 인증 혜택</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              • 인증 배지로 신뢰도 향상
            </Text>
            <Text style={styles.infoText}>
              • 매치 등록 시 우선 노출
            </Text>
            <Text style={styles.infoText}>
              • 프리미엄 기능 이용 가능
            </Text>
          </View>
        </View>

        {/* NTRP 인증 */}
        <View style={styles.certificationCard}>
          <View style={styles.certificationHeader}>
            <View style={styles.certificationInfo}>
              <Award size={24} color="#ec4899" />
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
          
          {user.certification.ntrp === 'none' && (
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowNtrpModal(true)}
            >
              <Text style={styles.applyButtonText}>인증 신청</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 선수 경력 인증 */}
        <View style={styles.certificationCard}>
          <View style={styles.certificationHeader}>
            <View style={styles.certificationInfo}>
              <Award size={24} color="#059669" />
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
          
          {user.certification.career === 'none' && (
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowCareerModal(true)}
            >
              <Text style={styles.applyButtonText}>인증 신청</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 유튜버 인증 */}
        <View style={styles.certificationCard}>
          <View style={styles.certificationHeader}>
            <View style={styles.certificationInfo}>
<Video size={24} color="#dc2626" />
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
          
          {user.certification.youtube === 'none' && (
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowYoutubeModal(true)}
            >
              <Text style={styles.applyButtonText}>인증 신청</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 인플루언서 인증 */}
        <View style={styles.certificationCard}>
          <View style={styles.certificationHeader}>
            <View style={styles.certificationInfo}>
<Image size={24} color="#e1306c" />
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
          
          {user.certification.instagram === 'none' && (
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowInstagramModal(true)}
            >
              <Text style={styles.applyButtonText}>인증 신청</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* NTRP 인증 모달 */}
      <Modal
        visible={showNtrpModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNtrpModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>NTRP 인증 신청</Text>
            <TouchableOpacity onPress={handleNtrpSubmit}>
              <Text style={styles.modalSubmitText}>신청</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>신청 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>신청할 NTRP 레벨 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={ntrpForm.requestedNtrp}
                  onChangeText={(text) => setNtrpForm({...ntrpForm, requestedNtrp: text})}
                  placeholder="예) 4.5"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>인증 근거 설명 *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={ntrpForm.description}
                  onChangeText={(text) => setNtrpForm({...ntrpForm, description: text})}
                  placeholder="대회 성적, 레슨 경력, 기타 NTRP 레벨을 증명할 수 있는 내용을 상세히 작성해주세요."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={5}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 선수 경력 인증 모달 */}
      <Modal
        visible={showCareerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCareerModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>선수 경력 인증 신청</Text>
            <TouchableOpacity onPress={handleCareerSubmit}>
              <Text style={styles.modalSubmitText}>신청</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>경력 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>선수 경력 설명 *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={careerForm.description}
                  onChangeText={(text) => setCareerForm({...careerForm, description: text})}
                  placeholder="소속팀, 활동 기간, 주요 성과 등을 상세히 작성해주세요."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={5}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 유튜버 인증 모달 */}
      <Modal
        visible={showYoutubeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowYoutubeModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>유튜버 인증 신청</Text>
            <TouchableOpacity onPress={handleYoutubeSubmit}>
              <Text style={styles.modalSubmitText}>신청</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>채널 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>유튜브 채널 설명 *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={youtubeForm.description}
                  onChangeText={(text) => setYoutubeForm({...youtubeForm, description: text})}
                  placeholder="채널명, 구독자 수, 테니스 관련 콘텐츠 내용 등을 상세히 작성해주세요."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={5}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 인플루언서 인증 모달 */}
      <Modal
        visible={showInstagramModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowInstagramModal(false)}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>인플루언서 인증 신청</Text>
            <TouchableOpacity onPress={handleInstagramSubmit}>
              <Text style={styles.modalSubmitText}>신청</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>계정 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>인스타그램 계정 설명 *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={instagramForm.description}
                  onChangeText={(text) => setInstagramForm({...instagramForm, description: text})}
                  placeholder="계정명, 팔로워 수, 테니스 관련 콘텐츠 내용 등을 상세히 작성해주세요."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={5}
                />
              </View>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
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
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
    marginBottom: 16,
  },
  certificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  applyButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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