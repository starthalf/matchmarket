import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Settings, Bell, DollarSign, Shield, Database, Mail, Smartphone } from 'lucide-react-native';
import { AdminSettingsManager } from '../../utils/adminSettings';

export default function AdminSettingsScreen() {
  const [settings, setSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    autoBackup: true,
    debugMode: false,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    platformFee: '15',
    withdrawalFee: '0',
    minWithdrawalAmount: '10000',
    withdrawalPeriod: '14',
    twoFactorAuth: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await AdminSettingsManager.getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('설정 로딩 오류:', error);
      }
    };
    loadSettings();
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    Alert.alert(
      '설정 저장',
      '변경된 설정을 저장하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '저장', onPress: async () => {
          try {
            await AdminSettingsManager.saveSettings(settings);
            Alert.alert('완료', '설정이 저장되었습니다.');
          } catch (error) {
            Alert.alert('오류', '설정 저장에 실패했습니다.');
          }
        }}
      ]
    );
  };

  const handleSystemAction = (action: string) => {
    switch (action) {
      case 'backup':
        Alert.alert('백업 시작', '시스템 백업을 시작합니다.');
        break;
      case 'logs':
        Alert.alert('로그 확인', '시스템 로그를 확인합니다.');
        break;
      case 'cache':
        Alert.alert('캐시 삭제', '시스템 캐시를 삭제합니다.');
        break;
      case 'restart':
        Alert.alert(
          '시스템 재시작',
          '정말로 시스템을 재시작하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { text: '재시작', style: 'destructive', onPress: () => {
              Alert.alert('재시작', '시스템이 재시작됩니다.');
            }}
          ]
        );
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>시스템 설정</Text>
        <Text style={styles.subtitle}>관리자 시스템 설정 및 관리</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 시스템 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>시스템 설정</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>점검 모드</Text>
              <Text style={styles.settingDescription}>
                시스템 점검 시 사용자 접근 차단
              </Text>
            </View>
            <Switch
              value={settings.maintenanceMode}
              onValueChange={(value) => updateSetting('maintenanceMode', value)}
              trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
              thumbColor={settings.maintenanceMode ? '#dc2626' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>자동 백업</Text>
              <Text style={styles.settingDescription}>
                매일 자정에 자동으로 데이터 백업
              </Text>
            </View>
            <Switch
              value={settings.autoBackup}
              onValueChange={(value) => updateSetting('autoBackup', value)}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={settings.autoBackup ? '#16a34a' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>디버그 모드</Text>
              <Text style={styles.settingDescription}>
                개발자 디버깅 정보 표시
              </Text>
            </View>
            <Switch
              value={settings.debugMode}
              onValueChange={(value) => updateSetting('debugMode', value)}
              trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
              thumbColor={settings.debugMode ? '#f59e0b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>알림 설정</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>푸시 알림</Text>
              <Text style={styles.settingDescription}>
                앱 푸시 알림 활성화
              </Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(value) => updateSetting('pushNotifications', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.pushNotifications ? '#3b82f6' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>이메일 알림</Text>
              <Text style={styles.settingDescription}>
                중요 알림 이메일 발송
              </Text>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={(value) => updateSetting('emailNotifications', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.emailNotifications ? '#3b82f6' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>SMS 알림</Text>
              <Text style={styles.settingDescription}>
                긴급 알림 SMS 발송
              </Text>
            </View>
            <Switch
              value={settings.smsNotifications}
              onValueChange={(value) => updateSetting('smsNotifications', value)}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={settings.smsNotifications ? '#3b82f6' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* 결제 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color="#16a34a" />
            <Text style={styles.sectionTitle}>결제 설정</Text>
          </View>
          
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>플랫폼 수수료 (%)</Text>
            <TextInput
              style={styles.textInput}
              value={settings.platformFee}
              onChangeText={(value) => updateSetting('platformFee', value)}
              keyboardType="numeric"
              placeholder="15"
            />
          </View>
          
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>출금 수수료 (원)</Text>
            <TextInput
              style={styles.textInput}
              value={settings.withdrawalFee}
              onChangeText={(value) => updateSetting('withdrawalFee', value)}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>최소 출금 금액 (원)</Text>
            <TextInput
              style={styles.textInput}
              value={settings.minWithdrawalAmount}
              onChangeText={(value) => updateSetting('minWithdrawalAmount', value)}
              keyboardType="numeric"
              placeholder="10000"
            />
          </View>
          
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>출금 주기 (일)</Text>
            <TextInput
              style={styles.textInput}
              value={settings.withdrawalPeriod}
              onChangeText={(value) => updateSetting('withdrawalPeriod', value)}
              keyboardType="numeric"
              placeholder="14"
            />
            <Text style={styles.inputHint}>
              사용자가 출금할 수 있는 최소 간격 (기본: 14일)
            </Text>
          </View>
        </View>

        {/* 보안 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>보안 설정</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>2단계 인증</Text>
              <Text style={styles.settingDescription}>
                관리자 계정 2단계 인증 필수
              </Text>
            </View>
            <Switch
              value={settings.twoFactorAuth}
              onValueChange={(value) => updateSetting('twoFactorAuth', value)}
              trackColor={{ false: '#d1d5db', true: '#fbbf24' }}
              thumbColor={settings.twoFactorAuth ? '#f59e0b' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>세션 타임아웃 (분)</Text>
            <TextInput
              style={styles.textInput}
              value={settings.sessionTimeout}
              onChangeText={(value) => updateSetting('sessionTimeout', value)}
              keyboardType="numeric"
              placeholder="30"
            />
          </View>
          
          <View style={styles.inputItem}>
            <Text style={styles.inputLabel}>최대 로그인 시도 횟수</Text>
            <TextInput
              style={styles.textInput}
              value={settings.maxLoginAttempts}
              onChangeText={(value) => updateSetting('maxLoginAttempts', value)}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>
        </View>

        {/* 시스템 관리 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color="#6b7280" />
            <Text style={styles.sectionTitle}>시스템 관리</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.backupButton]}
              onPress={() => handleSystemAction('backup')}
            >
              <Text style={styles.backupButtonText}>수동 백업</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.logsButton]}
              onPress={() => handleSystemAction('logs')}
            >
              <Text style={styles.logsButtonText}>로그 확인</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cacheButton]}
              onPress={() => handleSystemAction('cache')}
            >
              <Text style={styles.cacheButtonText}>캐시 삭제</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.restartButton]}
              onPress={() => handleSystemAction('restart')}
            >
              <Text style={styles.restartButtonText}>시스템 재시작</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.saveSection}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Text style={styles.saveButtonText}>설정 저장</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  inputItem: {
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  backupButton: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  backupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  logsButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  logsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  cacheButton: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  cacheButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  restartButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomPadding: {
    height: 40,
  },
  saveSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});