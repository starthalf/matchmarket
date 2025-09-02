import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { SupabaseConnectionTest } from '../utils/supabaseConnectionTest';

interface ConnectionTestResult {
  isConfigured: boolean;
  clientConnection: boolean;
  adminConnection: boolean;
  tablesExist: boolean;
  canRead: boolean;
  canWrite: boolean;
  errors: string[];
}

interface DatabaseStats {
  totalMatches: number;
  dummyMatches: number;
  waitingApplicants: number;
  appSettings: number;
}

export default function SupabaseTestScreen() {
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runConnectionTest();
  }, []);

  const runConnectionTest = async () => {
    setIsLoading(true);
    try {
      const result = await SupabaseConnectionTest.runFullConnectionTest();
      setTestResult(result);

      if (result.isConfigured) {
        const stats = await SupabaseConnectionTest.getDatabaseStats();
        setDbStats(stats);
      }
    } catch (error) {
      Alert.alert('테스트 오류', '연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle size={20} color="#16a34a" />
    ) : (
      <XCircle size={20} color="#dc2626" />
    );
  };

  const getStatusColor = (status: boolean) => {
    return status ? '#16a34a' : '#dc2626';
  };

  const envVars = SupabaseConnectionTest.checkEnvironmentVariables();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supabase 연결 테스트</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={runConnectionTest}
          disabled={isLoading}
        >
          <RefreshCw size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.loadingText}>연결 테스트 중...</Text>
          </View>
        )}

        {/* 환경변수 상태 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 환경변수 설정</Text>
          
          <View style={styles.testItem}>
            <View style={styles.testInfo}>
              <Text style={styles.testLabel}>SUPABASE_URL</Text>
              <Text style={styles.testDetail}>
                {envVars.hasUrl ? `설정됨 (${envVars.urlPreview})` : '설정되지 않음'}
              </Text>
            </View>
            {getStatusIcon(envVars.hasUrl)}
          </View>

          <View style={styles.testItem}>
            <View style={styles.testInfo}>
              <Text style={styles.testLabel}>SUPABASE_ANON_KEY</Text>
              <Text style={styles.testDetail}>
                {envVars.hasAnonKey ? '설정됨' : '설정되지 않음'}
              </Text>
            </View>
            {getStatusIcon(envVars.hasAnonKey)}
          </View>

          <View style={styles.testItem}>
            <View style={styles.testInfo}>
              <Text style={styles.testLabel}>SUPABASE_SERVICE_ROLE_KEY</Text>
              <Text style={styles.testDetail}>
                {envVars.hasServiceKey ? '설정됨' : '설정되지 않음'}
              </Text>
            </View>
            {getStatusIcon(envVars.hasServiceKey)}
          </View>
        </View>

        {/* 연결 테스트 결과 */}
        {testResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔗 연결 테스트 결과</Text>
            
            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>환경변수 설정</Text>
                <Text style={styles.testDetail}>
                  {testResult.isConfigured ? '완료' : '미완료'}
                </Text>
              </View>
              {getStatusIcon(testResult.isConfigured)}
            </View>

            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>클라이언트 연결</Text>
                <Text style={styles.testDetail}>
                  {testResult.clientConnection ? '성공' : '실패'}
                </Text>
              </View>
              {getStatusIcon(testResult.clientConnection)}
            </View>

            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>관리자 연결</Text>
                <Text style={styles.testDetail}>
                  {testResult.adminConnection ? '성공' : '실패'}
                </Text>
              </View>
              {getStatusIcon(testResult.adminConnection)}
            </View>

            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>테이블 존재</Text>
                <Text style={styles.testDetail}>
                  {testResult.tablesExist ? '확인됨' : '확인 안됨'}
                </Text>
              </View>
              {getStatusIcon(testResult.tablesExist)}
            </View>

            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>읽기 권한</Text>
                <Text style={styles.testDetail}>
                  {testResult.canRead ? '정상' : '오류'}
                </Text>
              </View>
              {getStatusIcon(testResult.canRead)}
            </View>

            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>쓰기 권한</Text>
                <Text style={styles.testDetail}>
                  {testResult.canWrite ? '정상' : '오류'}
                </Text>
              </View>
              {getStatusIcon(testResult.canWrite)}
            </View>
          </View>
        )}

        {/* 데이터베이스 통계 */}
        {dbStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 데이터베이스 통계</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{dbStats.totalMatches}</Text>
                <Text style={styles.statLabel}>총 매치</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{dbStats.dummyMatches}</Text>
                <Text style={styles.statLabel}>더미 매치</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{dbStats.waitingApplicants}</Text>
                <Text style={styles.statLabel}>대기자</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{dbStats.appSettings}</Text>
                <Text style={styles.statLabel}>앱 설정</Text>
              </View>
            </View>
          </View>
        )}

        {/* 오류 목록 */}
        {testResult && testResult.errors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ 발견된 문제</Text>
            
            {testResult.errors.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <AlertTriangle size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 연결 안내 */}
        {testResult && !testResult.isConfigured && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Supabase 연결 방법</Text>
            
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>1. Supabase 프로젝트 생성</Text>
              <Text style={styles.instructionText}>
                • supabase.com에서 새 프로젝트 생성{'\n'}
                • 프로젝트 설정에서 API 키 확인
              </Text>
            </View>

            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>2. 환경변수 설정</Text>
              <Text style={styles.instructionText}>
                • 우측 상단 "Connect to Supabase" 버튼 클릭{'\n'}
                • Supabase URL과 API 키 입력{'\n'}
                • 자동으로 .env 파일이 생성됩니다
              </Text>
            </View>

            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>3. 데이터베이스 마이그레이션</Text>
              <Text style={styles.instructionText}>
                • 환경변수 설정 후 자동으로 테이블이 생성됩니다{'\n'}
                • migrations 폴더의 SQL 파일들이 실행됩니다
              </Text>
            </View>
          </View>
        )}

        {/* 성공 메시지 */}
        {testResult && testResult.isConfigured && testResult.clientConnection && testResult.canRead && (
          <View style={styles.successSection}>
            <CheckCircle size={48} color="#16a34a" />
            <Text style={styles.successTitle}>✅ Supabase 연결 성공!</Text>
            <Text style={styles.successText}>
              모든 연결이 정상적으로 작동하고 있습니다.{'\n'}
              앱의 모든 기능을 사용할 수 있습니다.
            </Text>
          </View>
        )}

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
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  loadingSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
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
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  testInfo: {
    flex: 1,
  },
  testLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  testDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
  instructionCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  successSection: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#15803d',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});