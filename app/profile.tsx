import React from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, Award, Heart, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Camera, User } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { CertificationBadge } from '../components/CertificationBadge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSafeStyles } from '../constants/Styles';

export default function ProfileScreen() {
  const { user: currentUser, logout } = useAuth();
  const safeStyles = useSafeStyles();
  const [profileImage, setProfileImage] = React.useState<string | null>(null);

  // 저장된 프로필 이미지 불러오기
  React.useEffect(() => {
    const loadProfileImage = async () => {
      if (!currentUser) return;
      try {
        let savedImage: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          savedImage = localStorage.getItem(`profile_image_${currentUser.id}`);
        } else {
          savedImage = await AsyncStorage.getItem(`profile_image_${currentUser.id}`);
        }
        if (savedImage) {
          setProfileImage(savedImage);
        }
      } catch (error) {
        console.warn('프로필 이미지 로드 실패:', error);
      }
    };
    loadProfileImage();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      // 기존 useEffect 로직은 그대로 유지
    } else {
      router.replace('/auth/login');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loadingContainer}>
          <Text>로그인이 필요합니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCertificationRequest = () => {
    router.push('/certification');
  };

  const handleProfileImagePress = () => {
    Alert.alert(
      '프로필 사진 변경',
      '프로필 사진을 어떻게 설정하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '카메라로 촬영', onPress: () => openCamera() },
        { text: '갤러리에서 선택', onPress: () => openGallery() },
        ...(profileImage ? [{ text: '사진 삭제', style: 'destructive', onPress: () => removeProfileImage() }] : [])
      ]
    );
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('권한 필요', '카메라 사용을 위해 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // 플랫폼별 저장
        if (currentUser) {
          try {
            if (Platform.OS === 'web') {
              if (typeof window !== 'undefined') {
                localStorage.setItem(`profile_image_${currentUser.id}`, imageUri);
              }
            } else {
              await AsyncStorage.setItem(`profile_image_${currentUser.id}`, imageUri);
            }
          } catch (error) {
            console.warn('프로필 이미지 저장 실패:', error);
          }
        }
        
        Alert.alert('완료', '프로필 사진이 변경되었습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '카메라를 열 수 없습니다.');
    }
  };

  const openGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('권한 필요', '갤러리 접근을 위해 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // 플랫폼별 저장
        if (currentUser) {
          try {
            if (Platform.OS === 'web') {
              if (typeof window !== 'undefined') {
                localStorage.setItem(`profile_image_${currentUser.id}`, imageUri);
              }
            } else {
              await AsyncStorage.setItem(`profile_image_${currentUser.id}`, imageUri);
            }
          } catch (error) {
            console.warn('프로필 이미지 저장 실패:', error);
          }
        }
        
        Alert.alert('완료', '프로필 사진이 변경되었습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '갤러리를 열 수 없습니다.');
    }
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    
    // 플랫폼별 삭제
    if (currentUser) {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`profile_image_${currentUser.id}`);
          }
        } else {
          AsyncStorage.removeItem(`profile_image_${currentUser.id}`);
        }
      } catch (error) {
        console.warn('프로필 이미지 삭제 실패:', error);
      }
    }
    
    Alert.alert('완료', '프로필 사진이 삭제되었습니다.');
  };

  const handleLogout = () => {
    router.push('/profile-settings');
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <Text style={styles.title}>프로필</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
            <Settings size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 기본 정보 */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.profileImageSection}
              onPress={handleProfileImagePress}
            >
              <View style={styles.profileImageContainer}>
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.defaultProfileImage}>
                    <User size={32} color="#9ca3af" />
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <Camera size={16} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.changePhotoText}>사진 변경</Text>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <CertificationBadge 
                ntrpCert={currentUser.certification.ntrp}
                careerCert={currentUser.certification.career}
                youtubeCert={currentUser.certification.youtube}
                instagramCert={currentUser.certification.instagram}
                size="large"
              />
            </View>
          </View>
          
          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>성별</Text>
              <Text style={styles.detailValue}>{currentUser.gender}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>나이대</Text>
              <Text style={styles.detailValue}>{currentUser.ageGroup}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>NTRP</Text>
              <Text style={styles.detailValue}>{currentUser.ntrp.toFixed(1)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>경력</Text>
              <Text style={styles.detailValue}>
                {currentUser.experience}년
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>플레이 스타일</Text>
              <Text style={styles.detailValue}>{currentUser.playStyle}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>선수 출신</Text>
              <Text style={styles.detailValue}>{currentUser.careerType}</Text>
            </View>
          </View>
        </View>

        {/* 인증 상태 */}
        <View style={styles.certificationSection}>
          <Text style={styles.sectionTitle}>인증 현황</Text>
          
          <View style={styles.certificationCard}>
            <View style={styles.certItem}>
              <View style={styles.certInfo}>
                <Text style={styles.certTitle}>NTRP 등급 인증</Text>
                <View style={styles.certStatus}>
                  {currentUser.certification.ntrp === 'verified' ? (
                    <>
                      <CheckCircle size={16} color="#16a34a" />
                      <Text style={styles.certVerified}>인증 완료</Text>
                    </>
                  ) : currentUser.certification.ntrp === 'pending' ? (
                    <>
                      <Clock size={16} color="#f59e0b" />
                      <Text style={styles.certPending}>심사 중</Text>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} color="#6b7280" />
                      <Text style={styles.certNone}>미인증</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.certItem}>
              <View style={styles.certInfo}>
                <Text style={styles.certTitle}>선수 인증</Text>
                <View style={styles.certStatus}>
                  {currentUser.certification.career === 'verified' ? (
                    <>
                      <CheckCircle size={16} color="#16a34a" />
                      <Text style={styles.certVerified}>인증 완료</Text>
                    </>
                  ) : currentUser.certification.career === 'pending' ? (
                    <>
                      <Clock size={16} color="#f59e0b" />
                      <Text style={styles.certPending}>심사 중</Text>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} color="#6b7280" />
                      <Text style={styles.certNone}>미인증</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.certItem}>
              <View style={styles.certInfo}>
                <Text style={styles.certTitle}>유튜버 인증</Text>
                <View style={styles.certStatus}>
                  {currentUser.certification.youtube === 'verified' ? (
                    <>
                      <CheckCircle size={16} color="#16a34a" />
                      <Text style={styles.certVerified}>인증 완료</Text>
                    </>
                  ) : currentUser.certification.youtube === 'pending' ? (
                    <>
                      <Clock size={16} color="#f59e0b" />
                      <Text style={styles.certPending}>심사 중</Text>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} color="#6b7280" />
                      <Text style={styles.certNone}>미인증</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.certItem}>
              <View style={styles.certInfo}>
                <Text style={styles.certTitle}>인플루언서 인증</Text>
                <View style={styles.certStatus}>
                  {currentUser.certification.instagram === 'verified' ? (
                    <>
                      <CheckCircle size={16} color="#16a34a" />
                      <Text style={styles.certVerified}>인증 완료</Text>
                    </>
                  ) : currentUser.certification.instagram === 'pending' ? (
                    <>
                      <Clock size={16} color="#f59e0b" />
                      <Text style={styles.certPending}>심사 중</Text>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} color="#6b7280" />
                      <Text style={styles.certNone}>미인증</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.certButton} 
              onPress={handleCertificationRequest}
            >
              <Award size={18} color="#16a34a" />
              <Text style={styles.certButtonText}>인증 신청하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 수익 정산 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>수익 관리</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/earnings')}
          >
            <View style={styles.menuItemLeft}>
              <Award size={20} color="#16a34a" />
              <Text style={styles.menuItemText}>수익 정산</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 활동 통계 */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>활동 통계</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Heart size={24} color="#dc2626" />
              <Text style={styles.statNumber}>{currentUser.likeCount}</Text>
              <Text style={styles.statLabel}>좋아요</Text>
            </View>
            
            <View style={styles.statCard}>
              <Award size={24} color="#ec4899" />
              <Text style={styles.statNumber}>{currentUser.avgRating}</Text>
              <Text style={styles.statLabel}>평균 평점</Text>
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
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  profileCard: {
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
  profileHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    gap: 8,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#e5e7eb',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  certificationSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  certificationCard: {
    backgroundColor: '#ffffff',
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
  certItem: {
    marginBottom: 16,
  },
  certInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  certTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  certStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  certVerified: {
    fontSize: 14,
    color: '#ec4899',
    fontWeight: '600',
  },
  certPending: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  certNone: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  certButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fdf2f8',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ec4899',
    marginTop: 8,
  },
  certButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ec4899',
  },
  statsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});