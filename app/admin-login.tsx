import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Shield, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAdmin } from '../contexts/AdminContext';

export default function AdminLoginScreen() {
  const { adminLogin } = useAdmin();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    const result = await adminLogin(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      router.replace('/(admin)/dashboard');
    } else {
      Alert.alert('로그인 실패', result.error || '관리자 로그인에 실패했습니다.');
    }
  };

  const handleDemoLogin = () => {
    Alert.alert(
      '데모 관리자 로그인',
      '데모 버전에서는 인증 없이 바로 접근 가능합니다.\n실제 운영 시에는 Supabase Auth와 연동된 보안 로그인이 필요합니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '데모 접근', onPress: () => {
          router.push('/(admin)/dashboard');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoSection}>
            <Shield size={64} color="#dc2626" />
            <Text style={styles.title}>관리자 로그인</Text>
            <Text style={styles.subtitle}>MatchMarket 관리자 시스템</Text>
          </View>

          <View style={styles.loginSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>관리자 이메일</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#6b7280" />
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder="admin@matchmarket.co.kr"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>비밀번호</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" />
                <TextInput
                  style={styles.textInput}
                  value={formData.password}
                  onChangeText={(text) => setFormData({...formData, password: text})}
                  placeholder="관리자 비밀번호"
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

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleAdminLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? '로그인 중...' : '관리자 로그인'}
              </Text>
              <ArrowRight size={20} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.demoButton}
              onPress={handleDemoLogin}
            >
              <Text style={styles.demoButtonText}>데모 관리자 접근</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.securityNotice}>
            <Text style={styles.securityTitle}>🔒 보안 안내</Text>
            <Text style={styles.securityText}>
              • 관리자 계정은 2단계 인증이 필요합니다{'\n'}
              • 모든 관리자 활동은 로그로 기록됩니다{'\n'}
              • 비인가 접근 시도는 자동으로 차단됩니다{'\n'}
              • 데모 버전에서는 실제 데이터가 변경되지 않습니다
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  loginSection: {
    width: '100%',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 16,
  },
  demoButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  securityNotice: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    width: '100%',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
});