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
import { 
  ArrowLeft, 
  Upload, 
  Send, 
  CheckCircle, 
  Clock, 
  Copy, 
  Mail,
  Check,
  Youtube,
  Instagram,
  Award
} from 'lucide-react-native';
import { useSafeStyles } from '../../constants/Styles';

interface CertificationType {
  id: 'ntrp' | 'youtube' | 'instagram' | 'career';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
}

const certificationTypes: CertificationType[] = [
  {
    id: 'ntrp',
    title: 'NTRP 등급 인증',
    description: 'NTRP 등급을 인증하여 신뢰할 수 있는 실력을 증명해보세요',
    icon: Check,
    color: '#ec4899'
  },
  {
    id: 'youtube',
    title: '유튜버 인증',
    description: '테니스 관련 유튜브 채널 운영자 인증',
    icon: Youtube,
    color: '#dc2626'
  },
  {
    id: 'instagram',
    title: '인플루언서 인증',
    description: '테니스 관련 인스타그램 인플루언서 인증',
    icon: Instagram,
    color: '#e1306c'
  },
  {
    id: 'career',
    title: '선수 인증',
    description: '프로 선수 출신 또는 실업팀 경력 인증',
    icon: Award,
    color: '#059669'
  }
];

export default function CertificationScreen() {
  const safeStyles = useSafeStyles();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    ntrp: {
      rating: '',
      description: '',
      evidenceFiles: [] as string[]
    },
    youtube: {
      channelName: '',
      subscribers: '',
      description: '',
      evidenceFiles: [] as string[]
    },
    instagram: {
      username: '',
      followers: '',
      description: '',
      evidenceFiles: [] as string[]
    },
    career: {
      careerType: '',
      period: '',
      description: '',
      evidenceFiles: [] as string[]
    }
  });

  const toggleCertificationType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleFileUpload = (certType: string) => {
    Alert.alert(
      '파일 업로드',
      '증빙 자료를 선택해주세요',
      [
        { text: '취소', style: 'cancel' },
        { text: '사진 촬영', onPress: () => {
          setFormData(prev => ({
            ...prev,
            [certType]: {
              ...prev[certType as keyof typeof prev],
              evidenceFiles: [
                ...prev[certType as keyof typeof prev].evidenceFiles,
                `photo_${Date.now()}.jpg`
              ]
            }
          }));
        }},
        { text: '갤러리에서 선택', onPress: () => {
          setFormData(prev => ({
            ...prev,
            [certType]: {
              ...prev[certType as keyof typeof prev],
              evidenceFiles: [
                ...prev[certType as keyof typeof prev].evidenceFiles,
                `gallery_${Date.now()}.jpg`
              ]
            }
          }));
        }},
      ]
    );
  };

  const removeFile = (certType: string, fileIndex: number) => {
    setFormData(prev => ({
      ...prev,
      [certType]: {
        ...prev[certType as keyof typeof prev],
        evidenceFiles: prev[certType as keyof typeof prev].evidenceFiles.filter((_, index) => index !== fileIndex)
      }
    }));
  };

  const validateForm = () => {
    if (selectedTypes.length === 0) {
      Alert.alert('선택 오류', '인증할 항목을 하나 이상 선택해주세요.');
      return false;
    }

    for (const type of selectedTypes) {
      switch (type) {
        case 'ntrp':
          if (!formData.ntrp.rating) {
            Alert.alert('입력 오류', 'NTRP 등급을 입력해주세요.');
            return false;
          }
          const ntrpValue = parseFloat(formData.ntrp.rating);
          if (isNaN(ntrpValue) || ntrpValue < 1.0 || ntrpValue > 7.0) {
            Alert.alert('입력 오류', 'NTRP 등급은 1.0~7.0 사이의 값을 입력해주세요.');
            return false;
          }
          break;
        case 'youtube':
          if (!formData.youtube.channelName) {
            Alert.alert('입력 오류', '유튜브 채널명을 입력해주세요.');
            return false;
          }
          break;
        case 'instagram':
          if (!formData.instagram.username) {
            Alert.alert('입력 오류', '인스타그램 사용자명을 입력해주세요.');
            return false;
          }
          break;
        case 'career':
          if (!formData.career.careerType) {
            Alert.alert('입력 오류', '선수 경력 유형을 입력해주세요.');
            return false;
          }
          break;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // 이메일 내용 구성
    let emailContent = `제목: [MatchMarket] 프로필 인증 신청\n\n안녕하세요, MatchMarket 관리자님.\n\n다음 항목에 대한 인증을 신청합니다:\n\n`;

    selectedTypes.forEach(type => {
      const certType = certificationTypes.find(ct => ct.id === type);
      if (!certType) return;

      emailContent += `■ ${certType.title}\n`;
      
      switch (type) {
        case 'ntrp':
          emailContent += `- NTRP 등급: ${formData.ntrp.rating}\n`;
          if (formData.ntrp.description) {
            emailContent += `- 추가 설명: ${formData.ntrp.description}\n`;
          }
          break;
        case 'youtube':
          emailContent += `- 채널명: ${formData.youtube.channelName}\n`;
          if (formData.youtube.subscribers) {
            emailContent += `- 구독자 수: ${formData.youtube.subscribers}\n`;
          }
          if (formData.youtube.description) {
            emailContent += `- 추가 설명: ${formData.youtube.description}\n`;
          }
          break;
        case 'instagram':
          emailContent += `- 사용자명: ${formData.instagram.username}\n`;
          if (formData.instagram.followers) {
            emailContent += `- 팔로워 수: ${formData.instagram.followers}\n`;
          }
          if (formData.instagram.description) {
            emailContent += `- 추가 설명: ${formData.instagram.description}\n`;
          }
          break;
        case 'career':
          emailContent += `- 경력 유형: ${formData.career.careerType}\n`;
          if (formData.career.period) {
            emailContent += `- 활동 기간: ${formData.career.period}\n`;
          }
          if (formData.career.description) {
            emailContent += `- 추가 설명: ${formData.career.description}\n`;
          }
          break;
      }
      emailContent += '\n';
    });

    emailContent += `■ 증빙 자료\n증빙 자료는 이 이메일에 첨부하여 보내드립니다.\n\n검토 후 인증 승인 부탁드립니다.\n\n감사합니다.`;

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

  const renderCertificationForm = (type: CertificationType) => {
    if (!selectedTypes.includes(type.id)) return null;

    switch (type.id) {
      case 'ntrp':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>{type.title}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NTRP 등급 *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.ntrp.rating}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  ntrp: { ...prev.ntrp, rating: text }
                }))}
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
                value={formData.ntrp.description}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  ntrp: { ...prev.ntrp, description: text }
                }))}
                placeholder="대회 참가 경력, 코치 추천 등 인증에 도움이 될 정보를 적어주세요..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {renderFileUploadSection('ntrp')}
          </View>
        );

      case 'youtube':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>{type.title}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>채널명 *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.youtube.channelName}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  youtube: { ...prev.youtube, channelName: text }
                }))}
                placeholder="유튜브 채널명을 입력해주세요"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>구독자 수</Text>
              <TextInput
                style={styles.textInput}
                value={formData.youtube.subscribers}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  youtube: { ...prev.youtube, subscribers: text }
                }))}
                placeholder="예: 10,000명"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>추가 설명</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.youtube.description}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  youtube: { ...prev.youtube, description: text }
                }))}
                placeholder="채널 운영 기간, 주요 콘텐츠 등을 적어주세요..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {renderFileUploadSection('youtube')}
          </View>
        );

      case 'instagram':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>{type.title}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>사용자명 *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.instagram.username}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  instagram: { ...prev.instagram, username: text }
                }))}
                placeholder="@username"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>팔로워 수</Text>
              <TextInput
                style={styles.textInput}
                value={formData.instagram.followers}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  instagram: { ...prev.instagram, followers: text }
                }))}
                placeholder="예: 5,000명"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>추가 설명</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.instagram.description}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  instagram: { ...prev.instagram, description: text }
                }))}
                placeholder="계정 운영 기간, 주요 콘텐츠 등을 적어주세요..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {renderFileUploadSection('instagram')}
          </View>
        );

      case 'career':
        return (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>{type.title}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>경력 유형 *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.career.careerType}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  career: { ...prev.career, careerType: text }
                }))}
                placeholder="예: 프로선수, 실업팀, 대학팀 등"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>활동 기간</Text>
              <TextInput
                style={styles.textInput}
                value={formData.career.period}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  career: { ...prev.career, period: text }
                }))}
                placeholder="예: 2018년 - 2022년"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>추가 설명</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.career.description}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  career: { ...prev.career, description: text }
                }))}
                placeholder="주요 성적, 소속팀, 수상 경력 등을 적어주세요..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            {renderFileUploadSection('career')}
          </View>
        );

      default:
        return null;
    }
  };

  const renderFileUploadSection = (certType: string) => {
    const files = formData[certType as keyof typeof formData].evidenceFiles;

    return (
      <View style={styles.uploadSection}>
        <View style={styles.uploadHeader}>
          <Text style={styles.uploadTitle}>증빙 자료</Text>
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => handleFileUpload(certType)}
          >
            <Upload size={16} color="#ec4899" />
            <Text style={styles.uploadButtonText}>파일 추가</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.uploadHint}>
          관련 증명서, 스크린샷 등을 첨부해주세요
        </Text>

        {files.length > 0 && (
          <View style={styles.fileList}>
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName}>{file}</Text>
                <TouchableOpacity
                  onPress={() => removeFile(certType, index)}
                  style={styles.removeFileButton}
                >
                  <Text style={styles.removeFileText}>삭제</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
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
          <Text style={styles.introSubtitle}>
            원하는 인증을 선택하여 신뢰할 수 있는 프로필을 만들어보세요
          </Text>
        </View>

        {/* 인증 유형 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>인증 유형 선택</Text>
          <Text style={styles.sectionSubtitle}>여러 항목을 중복 선택할 수 있습니다</Text>
          
          {certificationTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedTypes.includes(type.id);
            
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.certTypeCard,
                  isSelected && styles.certTypeCardSelected
                ]}
                onPress={() => toggleCertificationType(type.id)}
              >
                <View style={styles.certTypeHeader}>
                  <View style={[
                    styles.certTypeIcon,
                    { backgroundColor: isSelected ? type.color : '#f3f4f6' }
                  ]}>
                    <IconComponent 
                      size={20} 
                      color={isSelected ? '#ffffff' : '#6b7280'} 
                    />
                  </View>
                  <View style={styles.certTypeInfo}>
                    <Text style={styles.certTypeTitle}>{type.title}</Text>
                    <Text style={styles.certTypeDescription}>{type.description}</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && <CheckCircle size={20} color={type.color} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 선택된 인증 유형별 폼 */}
        {certificationTypes.map(type => renderCertificationForm(type))}

        {/* 관리자 이메일 정보 */}
        <View style={styles.emailSection}>
          <View style={styles.emailHeader}>
            <Mail size={20} color="#6b7280" />
            <Text style={styles.emailTitle}>관리자 이메일</Text>
          </View>
          <TouchableOpacity 
            style={styles.emailCard}
            onPress={copyAdminEmail}
          >
            <Text style={styles.emailAddress}>admin@matchmarket.co.kr</Text>
            <Copy size={16} color="#ec4899" />
          </TouchableOpacity>
          <Text style={styles.emailHint}>
            터치하여 이메일 주소를 복사할 수 있습니다
          </Text>
        </View>

        {/* 제출 버튼 */}
        {selectedTypes.length > 0 && (
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Send size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>인증 신청하기</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  introSection: {
    padding: 20,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  certTypeCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  certTypeCardSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#fef7f7',
  },
  certTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  certTypeInfo: {
    flex: 1,
  },
  certTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  certTypeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#ec4899',
  },
  formSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  uploadSection: {
    marginTop: 8,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ec4899',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  fileList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  removeFileButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeFileText: {
    fontSize: 12,
    color: '#dc2626',
  },
  emailSection: {
    padding: 20,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  emailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  emailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emailCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  emailAddress: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  emailHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec4899',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 20,
  },
});