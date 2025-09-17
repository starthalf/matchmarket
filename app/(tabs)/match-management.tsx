import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ClipboardList, 
  Users, 
  Clock, 
  MapPin, 
  Calendar,
  User,
  X,
  Check,
  CreditCard,
  MessageCircle
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { router } from 'expo-router';
import { useSafeStyles } from '../../constants/Styles';

interface MatchApplication {
  id: string;
  userId: string;
  userName: string;
  userGender: '남성' | '여성';
  userNtrp: number;
  userProfileImage?: string;
  appliedPrice: number;
  appliedAt: string;
  status: 'pending' | 'confirmed' | 'rejected';
}

export default function MatchManagementScreen() {
  const { user } = useAuth();
  const { matches, updateMatch } = useMatches();
  const safeStyles = useSafeStyles();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.loginPrompt}>
          <ClipboardList size={48} color="#9ca3af" />
          <Text style={styles.loginPromptTitle}>로그인이 필요합니다</Text>
          <Text style={styles.loginPromptText}>
            매치를 관리하려면 로그인해주세요
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 내가 판매한 매치들만 필터링
  const myMatches = matches.filter(match => match.sellerId === user.id);

  const handleViewApplications = (match: any) => {
    setSelectedMatch(match);
    setShowApplicationModal(true);
  };

  const handleAcceptApplication = async (matchId: string, applicantId: string) => {
    Alert.alert(
      '참여신청 승인',
      '이 참여자의 신청을 승인하시겠습니까?\n승인 시 결제요청이 전송됩니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '승인하기', 
          onPress: () => processApplicationAcceptance(matchId, applicantId)
        }
      ]
    );
  };

  const processApplicationAcceptance = async (matchId: string, applicantId: string) => {
    try {
      // TODO: 실제 구현에서는 백엔드 API 호출
      // 1. 참여신청을 confirmed로 변경
      // 2. 참여자에게 결제요청 알림 발송
      // 3. 5분 타이머 시작
      
      const match = matches.find(m => m.id === matchId);
      if (match) {
        // 매치 업데이트 로직 구현 필요
        Alert.alert('승인 완료', '참여신청이 승인되었습니다.\n참여자에게 결제요청이 전송되었습니다.');
        setShowApplicationModal(false);
      }
    } catch (error) {
      console.error('참여신청 승인 중 오류:', error);
      Alert.alert('오류', '참여신청 승인 중 오류가 발생했습니다.');
    }
  };

  const handleRejectApplication = async (matchId: string, applicantId: string) => {
    Alert.alert(
      '참여신청 거절',
      '이 참여자의 신청을 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '거절하기', 
          style: 'destructive',
          onPress: () => processApplicationRejection(matchId, applicantId)
        }
      ]
    );
  };

  const processApplicationRejection = async (matchId: string, applicantId: string) => {
    try {
      // TODO: 실제 구현에서는 백엔드 API 호출
      Alert.alert('거절 완료', '참여신청이 거절되었습니다.');
      setShowApplicationModal(false);
    } catch (error) {
      console.error('참여신청 거절 중 오류:', error);
      Alert.alert('오류', '참여신청 거절 중 오류가 발생했습니다.');
    }
  };

  // Mock 데이터 - 실제로는 백엔드에서 가져올 데이터
  const getMatchApplications = (matchId: string): MatchApplication[] => {
    // 임시 더미 데이터
    return [
      {
        id: 'app1',
        userId: 'user1',
        userName: '김테니스',
        userGender: '남성',
        userNtrp: 4.2,
        appliedPrice: 25000,
        appliedAt: new Date().toISOString(),
        status: 'pending'
      },
      {
        id: 'app2',
        userId: 'user2',
        userName: '박라켓',
        userGender: '여성',
        userNtrp: 3.8,
        appliedPrice: 27000,
        appliedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'pending'
      }
    ];
  };

  if (myMatches.length === 0) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>매치관리</Text>
        </View>
        <View style={styles.emptyState}>
          <ClipboardList size={48} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>등록한 매치가 없습니다</Text>
          <Text style={styles.emptyStateText}>
            매치를 등록하고 참여신청을 관리해보세요
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/(tabs)/register')}
          >
            <Text style={styles.createButtonText}>매치 등록하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>매치관리</Text>
        <Text style={styles.headerSubtitle}>
          내가 등록한 매치 {myMatches.length}개
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {myMatches.map((match) => {
          const applications = getMatchApplications(match.id);
          const pendingCount = applications.filter(app => app.status === 'pending').length;
          
          return (
            <View key={match.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTitle}>{match.title}</Text>
                  <View style={styles.matchDetails}>
                    <View style={styles.detailItem}>
                      <Calendar size={14} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {match.date} {match.time}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MapPin size={14} color="#6b7280" />
                      <Text style={styles.detailText}>{match.court}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.matchStatus}>
                  <Text style={styles.priceText}>
                    {match.currentPrice.toLocaleString()}원
                  </Text>
                  <Text style={styles.participantsText}>
                    {match.currentApplicants.total}/{match.expectedParticipants.total}명
                  </Text>
                </View>
              </View>

              <View style={styles.matchActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.applicationsButton]}
                  onPress={() => handleViewApplications(match)}
                >
                  <Users size={16} color="#ec4899" />
                  <Text style={styles.applicationsButtonText}>
                    참여신청 {pendingCount > 0 ? `(${pendingCount})` : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.editButton]}>
                  <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 참여신청 관리 모달 */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>참여신청 관리</Text>
            <TouchableOpacity onPress={() => setShowApplicationModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.matchInfoCard}>
            <Text style={styles.matchInfoTitle}>{selectedMatch?.title}</Text>
            <Text style={styles.matchInfoDetails}>
              {selectedMatch?.date} {selectedMatch?.time} · {selectedMatch?.court}
            </Text>
          </View>

          <ScrollView style={styles.applicationsContent}>
            <Text style={styles.sectionTitle}>
              참여신청 목록 ({getMatchApplications(selectedMatch?.id || '').length}건)
            </Text>

            {getMatchApplications(selectedMatch?.id || '').map((application) => (
              <View key={application.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <View style={styles.userInfo}>
                    {application.userProfileImage ? (
                      <Image 
                        source={{ uri: application.userProfileImage }}
                        style={styles.userAvatar}
                      />
                    ) : (
                      <View style={styles.userAvatarPlaceholder}>
                        <User size={20} color="#6b7280" />
                      </View>
                    )}
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{application.userName}</Text>
                      <Text style={styles.userMeta}>
                        {application.userGender} · NTRP {application.userNtrp}
                      </Text>
                      <Text style={styles.applicationTime}>
                        신청시간: {new Date(application.appliedAt).toLocaleString('ko-KR')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.applicationPrice}>
                    <Text style={styles.priceAmount}>
                      {application.appliedPrice.toLocaleString()}원
                    </Text>
                    <Text style={styles.priceLabel}>신청가격</Text>
                  </View>
                </View>

                <View style={styles.applicationActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.profileButton]}
                    onPress={() => {
                      // 프로필 보기 구현
                      Alert.alert('프로필 보기', '프로필 보기 기능을 구현해주세요');
                    }}
                  >
                    <User size={16} color="#6b7280" />
                    <Text style={styles.profileButtonText}>프로필</Text>
                  </TouchableOpacity>

                  <View style={styles.decisionButtons}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectApplication(selectedMatch?.id, application.userId)}
                    >
                      <X size={16} color="#dc2626" />
                      <Text style={styles.rejectButtonText}>거절</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleAcceptApplication(selectedMatch?.id, application.userId)}
                    >
                      <Check size={16} color="#ffffff" />
                      <Text style={styles.acceptButtonText}>승인</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  matchDetails: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  matchStatus: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 4,
  },
  participantsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
  },
  applicationsButton: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#ec4899',
  },
  applicationsButtonText: {
    color: '#ec4899',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  matchInfoCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  matchInfoDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  applicationsContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  applicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  applicationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  applicationPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 2,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  applicationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  profileButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#ec4899',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});