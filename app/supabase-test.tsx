import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Database, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, RefreshCw, Trash2, Plus } from 'lucide-react-native';
import { SupabaseConnectionTest } from '../utils/supabaseConnectionTest';
import { DataGenerator } from '../utils/dataGenerator';
import { useSafeStyles } from '../constants/Styles';

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
  const safeStyles = useSafeStyles();
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingDummy, setIsDeletingDummy] = useState(false);

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

  const handleDeleteDummyData = async () => {
    console.log('🔧 더미 데이터 삭제 버튼이 클릭되었습니다!');
    console.log('현재 상태:', { isDeletingDummy, dbStats });
    
    // React Native Web에서는 confirm을 사용
    const shouldDelete = window.confirm?.('모든 더미 매치 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.') ?? true;
    
    if (!shouldDelete) {
      console.log('❌ 사용자가 삭제를 취소했습니다.');
      return;
    }

    console.log('✅ 삭제 프로세스 시작...');
    setIsDeletingDummy(true);
    
    try {
      console.log('🔄 DataGenerator.deleteAllDummyMatches() 호출 시작...');
      const result = await DataGenerator.deleteAllDummyMatches();
      console.log('🔄 DataGenerator.deleteAllDummyMatches() 결과:', result);
      
      if (result.success) {
        console.log('✅ 삭제 성공!');
        
        // Alert 대신 confirm 사용
        const shouldRefresh = window.confirm?.(`${result.deletedCount}개의 더미 매치가 삭제되었습니다.\n\n화면을 새로고침하시겠습니까?`) ?? true;
        
        if (shouldRefresh) {
          console.log('🔄 테스트 새로고침 시작...');
          runConnectionTest();
        }
      } else {
        console.log('❌ 삭제 실패:', result.error);
        window.alert?.(`삭제 실패: ${result.error || '더미 데이터 삭제에 실패했습니다.'}`);
      }
    } catch (error) {
      console.log('💥 삭제 중 예외 발생:', error);
      window.alert?.('더미 데이터 삭제 중 오류가 발생했습니다.');
    } finally {
      console.log('🔄 삭제 프로세스 종료. isDeletingDummy를 false로 설정...');
      setIsDeletingDummy(false);
    }
  };

  const handleDeleteDummyDataDirect = async () => {
    console.log('🔧 직접 삭제 시작...');
    setIsDeletingDummy(true);
    
    try {
      const result = await DataGenerator.deleteAllDummyMatches();
      console.log('삭제 결과:', result);
      
      if (result.success) {
        console.log(`✅ ${result.deletedCount}개 더미 매치 삭제 완료`);
        runConnectionTest(); // 자동으로 새로고침
      } else {
        console.log('❌ 삭제 실패:', result.error);
      }
    } catch (error) {
      console.log('💥 오류:', error);
    } finally {
      setIsDeletingDummy(false);
    }
  };

  const handleGenerateOneTimeDummy = async () => {
    setIsLoading(true);
    try {
      console.log('🎾 일회성 더미 데이터 10개 생성 시작...');
      const newMatches = await DataGenerator.generateOneTimeDummyMatches(10);
      
      if (newMatches.length > 0) {
        Alert.alert(
          '생성 완료! 🎉',
          `${newMatches.length}개의 더미 매치가 생성되었습니다!`,
          [{ text: '확인', onPress: () => runConnectionTest() }]
        );
      } else {
        Alert.alert('생성 실패', '더미 매치 생성에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '더미 매치 생성 중 오류가 발생했습니다.');
      console.error('더미 생성 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllMatches = async () => {
    console.log('🔧 모든 매치 삭제 시작...');
    
    const confirmed = window.confirm('⚠️ 정말로 모든 매치를 삭제하시겠습니까?\n\n(더미 + 실제 사용자 매치 전부 삭제됩니다)\n\n이 작업은 되돌릴 수 없습니다!');
    
    if (!confirmed) {
      console.log('사용자가 삭제를 취소했습니다.');
      return;
    }
    
    setIsDeletingDummy(true);
    
    try {
      const result = await DataGenerator.deleteAllMatches();
      console.log('삭제 결과:', result);
      
      if (result.success) {
        console.log(`✅ ${result.deletedCount}개 모든 매치 삭제 완료`);
        const shouldRefresh = window.confirm?.(`${result.deletedCount}개의 모든 매치가 삭제되었습니다.\n\n화면을 새로고침하시겠습니까?`) ?? true;
        
        if (shouldRefresh) {
          runConnectionTest();
        }
      } else {
        console.log('❌ 삭제 실패:', result.error);
        window.alert?.(`삭제 실패: ${result.error || '모든 매치 삭제에 실패했습니다.'}`);
      }
    } catch (error) {
      console.log('💥 오류:', error);
      window.alert?.('모든 매치 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingDummy(false);
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
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <TouchableOpacity 
            style={safeStyles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={safeStyles.headerTitle}>Supabase 연결 테스트</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={runConnectionTest}
            disabled={isLoading}
          >
            <RefreshCw size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
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
                {envVars.hasServiceKey ? '설정됨' : '설정되지 않음 (관리자 기능 제한)'}
              </Text>
            </View>
            {getStatusIcon(envVars.hasServiceKey)}
          </View>
        </View>

        {/* 연결 상태 테스트 */}
        {testResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔌 연결 상태</Text>
            
            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>클라이언트 연결</Text>
                <Text style={styles.testDetail}>
                  {testResult.clientConnection ? '정상' : '오류'}
                </Text>
              </View>
              {getStatusIcon(testResult.clientConnection)}
            </View>

            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>관리자 연결</Text>
                <Text style={styles.testDetail}>
                  {testResult.adminConnection ? '정상' : '오류'}
                </Text>
              </View>
              {getStatusIcon(testResult.adminConnection)}
            </View>

            <View style={styles.testItem}>
              <View style={styles.testInfo}>
                <Text style={styles.testLabel}>테이블 존재</Text>
                <Text style={styles.testDetail}>
                  {testResult.tablesExist ? '정상' : '오류'}
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
            
            {/* 더미 데이터 관리 */}
            <View style={styles.dummyDataSection}>
              <Text style={styles.dummyDataTitle}>🗑️ 더미 데이터 관리</Text>
              
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                더미 매치: {dbStats.dummyMatches}개
              </Text>
              
              {/* 기존 버튼 (confirm 사용) */}
              <TouchableOpacity 
                style={[styles.deleteDummyButton, isDeletingDummy && styles.deleteDummyButtonDisabled]}
                onPress={handleDeleteDummyData}
                disabled={isDeletingDummy}
              >
                <Trash2 size={16} color="#ffffff" />
                <Text style={styles.deleteDummyButtonText}>
                  {isDeletingDummy ? '삭제 중...' : `더미 매치 ${dbStats.dummyMatches}개 삭제`}
                </Text>
              </TouchableOpacity>

              {/* 직접 삭제 버튼 (테스트용) */}
              <TouchableOpacity 
                style={[styles.deleteDummyButton, { backgroundColor: '#f59e0b', marginTop: 8 }, isDeletingDummy && styles.deleteDummyButtonDisabled]}
                onPress={handleDeleteDummyDataDirect}
                disabled={isDeletingDummy}
              >
                <Trash2 size={16} color="#ffffff" />
                <Text style={styles.deleteDummyButtonText}>
                  🚀 직접 삭제 (확인 없이)
                </Text>
              </TouchableOpacity>

              {/* ⚠️ 모든 매치 삭제 버튼 */}
              <TouchableOpacity 
                style={[styles.deleteDummyButton, { backgroundColor: '#7c2d12', marginTop: 16, borderWidth: 2, borderColor: '#dc2626' }, isDeletingDummy && styles.deleteDummyButtonDisabled]}
                onPress={handleDeleteAllMatches}
                disabled={isDeletingDummy}
              >
                <Trash2 size={16} color="#ffffff" />
                <Text style={styles.deleteDummyButtonText}>
                  ⚠️ 모든 매치 삭제 (더미+실제)
                </Text>
              </TouchableOpacity>
              
              {/* 생성 버튼 */}
              <TouchableOpacity
                style={[
                  styles.deleteDummyButton, 
                  { backgroundColor: '#16a34a', marginTop: 8 }, 
                  isLoading && styles.deleteDummyButtonDisabled
                ]}
                onPress={handleGenerateOneTimeDummy}
                disabled={isLoading}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.deleteDummyButtonText}>
                  {isLoading ? '생성 중...' : '더미 데이터 10개 생성'}
                </Text>
              </TouchableOpacity>
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
                • Supabase URL과 Anon Key 입력{'\n'}
                • Service Role Key는 관리자 기능용 (선택사항){'\n'}
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
        {testResult && testResult.isConfigured && testResult.clientConnection && testResult.canRead && testResult.tablesExist && (
          <View style={styles.successSection}>
            <CheckCircle size={48} color="#16a34a" />
            <Text style={styles.successTitle}>✅ Supabase 연결 성공!</Text>
            <Text style={styles.successText}>
              기본 연결이 정상적으로 작동하고 있습니다.{'\n'}
              {testResult.canWrite ? '모든 기능을 사용할 수 있습니다.' : '읽기 전용으로 작동합니다.'}
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  loadingSection: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginBottom: 4,
  },
  testDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
  instructionCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
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
  dummyDataSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  dummyDataTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  deleteDummyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteDummyButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  deleteDummyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});