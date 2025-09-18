import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Lock, Bell, Shield, Trash2, LogOut } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSafeStyles } from '../constants/Styles';

export default function ProfileSettingsScreen() {
  const { user: currentUser, logout } = useAuth();
  const safeStyles = useSafeStyles();
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.name || '', // 임시로 name을 email로 사용
    ntrp: currentUser?.ntrp.toString() || '',
    experience: currentUser?.experience.toString() || '',
    playStyle: currentUser?.playStyle || '올라운드',
    careerType: currentUser?.careerType || '동호인',
  });
  
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
  });

  const handleSaveProfile = () => {
    Alert.alert(
      '프로필 저장',
      '프로필 정보를 저장하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '저장', onPress: () => {
          Alert.alert('완료', '프로필이 저장되었습니다.');
        }}
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      '비밀번호 변경',
      '비밀번호 변경 기능은 준비 중입니다.',
      [{ text: '확인' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => {
          Alert.alert('계정 삭제', '계정 삭제가 요청되었습니다. 고객센터에서 처리됩니다.');
        }}
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말로 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', onPress: logout }
      ]
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <Text>로그인이 필요합니다.</Text>
      </SafeAreaView>
    );
  }

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
          <Text style={safeStyles.headerTitle}>설정</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 정보 수정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#ec4899" />
            <Text style={styles.sectionTitle}>프로필 정보</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>이름</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>이메일</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NTRP 등급</Text>
            <TextInput
              style={styles.textInput}
              value={formData.ntrp}
              onChangeText={(text) => setFormData({...formData, ntrp: text})}
              placeholder="예: 4.5"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>테니스 경력 (개월)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.experience}
              onChangeText={(text) => setFormData({...formData, experience: text})}
              placeholder="예: 36"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>플레이 스타일</Text>
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

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
            <Text style={styles.saveButtonText}>프로필 저장</Text>
          </TouchableOpacity>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>알림 설정</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>푸시 알림</Text>
              <Text style={styles.settingDescription}>
                매치 관련 중요 알림 수신
              </Text>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(value) => setNotifications({...notifications, push: value})}
              trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
              thumbColor={notifications.push ? '#ec4899' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>이메일 알림</Text>
              <Text style={styles.settingDescription}>
                매치 확정, 결제 관련 알림
              </Text>
            </View>
            <Switch
              value={notifications.email}
              onValueChange={(value) => setNotifications({...notifications, email: value})}
              trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
              thumbColor={notifications.email ? '#ec4899' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>SMS 알림</Text>
              <Text style={styles.settingDescription}>
                긴급 알림 문자 수신
              </Text>
            </View>
            <Switch
              value={notifications.sms}
              onValueChange={(value) => setNotifications({...notifications, sms: value})}
              trackColor={{ false: '#d1d5db', true: '#fca5a5' }}
              thumbColor={notifications.sms ? '#ec4899' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* 계정 관리 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color="#dc2626" />
            <Text style={styles.sectionTitle}>계정 관리</Text>
          </View>
          
          <TouchableOpacity style={styles.dangerMenuItem} onPress={handleDeleteAccount}>
            <View style={styles.menuItemLeft}>
              <Trash2 size={18} color="#dc2626" />
              <Text style={styles.dangerMenuItemText}>계정 삭제</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutMenuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <LogOut size={18} color="#6b7280" />
              <Text style={styles.menuItemText}>로그아웃</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

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
  placeholder: {
    width: 32,
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
  inputGroup: {
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
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
  saveButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dangerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  dangerMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#9ca3af',
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
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  bottomPadding: {
    height: 40,
  },
});