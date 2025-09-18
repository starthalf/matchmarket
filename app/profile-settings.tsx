import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Camera, Save } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSafeStyles } from '../constants/Styles';

export default function ProfileSettingsScreen() {
  const { user } = useAuth();
  const safeStyles = useSafeStyles();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    ntrp: user?.ntrp.toString() || '',
    experience: user?.experience.toString() || '',
    playStyle: user?.playStyle || '올라운드',
    careerType: user?.careerType || '동호인',
  });

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <Text>로그인이 필요합니다.</Text>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    // 유효성 검사
    if (!formData.name) {
      Alert.alert('입력 오류', '이름을 입력해주세요.');
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

    // 사용자 정보 업데이트
    user.name = formData.name;
    user.ntrp = ntrp;
    user.experience = experience;
    user.playStyle = formData.playStyle as any;
    user.careerType = formData.careerType as any;

    Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
  };

  const handleProfileImageChange = () => {
    Alert.alert(
      '프로필 사진 변경',
      '프로필 사진을 변경하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '카메라', onPress: () => console.log('카메라 촬영') },
        { text: '갤러리', onPress: () => console.log('갤러리 선택') },
      ]
    );
  };

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
          <Text style={safeStyles.headerTitle}>프로필 설정</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={20} color="#ec4899" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 사진 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프로필 사진</Text>
          
          <View style={styles.profileImageSection}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={handleProfileImageChange}
            >
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <User size={40} color="#9ca3af" />
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Camera size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageHint}>
              탭하여 프로필 사진을 변경하세요
            </Text>
          </View>
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>이름 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.readOnlyGroup}>
            <Text style={styles.inputLabel}>성별</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{user.gender}</Text>
            </View>
            <Text style={styles.inputHint}>성별은 변경할 수 없습니다</Text>
          </View>

          <View style={styles.readOnlyGroup}>
            <Text style={styles.inputLabel}>연령대</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{user.ageGroup}</Text>
            </View>
            <Text style={styles.inputHint}>연령대는 변경할 수 없습니다</Text>
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
  saveButton: {
    padding: 4,
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
  profileImageSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ec4899',
    marginBottom: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  defaultProfileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileImageHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
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
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  readOnlyGroup: {
    marginBottom: 16,
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#9ca3af',
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
  bottomPadding: {
    height: 40,
  },
});