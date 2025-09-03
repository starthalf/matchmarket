import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Search, User, Star, Award, Calendar, TrendingUp, Eye, Heart, FileText, X } from 'lucide-react-native';
import { mockUsers } from '../../data/mockData';
import { CertificationBadge } from '../../components/CertificationBadge';

// Mock 인증 신청 데이터
const mockCertificationRequests = {
  '1': {
    id: 'cert_1',
    userId: '1',
    type: 'ntrp',
    requestedNtrp: 4.5,
    description: '대학교 테니스부에서 4년간 활동했으며, 지역 대회에서 여러 차례 입상 경험이 있습니다. 현재 NTRP 4.5 수준으로 평가받고 있습니다.',
    evidenceFiles: ['대회성적표_2024.jpg', '선수증명서.pdf', '코치추천서.pdf'],
    status: 'pending',
    submittedAt: '2024-12-27T10:30:00Z',
  },
  '2': {
    id: 'cert_2',
    userId: '2',
    type: 'ntrp',
    requestedNtrp: 4.0,
    description: '실업팀에서 5년간 선수 생활을 했으며, 현재는 코치로 활동하고 있습니다.',
    evidenceFiles: ['선수경력증명서.jpg', '코치자격증.pdf'],
    status: 'pending',
    submittedAt: '2024-12-26T15:20:00Z',
  },
  '3': {
    id: 'cert_3',
    userId: '3',
    type: 'youtube',
    description: '테니스 관련 유튜브 채널을 운영하고 있으며, 구독자 5만명을 보유하고 있습니다.',
    evidenceFiles: ['유튜브채널_스크린샷.jpg', '구독자수_증명.jpg'],
    status: 'pending',
    submittedAt: '2024-12-25T14:20:00Z',
  },
  '4': {
    id: 'cert_4',
    userId: '4',
    type: 'instagram',
    description: '테니스 관련 인스타그램 계정을 운영하고 있으며, 팔로워 2만명을 보유하고 있습니다.',
    evidenceFiles: ['인스타그램_프로필.jpg', '팔로워수_증명.jpg'],
    status: 'pending',
    submittedAt: '2024-12-25T09:15:00Z',
  },
};

export default function AdminUsersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'revenue' | 'matches'>('name');
  const [filterCertification, setFilterCertification] = useState<'all' | 'verified' | 'pending' | 'none'>('all');
  const [showCertRequestModal, setShowCertRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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

  const filteredUsers = mockUsers
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

  const handleViewCertification = (userId: string) => {
    const certRequest = mockCertificationRequests[userId as keyof typeof mockCertificationRequests];
    const user = mockUsers.find(u => u.id === userId);
    if (certRequest) {
      setSelectedUser({ ...user, certRequest });
      setShowCertRequestModal(true);
    } else {
      Alert.alert('알림', '해당 사용자의 인증 신청이 없습니다.');
    }
  };

  const handleCertificationAction = (action: 'approve' | 'reject') => {
    if (!selectedUser?.certRequest) return;

    const user = selectedUser;
    const actionText = action === 'approve' ? '승인' : '거부';
    const certType = selectedUser.certRequest?.type;
    const certTypeText = certType === 'ntrp' ? 'NTRP' : 
                        certType === 'youtube' ? '유튜버' : 
                        certType === 'instagram' ? '인플루언서' : '인증';
    
    Alert.alert(
      `인증 ${actionText}`,
      `${user?.name}님의 ${certTypeText} 인증을 ${actionText}하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: actionText, onPress: () => {
          setShowCertRequestModal(false);
          Alert.alert('완료', `인증이 ${actionText}되었습니다.`);
        }}
      ]
    );
  };

  const handleUserAction = (userId: string, action: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'suspend':
        Alert.alert(
          '사용자 정지',
          `${user.name}님을 정지하시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            { text: '정지', onPress: () => Alert.alert('완료', '사용자가 정지되었습니다.') }
          ]
        );
        break;
      case 'verify':
        Alert.alert(
          '인증 승인',
          `${user.name}님의 인증을 승인하시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            { text: '승인', onPress: () => Alert.alert('완료', '인증이 승인되었습니다.') }
          ]
        );
        break;
      case 'message':
        Alert.alert('메시지 발송', `${user.name}님에게 메시지를 발송합니다.`);
        break;
    }
  };

  const totalUsers = mockUsers.length;
  const verifiedUsers = mockUsers.filter(u => u.certification.ntrp === 'verified' || u.certification.career === 'verified').length;
  const pendingUsers = mockUsers.filter(u => 
    u.certification.ntrp === 'pending' || 
    u.certification.career === 'pending' ||
    u.certification.youtube === 'pending' ||
    u.certification.instagram === 'pending'
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>사용자 관리</Text>
        <Text style={styles.subtitle}>전체 사용자 현황 및 관리</Text>
      </View>

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
                
                {(user.certification.ntrp === 'pending' || user.certification.career === 'pending') && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.verifyButton]}
                    onPress={() => handleUserAction(user.id, 'verify')}
                  >
                    <Text style={styles.verifyButtonText}>인증승인</Text>
                  </TouchableOpacity>
                )}
                
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
  verifyButton: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  verifyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
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
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
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
  pendingStatus: {
    color: '#f59e0b',
  },
  approvedStatus: {
    color: '#16a34a',
  },
  descriptionCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  evidenceCard: {
    gap: 12,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  evidenceFileName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  viewFileButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewFileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  noCertRequestCard: {
    backgroundColor: '#f9fafb',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noCertRequestText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
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