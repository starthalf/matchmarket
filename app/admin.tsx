import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Shield, ArrowRight } from 'lucide-react-native';
import { useAdmin } from '../contexts/AdminContext';

export default function AdminLoginScreen() {
  const { isAdmin } = useAdmin();

  // 이미 관리자로 로그인된 경우 대시보드로 리다이렉트
  React.useEffect(() => {
    if (isAdmin) {
      router.replace('/(admin)/dashboard');
    }
  }, [isAdmin]);

  const handleAdminLogin = () => {
    router.push('/admin-login');
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Shield size={64} color="#dc2626" />
          <Text style={styles.title}>관리자 로그인</Text>
          <Text style={styles.subtitle}>MatchMarket 관리자 시스템</Text>
        </View>

        <View style={styles.loginSection}>
          <TouchableOpacity style={styles.loginButton} onPress={handleAdminLogin}>
            <Text style={styles.loginButtonText}>관리자 로그인</Text>
            <ArrowRight size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <Text style={styles.notice}>
            * 실제 관리자 인증이 필요합니다
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    alignItems: 'center',
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
    width: '100%',
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  notice: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});