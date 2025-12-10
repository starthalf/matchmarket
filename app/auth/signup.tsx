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
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
});