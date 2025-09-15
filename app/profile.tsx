import React, { useState, useEffect, useRef } from 'react';
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
import { 
  Settings, 
  Award, 
  TrendingUp, 
  Heart, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Users, 
  Eye, 
  Camera, 
  User, 
  CreditCard,
  Calendar 
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { CertificationBadge } from '../../components/CertificationBadge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSafeStyles } from '../../constants/Styles';

export default function ProfileScreen() {
  const { user: currentUser, logout } = useAuth();
  const safeStyles = useSafeStyles();
  const mounted = useRef(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // 저장된 프로필 이미지 불러오기
  useEffect(() => {
    const loadProfileImage = async () => {
      if (!currentUser || !mounted.current) return;
      
      try {
        let savedImage: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          savedImage = localStorage.getItem(`profile_image_${currentUser.id}`);
        } else {
          savedImage = await AsyncStorage.getItem(`profile_image_${currentUser.id}`);
        }
        
        // 마운트된 상태에서만 상태 업데이트
        if (savedImage && mounted.current) {
          setProfileImage(savedImage);
        }
      } catch (error) {
        console.warn('프로필 이미지 로드 실패:', error);
      }
    };

    loadProfileImage();
  }, [currentUser]);

  // 사용자 인증 상태 확인
  useEffect(() => {
    if (!currentUser && mounted.current) {
      router.replace('/auth/login');
    }
  }, [currentUser]);

  // 로딩 상태 처리
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
    if (mounted.current) {
      router.push('/certification');
    }
  };

  const handleEarningsPress = () => {
    if (mounted.current) {
      router.push('/earnings');
    }
  };

  const handleMyMatchesPress = () => {
    if (mounted.current) {
      router.push('/my-matches');
    }
  };

  const handleProfileImagePress = () => {
    if (!mounted.current) return;
    
    Alert.alert(
      '프로필 사진 변경',
      '프로필 사진을 어떻게 설정하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '카메라로 촬영', onPress: () => openCamera() },
        { text: '갤러리에서 선택', onPress: () => openGallery() },
        ...(profileImage ? [{ 
          text: '사진 삭제', 
          style: 'destructive', 
          onPress: () => removeProfileImage() 
        }] : [])
      ]
    );
  };

  const openCamera = async () => {
    if (!mounted.current) return;
    
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

      if (!result.canceled && result.assets[0] && mounted.current) {
        const imageUri = result.assets[0].uri;
        await saveProfileImage(imageUri);
      }
    } catch (error) {
      console.error('카메라 열기 실패:', error);
      Alert.alert('오류', '카메라를 열 수 없습니다.');
    }
  };

  const openGallery = async () => {
    if (!mounted.current) return;
    
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

      if (!result.canceled && result.assets[0] && mounted.current) {
        const imageUri = result.assets[0].uri;
        await saveProfileImage(imageUri);
      }
    } catch (error) {
      console.error('갤러리 열기 실패:', error);
      Alert.alert('오류', '갤러리를 열 수 없습니다.');
    }
  };

  const saveProfileImage = async (imageUri: string) => {
    if (!currentUser || !mounted.current) return;
    
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(`profile_image_${currentUser.id}`, imageUri);
      } else {
        await AsyncStorage.setItem(`profile_image_${currentUser.id}`, imageUri);
      }
      
      if (mounted.current) {
        setProfileImage(imageUri);
      }
    } catch (error) {
      console.error('프로필 이미지 저장 실패:', error);
      Alert.alert('오류', '프로필 이미지 저장에 실패했습니다.');
    }
  };

  const removeProfileImage = async () => {
    if (!currentUser || !mounted.current) return;
    
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem(`profile_image_${currentUser.id}`);
      } else {
        await AsyncStorage.removeItem(`profile_image_${currentUser.id}`);
      }
      
      if (mounted.current) {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('프로필 이미지 삭제 실패:', error);
      Alert.alert('오류', '프로필 이미지 삭제에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <ScrollView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => mounted.current && router.push('/profile-settings')}
          >
            <Settings size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={handleProfileImagePress}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.defaultProfileImage}>
                <User size={40} color="#666" />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <Camera size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userInfo}>
            {currentUser.gender} • {currentUser.ageGroup} • NTRP {currentUser.ntrp}
          </Text>
          <Text style={styles.userCareer}>
            {currentUser.careerType} • {currentUser.experience}년차 • {currentUser.playStyle}
          </Text>

          {/* 인증 배지들 */}
          <View style={styles.badgeContainer}>
            <CertificationBadge 
              type="ntrp" 
              status={currentUser.certifications?.ntrp || 'none'} 
            />
            <CertificationBadge 
              type="career" 
              status={currentUser.certifications?.career || 'none'} 
            />
            <CertificationBadge 
              type="youtube" 
              status={currentUser.certifications?.youtube || 'none'} 
            />
            <CertificationBadge 
              type="instagram" 
              status={currentUser.certifications?.instagram || 'none'} 
            />
          </View>

          <TouchableOpacity 
            style={styles.certificationButton}
            onPress={handleCertificationRequest}
          >
            <Award size={16} color="#007AFF" />
            <Text style={styles.certificationButtonText}>인증 요청</Text>
          </TouchableOpacity>
        </View>

        {/* 통계 섹션 */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Eye size={20} color="#666" />
            <Text style={styles.statLabel}>조회수</Text>
            <Text style={styles.statValue}>{currentUser.viewCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Heart size={20} color="#666" />
            <Text style={styles.statLabel}>좋아요</Text>
            <Text style={styles.statValue}>{currentUser.likeCount}</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingUp size={20} color="#666" />
            <Text style={styles.statLabel}>평점</Text>
            <Text style={styles.statValue}>{currentUser.avgRating.toFixed(1)}</Text>
          </View>
        </View>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEarningsPress}>
            <DollarSign size={20} color="#666" />
            <Text style={styles.menuText}>수익 관리</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleMyMatchesPress}>
            <Users size={20} color="#666" />
            <Text style={styles.menuText}>내 매치</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => mounted.current && router.push('/match-history')}
          >
            <Clock size={20} color="#666" />
            <Text style={styles.menuText}>매치 기록</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => mounted.current && router.push('/payments')}
          >
            <CreditCard size={20} color="#666" />
            <Text style={styles.menuText}>결제 내역</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 8,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userCareer: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  certificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  certificationButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
  },
});