import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Plus, Minus } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const SKILL_LABELS = ['서브', '리턴', '포핸드', '백핸드', '발리', '풋워크', '체력', '멘탈'];
const SKILL_KEYS = ['skill_serve', 'skill_return', 'skill_forehand', 'skill_backhand', 'skill_volley', 'skill_footwork', 'skill_stamina', 'skill_mental'];

export default function CreatePlayerPageScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  // 폼 상태
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [career, setCareer] = useState('');
  const [introduction, setIntroduction] = useState('');
  
  // 스킬 점수 (1~5)
  const [skills, setSkills] = useState<Record<string, number>>({
    skill_serve: 3,
    skill_return: 3,
    skill_forehand: 3,
    skill_backhand: 3,
    skill_volley: 3,
    skill_footwork: 3,
    skill_stamina: 3,
    skill_mental: 3,
  });

  // 기존 프로필 불러오기
  useEffect(() => {
    if (user?.id) {
      fetchExistingProfile();
    }
  }, [user]);

  const fetchExistingProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setExistingProfile(data);
        setNickname(data.nickname || '');
        setProfileImage(data.profile_image || '');
        setCareer(data.career || '');
        setIntroduction(data.introduction || '');
        setSkills({
          skill_serve: data.skill_serve || 3,
          skill_return: data.skill_return || 3,
          skill_forehand: data.skill_forehand || 3,
          skill_backhand: data.skill_backhand || 3,
          skill_volley: data.skill_volley || 3,
          skill_footwork: data.skill_footwork || 3,
          skill_stamina: data.skill_stamina || 3,
          skill_mental: data.skill_mental || 3,
        });
      }
    } catch (error) {
      console.log('프로필 없음 - 새로 생성');
    }
  };

const updateSkill = (key: string, delta: number) => {
  setSkills(prev => ({
    ...prev,
    [key]: Math.round(Math.max(1, Math.min(5, prev[key] + delta)) * 10) / 10
  }));
};

  const handleSubmit = async () => {
    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('로그인이 필요합니다.');
      }
      router.push('/auth/login');
      return;
    }

    if (!nickname.trim()) {
      if (Platform.OS === 'web') {
        window.alert('닉네임을 입력해주세요.');
      }
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        user_id: user.id,
        nickname: nickname.trim(),
        profile_image: profileImage || null,
        career: career.trim() || null,
        introduction: introduction.trim() || null,
        ...skills,
        is_published: true,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (existingProfile) {
        // 기존 프로필 업데이트
        result = await supabase
          .from('player_profiles')
          .update(profileData)
          .eq('id', existingProfile.id)
          .select()
          .single();
      } else {
        // 새 프로필 생성
        result = await supabase
          .from('player_profiles')
          .insert(profileData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      if (Platform.OS === 'web') {
        window.alert(existingProfile ? '프로필이 수정되었습니다!' : '내 페이지가 생성되었습니다!');
      }

      // 생성/수정된 페이지로 이동
      router.replace(`/player/${result.data.id}`);

    } catch (error: any) {
      console.error('프로필 저장 오류:', error);
      if (Platform.OS === 'web') {
        window.alert(`저장 실패: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = () => {
    if (Platform.OS === 'web') {
      const url = window.prompt('프로필 이미지 URL을 입력하세요');
      if (url) {
        setProfileImage(url);
      }
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginRequired}>
          <Text style={styles.loginText}>로그인이 필요합니다</Text>
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginBtnText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingProfile ? '내 페이지 수정' : '내 페이지 만들기'}
        </Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ea4c89" />
          ) : (
            <Text style={styles.submitText}>완료</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 이미지 */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={handleImagePick}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Camera size={32} color="#9ca3af" />
                <Text style={styles.imagePlaceholderText}>사진 추가</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 닉네임 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>닉네임 *</Text>
          <TextInput
            style={styles.textInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="플레이어 이름을 입력하세요"
            placeholderTextColor="#9ca3af"
            maxLength={20}
          />
        </View>

        {/* 스킬 점수 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>나의 테니스 Index</Text>
          <Text style={styles.labelSub}>각 항목을 1~5점으로 평가해주세요</Text>
          
          <View style={styles.skillsContainer}>
            {SKILL_KEYS.map((key, index) => (
              <View key={key} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{SKILL_LABELS[index]}</Text>
                <View style={styles.skillControls}>
                  <TouchableOpacity 
                    style={styles.skillBtn}
                    onPress={() => updateSkill(key, -1)}
                  >
                    <Minus size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <View style={styles.skillValueContainer}>
                    <Text style={styles.skillValue}>{skills[key].toFixed(1)}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.skillBtn}
                    onPress={() => updateSkill(key, 1)}
                  >
                    <Plus size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 주요 입상 & 경력 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>주요 입상 & 경력</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={career}
            onChangeText={setCareer}
            placeholder="예: 전국체전 우승, 실업팀 5년 경력..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 자기소개 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>자기소개</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={introduction}
            onChangeText={setIntroduction}
            placeholder="테니스 스타일, 선호하는 플레이 등을 소개해주세요..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ea4c89',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePickerBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 60,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  labelSub: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  skillsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  skillLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  skillControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skillBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  skillValueContainer: {
    width: 40,
    alignItems: 'center',
  },
  skillValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22c55e',
  },
  loginRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: '#ea4c89',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});