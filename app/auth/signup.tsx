import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowRight, User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
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

  const handleSignup = async () => {
    // 유효성 검사
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('입력 오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    const ntrp = parseFloat(formData.ntrp);
    if (isNaN(ntrp) || ntrp < 1.0 || ntrp > 7.0) {
      Alert.alert('입력 오류', 'NTRP는 1.0~7.0 사이의 값이어야 합니다.');
      return;
    }

    const experience = parseInt(formData.experience);
    if (isNaN(experience) || experience < 0) {
      Alert.alert('입력 오류', '올바른 경력을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      gender: formData.gender,
      ageGroup: formData.ageGroup,
      ntrp: ntrp,
      experience: experience,
      playStyle: formData.playStyle,
      careerType: formData.careerType,
    });
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        '회원가입 완료',
        '회원가입이 완료되었습니다!',
        [{ text: '확인', onPress: () => router.replace('/(tabs)') }]
      );
    } else {
      Alert.alert('회원가입 실패', result.error || '회원가입에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>MatchMarket에 오신 것을 환영합니다</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 기본 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기본 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름 *</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color="#6b7280" />
                  <TextInput
                    style={styles.textInput}
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholder="실명을 입력하세요"
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

            {/* 개인 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>개인 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>성별 *</Text>
                <View style={styles.radioGroup}>
                  {[
                    { key: '남성', label: '남성' },
                    { key: '여성', label: '여성' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.radioButton,
                        formData.gender === option.key && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, gender: option.key as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.gender === option.key && styles.radioTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>연령대 *</Text>
                <View style={styles.radioGroup}>
                  {[
                    { key: '20대', label: '20대' },
                    { key: '30대', label: '30대' },
                    { key: '40대', label: '40대' },
                    { key: '50대+', label: '50대+' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.radioButton,
                        formData.ageGroup === option.key && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, ageGroup: option.key as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.ageGroup === option.key && styles.radioTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* 테니스 정보 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>테니스 정보</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NTRP 레벨 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.ntrp}
                  onChangeText={(text) => setFormData({...formData, ntrp: text})}
                  placeholder="예) 4.0"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>1.0 ~ 7.0 사이의 값을 입력하세요</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>테니스 경력 *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.experience}
                  onChangeText={(text) => setFormData({...formData, experience: text})}
                  placeholder="예) 24"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>개월 단위로 입력하세요</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>플레이 스타일 *</Text>
                <View style={styles.radioGroup}>
                  {[
                    { key: '공격형', label: '공격형' },
                    { key: '수비형', label: '수비형' },
                    { key: '올라운드', label: '올라운드' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.radioButton,
                        formData.playStyle === option.key && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, playStyle: option.key as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.playStyle === option.key && styles.radioTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>경력 구분 *</Text>
                <View style={styles.radioGroup}>
                  {[
                    { key: '동호인', label: '동호인' },
                    { key: '선수', label: '선수' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.radioButton,
                        formData.careerType === option.key && styles.radioButtonActive
                      ]}
                      onPress={() => setFormData({...formData, careerType: option.key as any})}
                    >
                      <Text style={[
                        styles.radioText,
                        formData.careerType === option.key && styles.radioTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* 가입 버튼 */}
          <View style={styles.submitSection}>
            <TouchableOpacity 
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? '가입 중...' : '회원가입'}
              </Text>
              <ArrowRight size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ec4899',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
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
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
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
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  radioButtonActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  radioTextActive: {
    color: '#ffffff',
  },
  submitSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ec4899',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  signupButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomPadding: {
    height: 40,
  },
});