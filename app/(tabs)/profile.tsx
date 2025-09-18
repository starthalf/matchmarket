import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  User, 
  Settings, 
  Star, 
  Award, 
  Eye, 
  Heart, 
  Calendar, 
  CreditCard, 
  FileText, 
  LogOut,
  Database
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { CertificationBadge } from '../../components/CertificationBadge';
import { useSafeStyles } from '../../constants/Styles';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const safeStyles = useSafeStyles();

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>로그인이 필요합니다</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  const menuItems = [
    {
      icon: <FileText size={20} color="#6b7280" />,
      title: '내 참가신청',
      subtitle: '신청한 매치 현황 확인',
      onPress: () => router.push('/my-applications'),
    },
    {
      icon: <Calendar size={20} color="#6b7280" />,
      title: '내 매치 관리',
      subtitle: '등록한 매치 관리',
      onPress: () => router.push('/my-matches'),
    },
    {
      icon: <CreditCard size={20} color="#6b7280" />,
      title: '수익 정산',
      subtitle: '매치 수익 확인 및 출금',
      onPress: () => router.push('/earnings'),
    },
    {
      icon: <Award size={20} color="#6b7280" />,
      title: '인증 신청',
      subtitle: 'NTRP, 선수 경력 인증',
      onPress: () => router.push('/certification'),
    },
    {
      icon: <Settings size={20} color="#6b7280" />,
      title: '프로필 설정',
      subtitle: '개인정보 및 설정 변경',
      onPress: () => router.push('/profile-settings'),
    },
    {
      icon: <Database size={20} color="#6b7280" />,
      title: 'Supabase 테스트',
      subtitle: '데이터베이스 연결 상태 확인',
      onPress: () => router.push('/supabase-test'),
    },
  ];

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>프로필</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 프로필 카드 */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.defaultProfileImage}>
                    <User size={40} color="#9ca3af" />
                  </View>
                )}
              </View>
              
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <CertificationBadge 
                    ntrpCert={user.certification.ntrp}
                    careerCert={user.certification.career}
                    youtubeCert={user.certification.youtube}
                    instagramCert={user.certification.instagram}
                    size="medium"
                  />
                </View>
                <Text style={styles.userDetails}>
                  {user.gender} · {user.ageGroup} · NTRP {user.ntrp} · {user.careerType}
                </Text>
                <Text style={styles.userExperience}>
                  테니스 경력 {Math.floor(user.experience / 12)}년 {user.experience % 12}개월
                </Text>
              </View>
            </View>

            {/* 통계 */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Star size={16} color="#f59e0b" />
                <Text style={styles.statValue}>{user.avgRating}</Text>
                <Text style={styles.statLabel}>평점</Text>
              </View>
              
              <View style={styles.statItem}>
                <Eye size={16} color="#6b7280" />
                <Text style={styles.statValue}>{user.viewCount}</Text>
                <Text style={styles.statLabel}>조회</Text>
              </View>
              
              <View style={styles.statItem}>
                <Heart size={16} color="#ec4899" />
                <Text style={styles.statValue}>{user.likeCount}</Text>
                <Text style={styles.statLabel}>좋아요</Text>
              </View>
            </View>
          </View>

          {/* 메뉴 목록 */}
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuIcon}>
                  {item.icon}
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 로그아웃 */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#dc2626" />
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ec4899',
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
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  userDetails: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  userExperience: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomPadding: {
    height: 40,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loginPromptText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});