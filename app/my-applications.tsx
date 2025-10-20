import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, CreditCard, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, User, X } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useMatches } from '../contexts/MatchContext';
import { MatchParticipant } from '../types/tennis';
import { useSafeStyles } from '../constants/Styles';

export default function MyApplicationsScreen() {
  const { user } = useAuth();
  const { matches } = useMatches();
  const safeStyles = useSafeStyles();
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'waiting' | 'cancelled'>('all');

  if (!user) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <Text>로그인이 필요합니다.</Text>
      </SafeAreaView>
    );
  }

  // 내가 참가신청한 매치들 찾기
  const myApplications = matches.map(match => {
    // 참가자 목록에서 내 정보 찾기
    const myParticipation = match.participants.find(p => p.userId === user.id);
    if (myParticipation) {
      return {
        match,
        participation: myParticipation,
        type: 'participant' as const,
      };
    }

    // 대기자 목록에서 내 정보 찾기
    const myWaiting = match.waitingList.find(w => w.userId === user.id);
    if (myWaiting) {
      return {
        match,
        waiting: myWaiting,
        type: 'waiting' as const,
      };
    }

    return null;
  }).filter(Boolean);

  // 필터링
  const filteredApplications = myApplications.filter(app => {
    if (!app) return false;
    
    if (filterStatus === 'all') return true;
    
    if (app.type === 'participant') {
      switch (filterStatus) {
        case 'confirmed': return app.participation?.status === 'confirmed';
        case 'pending': return app.participation?.status === 'payment_pending';
        case 'cancelled': return app.participation?.status === 'cancelled_by_user' || app.participation?.status === 'refunded';
        default: return false;
      }
    } else if (app.type === 'waiting') {
      return filterStatus === 'waiting';
    }
    
    return false;
  });

  const getStatusInfo = (app: any) => {
    if (app.type === 'participant') {
      const status = app.participation.status;
      switch (status) {
        case 'confirmed':
          return { text: '참가확정', color: '#16a34a', icon: <CheckCircle size={16} color="#16a34a" /> };
        case 'payment_pending':
          return { text: '입금확인중', color: '#f59e0b', icon: <Clock size={16} color="#f59e0b" /> };
        case 'cancelled_by_user':
          return { text: '취소됨', color: '#dc2626', icon: <X size={16} color="#dc2626" /> };
        case 'refunded':
          return { text: '환불완료', color: '#6b7280', icon: <CheckCircle size={16} color="#6b7280" /> };
        default:
          return { text: '알 수 없음', color: '#6b7280', icon: <AlertTriangle size={16} color="#6b7280" /> };
      }
    } else {
      return { text: '대기중', color: '#f59e0b', icon: <Clock size={16} color="#f59e0b" /> };
    }
  };

  const getWaitingPosition = (app: any) => {
    if (app.type !== 'waiting') return null;
    
    const waitingList = app.match.waitingList
      .filter((w: any) => w.status === 'waiting')
      .sort((a: any, b: any) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    
    const position = waitingList.findIndex((w: any) => w.userId === user.id);
    return position >= 0 ? position + 1 : null;
  };

  const handleMatchPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  const handleCancelApplication = (app: any) => {
    if (app.type === 'waiting') {
      Alert.alert(
        '대기 취소',
        '대기자 신청을 취소하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '대기 취소', onPress: () => {
            // 대기자 목록에서 제거
            const waiterIndex = app.match.waitingList.findIndex((w: any) => w.userId === user.id);
            if (waiterIndex > -1) {
              app.match.waitingList.splice(waiterIndex, 1);
              app.match.waitingApplicants = Math.max(0, app.match.waitingApplicants - 1);
            }
            Alert.alert('대기 취소 완료', '대기자 신청이 취소되었습니다.');
          }}
        ]
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // 통계 계산
  const confirmedCount = myApplications.filter(app => 
    app?.type === 'participant' && app.participation?.status === 'confirmed'
  ).length;
  
  const pendingCount = myApplications.filter(app => 
    app?.type === 'participant' && app.participation?.status === 'payment_pending'
  ).length;
  
  const waitingCount = myApplications.filter(app => app?.type === 'waiting').length;

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
          <Text style={safeStyles.headerTitle}>내 참가신청</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 신청 현황 요약 */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>신청 현황</Text>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <CheckCircle size={24} color="#16a34a" />
              <Text style={styles.summaryAmount}>{confirmedCount}개</Text>
              <Text style={styles.summaryLabel}>참가확정</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Clock size={24} color="#f59e0b" />
              <Text style={styles.summaryAmount}>{pendingCount}개</Text>
              <Text style={styles.summaryLabel}>입금확인중</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <User size={24} color="#6b7280" />
              <Text style={styles.summaryAmount}>{waitingCount}개</Text>
              <Text style={styles.summaryLabel}>대기중</Text>
            </View>
          </View>
        </View>

        {/* 필터 */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: '전체' },
              { key: 'confirmed', label: '참가확정' },
              { key: 'pending', label: '입금확인중' },
              { key: 'waiting', label: '대기중' },
              { key: 'cancelled', label: '취소됨' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  filterStatus === filter.key && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus(filter.key as any)}
              >
                <Text style={[
                  styles.filterText,
                  filterStatus === filter.key && styles.filterTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 신청 목록 */}
        <View style={styles.applicationsSection}>
          <Text style={styles.sectionTitle}>
            신청 목록 ({filteredApplications.length})
          </Text>
          
          {filteredApplications.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>신청한 매치가 없습니다</Text>
              <Text style={styles.emptyText}>매치를 찾아서 참가해보세요</Text>
            </View>
          ) : (
            filteredApplications.map((app, index) => {
              if (!app) return null;
              
              const statusInfo = getStatusInfo(app);
              const waitingPosition = getWaitingPosition(app);
              
              return (
                <TouchableOpacity 
                  key={`${app.match.id}_${index}`}
                  style={styles.applicationCard}
                  onPress={() => handleMatchPress(app.match.id)}
                >
                  <View style={styles.applicationHeader}>
                    <View style={styles.matchTitleRow}>
                      <Text style={styles.matchTitle} numberOfLines={1}>
                        {app.match.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                        {statusInfo.icon}
                        <Text style={styles.statusText}>{statusInfo.text}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.applicationDetails}>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {formatDate(app.match.date)} {formatTime(app.match.time)}~{formatTime(app.match.endTime)}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.detailText}>{app.match.court}</Text>
                    </View>
                    
                    {app.type === 'participant' && (
                      <View style={styles.detailRow}>
                        <CreditCard size={16} color="#6b7280" />
                        <Text style={styles.detailText}>
                          결제금액: {app.participation?.paymentAmount.toLocaleString()}원
                        </Text>
                      </View>
                    )}
                    
                    {app.type === 'waiting' && waitingPosition && (
                      <View style={styles.detailRow}>
                        <User size={16} color="#6b7280" />
                        <Text style={styles.detailText}>
                          대기순서: {waitingPosition}번째
                        </Text>
                      </View>
                    )}
                  </View>

                  {app.type === 'waiting' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.cancelWaitingButton}
                        onPress={() => handleCancelApplication(app)}
                      >
                        <Text style={styles.cancelWaitingButtonText}>대기 취소</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
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
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  applicationsSection: {
    marginHorizontal: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  applicationCard: {
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
  applicationHeader: {
    marginBottom: 12,
  },
  matchTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  matchTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  applicationDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelWaitingButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  cancelWaitingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomPadding: {
    height: 40,
  },
}); 