import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Bell, DollarSign, Shield, Database, Mail, Smartphone } from 'lucide-react-native';
import { AdminSettingsManager } from '../../utils/adminSettings';
import { useSafeStyles } from '../../constants/Styles';

// AdminSettings 타입 정의 추가
interface AdminSettings {
  maintenanceMode: boolean;
  autoBackup: boolean;
  debugMode: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  platformFee: string;
  withdrawalFee: string;
  minWithdrawalAmount: string;
  withdrawalPeriod: string;
  twoFactorAuth: boolean;
  sessionTimeout: string;
  maxLoginAttempts: string;
}

export default function AdminSettingsScreen() {
  const safeStyles = useSafeStyles();
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

  const renderToggleSetting = (
    key: keyof AdminSettings,
    label: string,
    description: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(value) => updateSetting(key, value)}
        trackColor={{ false: '#e5e7eb', true: '#dc2626' }}
        thumbColor={settings[key] ? '#ffffff' : '#f9fafb'}
      />
    </View>
  );

  const renderTextSetting = (
    key: keyof AdminSettings,
    label: string,
    description: string,
    suffix?: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          value={settings[key] as string}
          onChangeText={(value) => updateSetting(key, value)}
          keyboardType="numeric"
          placeholder="0"
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>관리자 설정</Text>
        <Text style={styles.subtitle}>시스템 및 플랫폼 설정 관리</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 시스템 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>시스템 설정</Text>
          </View>
          
          {renderToggleSetting(
            'maintenanceMode',
            '유지보수 모드',
            '시스템 점검 시 사용자 접근을 제한합니다'
          )}
          
          {renderToggleSetting(
            'autoBackup',
            '자동 백업',
            '매일 자정에 자동으로 데이터를 백업합니다'
          )}
          
          {renderToggleSetting(
            'debugMode',
            '디버그 모드',
            '개발자용 로그를 활성화합니다'
          )}
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>알림 설정</Text>
          </View>
          
          {renderToggleSetting(
            'pushNotifications',
            '푸시 알림',
            '앱 푸시 알림을 전송합니다'
          )}
          
          {renderToggleSetting(
            'emailNotifications',
            '이메일 알림',
            '이메일로 알림을 전송합니다'
          )}
          
          {renderToggleSetting(
            'smsNotifications',
            'SMS 알림',
            '문자메시지로 알림을 전송합니다'
          )}
        </View>

        {/* 결제 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>결제 설정</Text>
          </View>
          
          {renderTextSetting(
            'platformFee',
            '플랫폼 수수료',
            '매치당 플랫폼 수수료율',
            '%'
          )}
          
          {renderTextSetting(
            'withdrawalFee',
            '출금 수수료',
            '출금 시 부과되는 고정 수수료',
            '원'
          )}
          
          {renderTextSetting(
            'minWithdrawalAmount',
            '최소 출금 금액',
            '최소 출금 가능 금액',
            '원'
          )}
          
          {renderTextSetting(
            'withdrawalPeriod',
            '출금 주기',
            '출금 요청 처리 기간',
            '일'
          )}
        </View>

        {/* 보안 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>보안 설정</Text>
          </View>
          
          {renderToggleSetting(
            'twoFactorAuth',
            '2단계 인증',
            '관리자 로그인 시 2단계 인증을 요구합니다'
          )}
          
          {renderTextSetting(
            'sessionTimeout',
            '세션 만료',
            '비활성 상태 유지 시간',
            '분'
          )}
          
          {renderTextSetting(
            'maxLoginAttempts',
            '최대 로그인 시도',
            '계정 잠금 전 최대 시도 횟수',
            '회'
          )}
        </View>

        {/* 시스템 작업 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>시스템 작업</Text>
          </View>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSystemAction('backup')}
            >
              <Text style={styles.actionButtonText}>수동 백업</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSystemAction('logs')}
            >
              <Text style={styles.actionButtonText}>로그 확인</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSystemAction('cache')}
            >
              <Text style={styles.actionButtonText}>캐시 삭제</Text>
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
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
    minWidth: 80,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  restartButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  restartButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  saveSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  bottomPadding: {
    height: 20,
  },
});