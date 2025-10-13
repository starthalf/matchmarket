import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, User, Star, Award, Calendar, TrendingUp, Eye, Heart, FileText, X } from 'lucide-react-native';
import { CertificationBadge } from '../../components/CertificationBadge';
import { useSafeStyles } from '../../constants/Styles';
import { supabase } from '../../lib/supabase';

// 웹/모바일 호환 Alert 함수
const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message || title);
  } else {
    Alert.alert(title, message);
  }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: onConfirm }
    ]);
  }
};

export default function AdminUsersScreen() {
  const safeStyles = useSafeStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'revenue' | 'matches'>('name');
  const [filterCertification, setFilterCertification] = useState<'all' | 'verified' | 'pending' | 'none'>('all');
  const [showCertRequestModal, setShowCertRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [certificationRequests, setCertificationRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock 사용자 수익 데이터
  const userRevenues = {
    '1': 245000,
    '2': 189000,
    '3': 67500,
    '4': 34500,
    '5': 12000,
  };

  const userMatchCounts = {
    '1': 12,
    '2': 8,
    '3': 5,
    '4': 3,
    '5': 2,
  };

  // Supabase에서 사용자 목록과 인증 신청 목록 가져오기
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        console.warn('Supabase 연결 안 됨');
        setIsLoading(false);
        return;
      }

      // 인증 신청 목록 가져오기
      const { data: certData, error: certError } = await supabase
        .from('certification_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (certError) {
        console.error('인증 신청 목록 로드 오류:', certError);
      } else {
        setCertificationRequests(certData || []);
      }

      // 실제 users 테이블에서 사용자 목록 가져오기
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('사용자 목록 로드 오류:', usersError);
        showAlert('오류', '사용자 목록을 불러오지 못했습니다.');
      } else {
        // Supabase 형식을 앱 형식으로 변환
        const convertedUsers = usersData?.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email || '',
          gender: u.gender,
          ageGroup: u.age_group,
          ntrp: u.ntrp,
          experience: u.experience,
          playStyle: u.play_style,
          careerType: u.career_type,
          certification: {
            ntrp: u.certification_ntrp,
            career: u.certification_career,
            youtube: u.certification_youtube,
            instagram: u.certification_instagram,
          },
          profileImage: u.profile_image,
          viewCount: u.view_count,
          likeCount: u.like_count,
          avgRating: u.avg_rating,
        })) || [];
        
        setUsers(convertedUsers);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCertification = true;
      if (filterCertification === 'verified') {
        matchesCertification = user.certification.ntrp === 'verified' || 
                              user.certification.career === 'verified' ||
                              user.certification.youtube === 'verified' ||
                              user.certification.instagram === 'verified';
      } else if (filterCertification === 'pending') {
        matchesCertification = user.certification.ntrp === 'pending' || 
                              user.certification.career === 'pending' ||
                              user.certification.youtube === 'pending' ||
                              user.certification.instagram === 'pending';
      } else if (filterCertification === 'none') {
        matchesCertification = user.certification.ntrp === 'none' && 
                              user.certification.career === 'none' &&
                              user.certification.youtube === 'none' &&
                              user.certification.instagram === 'none';
      }
      
      return matchesSearch && matchesCertification;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.avgRating - a.avgRating;
        case 'revenue':
          return (userRevenues[b.id] || 0) - (userRevenues[a.id] || 0);
        case 'matches':
          return (userMatchCounts[b.id] || 0) - (userMatchCounts[a.id] || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

 const handleViewCertification = async (userId: string) => {
  const user = users.find(u => u.id === userId);
  
  console.log('🔍 인증보기 클릭 - userId:', userId);
  console.log('🔍 찾은 user:', user);
  
  // 실시간으로 해당 사용자의 인증 신청 조회
  if (supabase) {
    const { data: userRequests, error } = await supabase
      .from('certification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('🔍 Supabase 쿼리 결과:', { userRequests, error });
    
    if (error) {
      console.error('인증 신청 조회 오류:', error);
      showAlert('오류', '인증 신청을 불러오지 못했습니다.');
      return;
    }

    console.log('User ID:', userId);
    console.log('User Requests:', userRequests);
    
    if (userRequests && userRequests.length > 0) {
      console.log('✅ 인증 신청 있음 - 모달 열기');
      setSelectedUser({ ...user, certRequests: userRequests });
      setShowCertRequestModal(true);
    } else {
      console.log('❌ 인증 신청 없음');
      showAlert('알림', '해당 사용자의 인증 신청이 없습니다.');
    }
  } else {
    console.log('❌ Supabase 연결 없음');
  }
};

  const handleCertificationAction = async (action: 'approve' | 'reject', request: any) => {
    if (!request) return;

    const user = selectedUser;
    const actionText = action === 'approve' ? '승인' : '거부';
    const certTypeText = request.type === 'ntrp' ? 'NTRP' : 
                        request.type === 'youtube' ? '유튜버' : 
                        request.type === 'instagram' ? '인플루언서' :
                        request.type === 'career' ? '선수 경력' : '인증';
    
    showConfirm(
      `인증 ${actionText}`,
      `${user?.name}님의 ${certTypeText} 인증을 ${actionText}하시겠습니까?`,
      async () => {
        setIsProcessing(true);
        try {
          if (!supabase) {
            showAlert('오류', 'Supabase 연결이 필요합니다.');
            setIsProcessing(false);
            return;
          }

          // 1. certification_requests 테이블 업데이트
          const { error: requestError } = await supabase
            .from('certification_requests')
            .update({ 
              status: action === 'approve' ? 'approved' : 'rejected',
              updated_at: new Date().toISOString()
            })
            .eq('id', request.id);

          if (requestError) {
            console.error('인증 요청 업데이트 오류:', requestError);
            showAlert('오류', '인증 처리에 실패했습니다.');
            setIsProcessing(false);
            return;
          }

          // 2. users 테이블 업데이트 (승인된 경우에만)
          if (action === 'approve') {
            const certificationField = `certification_${request.type}`;
            const { error: userError } = await supabase
              .from('users')
              .update({ [certificationField]: 'verified' })
              .eq('id', user.id);

            if (userError) {
              console.error('사용자 인증 상태 업데이트 오류:', userError);
            }
          }

          // 3. UI 업데이트
          await loadData();
          setShowCertRequestModal(false);
          showAlert('완료', `${certTypeText} 인증이 ${actionText}되었습니다.`);
        } catch (error) {
          console.error('인증 처리 중 오류:', error);
          showAlert('오류', '인증 처리 중 오류가 발생했습니다.');
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  const handleUserAction = (userId: string, action: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'suspend':
        showConfirm(
          '사용자 정지',
          `${user.name}님을 정지하시겠습니까?`,
          () => showAlert('완료', '사용자가 정지되었습니다.')
        );
        break;
      case 'message':
        showAlert('메시지 발송', `${user.name}님에게 메시지를 발송합니다.`);
        break;
    }
  };

  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => 
    u.certification.ntrp === 'verified' || 
    u.certification.career === 'verified' ||
    u.certification.youtube === 'verified' ||
    u.certification.instagram === 'verified'
  ).length;
  const pendingUsers = certificationRequests.length;

  const getCertTypeLabel = (type: string) => {
    switch (type) {
      case 'ntrp': return 'NTRP';
      case 'career': return '선수 경력';
      case 'youtube': return '유튜버';
      case 'instagram': return '인플루언서';
      default: return type;
    }
  };

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      <View style={safeStyles.safeHeader}>
        <View style={safeStyles.safeHeaderContent}>
          <Text style={styles.title}>사용자 관리</Text>
          <Text style={styles.subtitle}>전체 사용자 현황 및 관리</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 사용자 현황 요약 */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>사용자 현황</Text>
            
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <User size={24} color="#3b82f6" />
                <Text style={styles.summaryAmount}>{totalUsers}명</Text>
                <Text style={styles.summaryLabel}>전체 사용자</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Award size={24} color="#16a34a" />
                <Text style={styles.summaryAmount}>{verifiedUsers}명</Text>
                <Text style={styles.summaryLabel}>인증 사용자</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Calendar size={24} color="#f59e0b" />
                <Text style={styles.summaryAmount}>{pendingUsers}명</Text>
                <Text style={styles.summaryLabel}>인증 대기</Text>
              </View>
            </View>
          </View>

          {/* 검색 및 필터 */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Search size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="사용자 검색..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'name', label: '이름순' },
                { key: 'rating', label: '평점순' },
                { key: 'revenue', label: '수익순' },
                { key: 'matches', label: '매치순' },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.key}
                  style={[
                    styles.filterButton,
                    sortBy === sort.key && styles.filterButtonActive
                  ]}
                  onPress={() => setSortBy(sort.key as any)}
                >
                  <Text style={[
                    styles.filterText,
                    sortBy === sort.key && styles.filterTextActive
                  ]}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                { key: 'all', label: '전체' },
                { key: 'verified', label: '인증완료' },
                { key: 'pending', label: '인증대기' },
                { key: 'none', label: '미인증' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.certFilterButton,
                    filterCertification === filter.key && styles.certFilterButtonActive
                  ]}
                  onPress={() => setFilterCertification(filter.key as any)}
                >
                  <Text style={[
                    styles.certFilterText,
                    filterCertification === filter.key && styles.certFilterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 사용자 목록 */}
          <View style={styles.usersSection}>
            <Text style={styles.sectionTitle}>
              사용자 목록 ({filteredUsers.length})
            </Text>
            
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userBasicInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <CertificationBadge 
                        ntrpCert={user.certification.ntrp}
                        careerCert={user.certification.career}
                        size="small"
                      />
                    </View>
                    <Text style={styles.userDetails}>
                      {user.gender} · {user.ageGroup} · NTRP {user.ntrp} · {user.careerType}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.userStats}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Star size={16} color="#f59e0b" />
                      <Text style={styles.statValue}>{user.avgRating}</Text>
                      <Text style={styles.statLabel}>평점</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <TrendingUp size={16} color="#16a34a" />
                      <Text style={styles.statValue}>
                        {(userRevenues[user.id] || 0).toLocaleString()}원
                      </Text>
                      <Text style={styles.statLabel}>총 수익</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Calendar size={16} color="#3b82f6" />
                      <Text style={styles.statValue}>{userMatchCounts[user.id] || 0}회</Text>
                      <Text style={styles.statLabel}>매치</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statRow}>
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
                    
                    <View style={styles.statItem}>
                      <User size={16} color="#9ca3af" />
                      <Text style={styles.statValue}>
                        {Math.floor(user.experience / 12)}년
                      </Text>
                      <Text style={styles.statLabel}>경력</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.userActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.messageButton]}
                    onPress={() => handleUserAction(user.id, 'message')}
                  >
                    <Text style={styles.messageButtonText}>메시지</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.certViewButton]}
                    onPress={() => handleViewCertification(user.id)}
                  >
                    <Text style={styles.certViewButtonText}>인증보기</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.suspendButton]}
                    onPress={() => handleUserAction(user.id, 'suspend')}
                  >
                    <Text style={styles.suspendButtonText}>정지</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* 인증 신청 모달 */}
      <Modal
        visible={showCertRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCertRequestModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCertRequestModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>인증 신청 내역</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedUser && (
              <>
                {/* 사용자 정보 */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>사용자 정보</Text>
                  <View style={styles.userInfoCard}>
                    <View style={styles.userInfoRow}>
                      <Text style={styles.userInfoLabel}>이름</Text>
                      <Text style={styles.userInfoValue}>{selectedUser.name}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                      <Text style={styles.userInfoLabel}>NTRP</Text>
                      <Text style={styles.userInfoValue}>{selectedUser.ntrp}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                      <Text style={styles.userInfoLabel}>경력</Text>
                      <Text style={styles.userInfoValue}>{selectedUser.careerType}</Text>
                    </View>
                  </View>
                </View>

                {/* 인증 신청 목록 */}
                {selectedUser.certRequests && selectedUser.certRequests.map((request: any) => (
                  <View key={request.id} style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      {getCertTypeLabel(request.type)} 인증 신청
                    </Text>
                    
                    {request.requested_ntrp && (
                      <View style={styles.certRequestCard}>
                        <View style={styles.certRequestRow}>
                          <Text style={styles.certRequestLabel}>신청 NTRP</Text>
                          <Text style={styles.certRequestValue}>{request.requested_ntrp}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.descriptionCard}>
                      <Text style={styles.descriptionText}>{request.description}</Text>
                    </View>

                    <View style={styles.certActionButtons}>
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.rejectButton]}
                        onPress={() => handleCertificationAction('reject', request)}
                        disabled={isProcessing}
                      >
                        <Text style={styles.rejectButtonText}>
                          {isProcessing ? '처리중...' : '거부'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.modalActionButton, styles.approveButton]}
                        onPress={() => handleCertificationAction('approve', request)}
                        disabled={isProcessing}
                      >
                        <Text style={styles.approveButtonText}>
                          {isProcessing ? '처리중...' : '승인'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {(!selectedUser.certRequests || selectedUser.certRequests.length === 0) && (
                  <View style={styles.noCertRequestCard}>
                    <Text style={styles.noCertRequestText}>
                      인증 신청 내역이 없습니다.
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 로딩 오버레이 */}
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingOverlayText}>처리 중...</Text>
        </View>
      )}
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
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
  summarySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
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
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  certFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  certFilterButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  certFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  certFilterTextActive: {
    color: '#ffffff',
  },
  usersSection: {
    marginHorizontal: 16,
  },
  userCard: {
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
  userHeader: {
    marginBottom: 12,
  },
  userBasicInfo: {
    gap: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  userDetails: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  userStats: {
    gap: 12,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  userActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionButton: {
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  messageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  certViewButton: {
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  certViewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },
  suspendButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  suspendButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomPadding: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingTop: 16,
  },
  modalSection: {
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
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  userInfoCard: {
    gap: 8,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  userInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  certRequestCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
    gap: 8,
    marginBottom: 12,
  },
  certRequestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  certRequestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  certRequestValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  descriptionCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  noCertRequestCard: {
    backgroundColor: '#f9fafb',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  noCertRequestText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  certActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#dc2626',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  approveButton: {
    backgroundColor: '#16a34a',
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});