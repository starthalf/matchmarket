import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Upload, Send, CircleCheck as CheckCircle, Clock, Copy, Mail } from 'lucide-react-native';
import { useSafeStyles } from '../constants/Styles';

export default function CertificationScreen() {
  const safeStyles = useSafeStyles();
  const [selectedType, setSelectedType] = useState('ntrp');
  const [formData, setFormData] = useState({
    requestedNtrp: '',
    description: '',
    evidenceFiles: [] as string[],
  });

  const handleFileUpload = () => {
    Alert.alert(
      '파일 업로드',
      '증빙 자료를 선택해주세요',
      [
        { text: '취소', style: 'cancel' },
        { text: '사진 촬영', onPress: () => {
          setFormData({
            ...formData,
            evidenceFiles: [...formData.evidenceFiles, 'photo_' + Date.now() + '.jpg']
          });
        }},
        { text: '갤러리에서 선택', onPress: () => {
          setFormData({
            ...formData,
            evidenceFiles: [...formData.evidenceFiles, 'gallery_' + Date.now() + '.jpg']
          });
        }},
      ]
    );
  };

  const handleSubmit = () => {
    if (!formData.requestedNtrp) {
      Alert.alert('입력 오류', 'NTRP 등급을 입력해주세요.');
      return;
    }

    // 이메일 내용 구성
    const emailContent = `
제목: [MatchMarket] NTRP 인증 신청

안녕하세요, MatchMarket 관리자님.

NTRP 등급 인증을 신청합니다.

■ 신청자 정보
- 사용자명: ${formData.requestedNtrp ? '사용자명' : '미입력'}
- 신청 NTRP 등급: ${formData.requestedNtrp}

■ 추가 설명
${formData.description || '없음'}

■ 증빙 자료
증빙 자료는 이 이메일에 첨부하여 보내드립니다.
- 대회 성적
- 선수증명
- 코치 추천서
- 유튜브 채널 스크린샷
- 인스타 프로필 스크린샷
- 기타

검토 후 인증 승인 부탁드립니다.

감사합니다.
    `.trim();

    // 이메일 내용을 클립보드에 복사
    Clipboard.setString(emailContent);
    
    Alert.alert(
      '이메일 내용 복사 완료',
      `이메일 내용이 클립보드에 복사되었습니다.\n\n📧 관리자 이메일: admin@matchmarket.co.kr\n\n이메일 앱을 열어서 위 주소로 증빙 자료와 함께 이메일을 보내주세요.\n\n심사 결과는 3-5일 내에 알림으로 전달됩니다.`,
      [
        { 
          text: '확인', 
          onPress: () => router.back() 
        }
      ]
    );
  };

  const copyAdminEmail = () => {
    Clipboard.setString('admin@matchmarket.co.kr');
    Alert.alert('복사 완료', '관리자 이메일 주소가 클립보드에 복사되었습니다.');
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
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>프로필 인증 신청</Text>
        </View>

        {/* NTRP 등급 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NTRP 등급 인증</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>신청 NTRP 등급 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.requestedNtrp}
              onChangeText={(text) => setFormData({...formData, requestedNtrp: text})}
              placeholder="예: 4.5"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
            <Text style={styles.inputHint}>
              현재 자신의 정확한 NTRP 등급을 입력해주세요 (1.0-7.0)
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>추가 설명</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="인증에 도움이 될 추가 정보가 있다면 적어주세요..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* 증빙 자료 업로드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>증빙 자료 업로드 *</Text>
          
          <View style={styles.emailSection}>
            <Text style={styles.emailSectionTitle}>관리자 이메일로 직접 발송</Text>
            
            <View style={styles.adminEmailCard}>
              <View style={styles.emailRow}>
                <Mail size={18} color="#3b82f6" />
                <Text style={styles.adminEmail}>admin@matchmarket.co.kr</Text>
                <TouchableOpacity 
                  style={styles.copyEmailButton}
                  onPress={copyAdminEmail}
                >
                  <Copy size={16} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </View>
            
          </View>

          <View style={styles.uploadHint}>
            <Text style={styles.uploadHintTitle}>
              인증 증빙 자료
            </Text>
            <Text style={styles.uploadHintText}>
              • 대회 성적{'\n'}• 선수증명{'\n'}• 코치 추천서{'\n'}• 유튜브 채널 스크린샷{'\n'}• 인스타 프로필 스크린샷{'\n'}• 기타
            </Text>
          </View>
        </View>

        {/* 처리 과정 안내 */}
        <View style={styles.processSection}>
          <Text style={styles.processSectionTitle}>인증 처리 과정</Text>
          
          <View style={styles.processStep}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepText}>신청 접수 및 이메일 발송</Text>
          </View>
          
          <View style={styles.processStep}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepText}>관리자 검토 (3-5일 소요)</Text>
          </View>
          
          <View style={styles.processStep}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepText}>결과 알림 및 배지 부여</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Send size={18} color="#ffffff" />
          <Text style={styles.submitButtonText}>인증 신청하기</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  introSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  typeCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  typeCardSelected: {
    borderColor: '#d1d5db',
    backgroundColor: '#fdf2f8',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  typeTitleSelected: {
    color: '#ec4899',
  },
  typeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
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
    height: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fdf2f8',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ec4899',
  },
  fileList: {
    marginBottom: 16,
  },
  fileListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  fileName: {
    fontSize: 14,
    color: '#374151',
  },
  removeFile: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  uploadHint: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  uploadHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  uploadHintText: {
    fontSize: 12,
    color: '#3730a3',
    lineHeight: 18,
  },
  emailSection: {
    marginBottom: 16,
  },
  emailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  adminEmailCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminEmail: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  copyEmailButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  emailInstructions: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  processSection: {
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
  processSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 40,
  },
});