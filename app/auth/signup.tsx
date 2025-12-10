import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeStyles } from '../../constants/Styles';

export default function SignupScreen() {
  const { signup } = useAuth();
  const safeStyles = useSafeStyles();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '남성' as '남성' | '여성',
    ageGroup: '20대' as '20대' | '30대' | '40대' | '50대+',
    ntrp: '',
    experience: '',
    playStyle: '올라운드' as '공격형' | '수비형' | '올라운드',
    careerType: '동호인' as '동호인' | '선수',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    age: false,
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 약관 내용
  const termsContent = `매치마켓 서비스 이용약관

제1조 (목적)
본 약관은 매치마켓(이하 "회사")이 제공하는 테니스 매치 중개 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 테니스 매치 생성, 참여, 결제 등의 모든 서비스를 의미합니다.
2. "회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.
3. "판매자"란 테니스 매치를 생성하여 판매하는 회원을 말합니다.
4. "구매자"란 테니스 매치에 참여 신청을 하는 회원을 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 회원가입 시 동의함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경 시 최소 7일 전 공지합니다.

제4조 (서비스의 제공)
1. 회사는 다음과 같은 서비스를 제공합니다:
   - 테니스 매치 생성 및 관리
   - 매치 참여 신청 및 승인
   - 결제 및 정산 서비스
   - 채팅 서비스
   - 회원 평가 시스템

제5조 (회원의 의무)
1. 회원은 다음 행위를 하여서는 안 됩니다:
   - 허위 정보 등록
   - 타인의 정보 도용
   - 불법적인 목적의 서비스 이용
   - 매치 약속 불이행

제6조 (환불 정책)
1. 매치 시작 24시간 전까지 취소 시 전액 환불
2. 24시간 이내 취소 시 환불 불가
3. 판매자의 귀책사유로 매치 취소 시 전액 환불

제7조 (면책조항)
1. 회사는 천재지변 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.
2. 회사는 회원 간의 거래에서 발생한 분쟁에 대해 책임지지 않습니다.

본 약관은 2024년 1월 1일부터 시행됩니다.`;

  const privacyContent = `매치마켓 개인정보 처리방침

1. 수집하는 개인정보 항목
회사는 회원가입, 서비스 제공을 위해 다음의 개인정보를 수집합니다:
- 필수항목: 이메일, 닉네임, 비밀번호, 성별, 나이대
- 선택항목: NTRP 등급, 테니스 경력, 플레이 스타일

2. 개인정보의 수집 및 이용목적
- 회원 식별 및 본인 확인
- 서비스 제공 및 운영
- 매치 매칭 및 중개
- 결제 및 정산 처리
- 고객 문의 응대

3. 개인정보의 보유 및 이용기간
- 회원 탈퇴 시까지 보유
- 관계 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관

4. 개인정보의 제3자 제공
회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다.
단, 다음의 경우 예외로 합니다:
- 회원이 사전에 동의한 경우
- 법령의 규정에 따른 경우

5. 개인정보의 파기
회원 탈퇴 시 지체없이 개인정보를 파기합니다.
단, 관계 법령에 따라 보관이 필요한 경우 일정 기간 보관 후 파기합니다.

6. 이용자의 권리
회원은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며,
회원 탈퇴를 통해 개인정보의 삭제를 요청할 수 있습니다.

7. 개인정보 보호책임자
- 성명: 매치마켓 개인정보보호팀
- 이메일: privacy@matchmarket.com

본 방침은 2024년 1월 1일부터 시행됩니다.`;

  const handleSignup = async () => {
    // 약관 동의 검사
    if (!agreements.terms || !agreements.privacy || !agreements.age) {
      if (Platform.OS === 'web') {
        window.alert('필수 약관에 모두 동의해주세요.');
      } else {
        Alert.alert('약관 동의 필요', '필수 약관에 모두 동의해주세요.');
      }
      return;
    }

    // 유효성 검사
    if (!formData.name || !formData.email || !formData.password) {
      if (Platform.OS === 'web') {
        window.alert('필수 항목을 모두 입력해주세요.');
      } else {
        Alert.alert('입력 오류', '필수 항목을 모두 입력해주세요.');
      }
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      if (Platform.OS === 'web') {
        window.alert('비밀번호가 일치하지 않습니다.');
      } else {
        Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      }
      return;
    }

    if (formData.password.length < 4) {
      if (Platform.OS === 'web') {
        window.alert('비밀번호는 4자 이상이어야 합니다.');
      } else {
        Alert.alert('입력 오류', '비밀번호는 4자 이상이어야 합니다.');
      }
      return;
    }

    if (!formData.ntrp || isNaN(Number(formData.ntrp))) {
      if (Platform.OS === 'web') {
        window.alert('NTRP 등급을 올바르게 입력해주세요.');
      } else {
        Alert.alert('입력 오류', 'NTRP 등급을 올바르게 입력해주세요.');
      }
      return;
    }

    if (!formData.experience || isNaN(Number(formData.experience))) {
      if (Platform.OS === 'web') {
        window.alert('테니스 경력을 올바르게 입력해주세요.');
      } else {
        Alert.alert('입력 오류', '테니스 경력을 올바르게 입력해주세요.');
      }
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signup({
        ...formData,
        ntrp: Number(formData.ntrp),
        experience: Number(formData.experience),
      });
      
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || '회원가입에 실패했습니다.');
        } else {
          Alert.alert('회원가입 실패', result.error || '회원가입에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('회원가입 예외:', error);
      if (Platform.OS === 'web') {
        window.alert('회원가입 중 예상치 못한 오류가 발생했습니다.');
      } else {
        Alert.alert('오류', '회원가입 중 예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <TouchableOpacity 
            style={safeStyles.backButton} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={safeStyles.headerTitle}>회원가입</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* 기본 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>닉네임 *</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color="#6b7280" />
                  <TextInput
                    style={styles.textInput}
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholder="닉네임을 입력하세요"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이메일 *</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#6b7280" />
                  <TextInput
                    style={styles.textInput}
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                    placeholder="이메일을 입력하세요"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호 *</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#6b7280" />
                  <TextInput
                    style={styles.textInput}
                    value={formData.password}
                    onChangeText={(text) => setFormData({...formData, password: text})}
                    placeholder="비밀번호를 입력하세요"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6b7280" />
                    ) : (
                      <Eye size={20} color="#6b7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호 확인 *</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#6b7280" />
                  <TextInput
                    style={styles.textInput}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                    placeholder="비밀번호를 다시 입력하세요"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#6b7280" />
                    ) : (
                      <Eye size={20} color="#6b7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 프로필 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>프로필 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>성별 *</Text>
                <View style={styles.radioGroup}>
                  {['남성', '여성'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.radioButton,
                        formData.gender === gender && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, gender: gender as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.gender === gender && styles.radioTextActive
                      ]}>
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>나이대 *</Text>
                <View style={styles.radioGroup}>
                  {['20대', '30대', '40대', '50대+'].map((age) => (
                    <TouchableOpacity
                      key={age}
                      style={[
                        styles.radioButton,
                        formData.ageGroup === age && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, ageGroup: age as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.ageGroup === age && styles.radioTextActive
                      ]}>
                        {age}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NTRP 등급 *</Text>
                <TextInput
                  style={styles.simpleInput}
                  value={formData.ntrp}
                  onChangeText={(text) => setFormData({...formData, ntrp: text})}
                  placeholder="예: 3.5"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>테니스 경력 (년) *</Text>
                <TextInput
                  style={styles.simpleInput}
                  value={formData.experience}
                  onChangeText={(text) => setFormData({...formData, experience: text})}
                  placeholder="예: 2"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>플레이 스타일 *</Text>
                <View style={styles.radioGroup}>
                  {['공격형', '수비형', '올라운드'].map((style) => (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.radioButton,
                        formData.playStyle === style && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, playStyle: style as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.playStyle === style && styles.radioTextActive
                      ]}>
                        {style}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>선수 출신 *</Text>
                <View style={styles.radioGroup}>
                  {['동호인', '선수'].map((career) => (
                    <TouchableOpacity
                      key={career}
                      style={[
                        styles.radioButton,
                        formData.careerType === career && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, careerType: career as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.careerType === career && styles.radioTextActive
                      ]}>
                        {career}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* 약관 동의 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>약관 동의</Text>
              
              <View style={styles.agreementContainer}>
                <TouchableOpacity 
                  style={styles.agreementRow}
                  onPress={() => setAgreements({...agreements, terms: !agreements.terms})}
                >
                  <View style={[styles.checkbox, agreements.terms && styles.checkboxActive]}>
                    {agreements.terms && <Check size={16} color="#ffffff" />}
                  </View>
                  <Text style={styles.agreementText}>
                    [필수] 서비스 이용약관 동의
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                  <Text style={styles.viewLink}>보기</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.agreementContainer}>
                <TouchableOpacity 
                  style={styles.agreementRow}
                  onPress={() => setAgreements({...agreements, privacy: !agreements.privacy})}
                >
                  <View style={[styles.checkbox, agreements.privacy && styles.checkboxActive]}>
                    {agreements.privacy && <Check size={16} color="#ffffff" />}
                  </View>
                  <Text style={styles.agreementText}>
                    [필수] 개인정보 수집 및 이용 동의
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPrivacyModal(true)}>
                  <Text style={styles.viewLink}>보기</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.agreementRow}
                onPress={() => setAgreements({...agreements, age: !agreements.age})}
              >
                <View style={[styles.checkbox, agreements.age && styles.checkboxActive]}>
                  {agreements.age && <Check size={16} color="#ffffff" />}
                </View>
                <Text style={styles.agreementText}>
                  [필수] 만 14세 이상입니다
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.allAgreeButton}
                onPress={() => {
                  const allChecked = agreements.terms && agreements.privacy && agreements.age;
                  setAgreements({
                    terms: !allChecked,
                    privacy: !allChecked,
                    age: !allChecked,
                  });
                }}
              >
                <View style={[
                  styles.checkbox, 
                  (agreements.terms && agreements.privacy && agreements.age) && styles.checkboxActive
                ]}>
                  {(agreements.terms && agreements.privacy && agreements.age) && 
                    <Check size={16} color="#ffffff" />
                  }
                </View>
                <Text style={[styles.agreementText, styles.allAgreeText]}>
                  모두 동의합니다
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? '가입 중...' : '회원가입'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 이용약관 모달 */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>서비스 이용약관</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{termsContent}</Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setAgreements({...agreements, terms: true});
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.modalButtonText}>동의하고 닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 개인정보 처리방침 모달 */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>개인정보 처리방침</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>{privacyContent}</Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setAgreements({...agreements, privacy: true});
                setShowPrivacyModal(false);
              }}
            >
              <Text style={styles.modalButtonText}>동의하고 닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  form: {
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
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
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  simpleInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  eyeButton: {
    padding: 4,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  radioButtonActive: {
    backgroundColor: '#ea4c89',
    borderColor: '#ea4c89',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  radioTextActive: {
    color: '#ffffff',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  signupButton: {
    backgroundColor: '#ea4c89',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 40,
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#ea4c89',
    borderColor: '#ea4c89',
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  viewLink: {
    fontSize: 14,
    color: '#ea4c89',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 8,
  },
  allAgreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  allAgreeText: {
    fontWeight: '700',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  modalButton: {
    backgroundColor: '#ea4c89',
    paddingVertical: 16,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});