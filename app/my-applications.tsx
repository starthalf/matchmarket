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
    const myWaiting = match.waitingList?.find(w => w.userId === user.id);
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
        case 'pending': return app.participation?.status === 'payment_pending' || app.participation?.status === 'payment_submitted';
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
      const status = app.participation?.status;
      switch (status) {
        case 'confirmed':
          return {
            text: '참가확정',
            color: '#dcfce7',
            textColor: '#16a34a',
            icon: <CheckCircle size={16} color="#16a34a" />
          };
        case 'payment_pending':
          return {
            text: '입금대기',
            color: '#fef3c7',
            textColor: '#f59e0b',
            icon: <Clock size={16} color="#f59e0b" />
          };
        case 'payment_submitted':
          return {
            text: '입금확인중',
            color: '#dbeafe',
            textColor: '#3b82f6',
            icon: <Clock size={16} color="#3b82f6" />
          };
        case 'cancelled_by_user':
          return {
            text: '참가취소',
            color: '#fee2e2',
            textColor: '#dc2626',
            icon: <X size={16} color="#dc2626" />
          };
        default:
          return {
            text: '알 수 없음',
            color: '#f3f4f6',
            textColor: '#6b7280',
            icon: <AlertTriangle size={16} color="#6b7280" />
          };
      }
    } else if (app.type === 'waiting') {
      return {
        text: '대기중',
        color: '#fef3c7',
        textColor: '#f59e0b',
        icon: <Clock size={16} color="#f59e0b" />
      };
    }
    return {
      text: '알 수 없음',
      color: '#f3f4f6',
      textColor: '#6b7280',
      icon: <AlertTriangle size={16} color="#6b7280" />
    };
  };

  const getWaitingPosition = (app: any) => {
    if (app.type !== 'waiting' || !app.waiting) return null;
    
    const waitingList = app.match.waitingList || [];
    const position = waitingList.findIndex((w: any) => w.userId === user.id) + 1;
    return position > 0 ? position : null;
  };

  const handleMatchPress = (matchId: string) => {
    router.push(`/match/${matchId}`);
  };

  const handleCancelWaiting = (app: any) => {
    if (app.type !== 'waiting') return;
    
    Alert.alert(
      '대기 취소',
      '정말로 대기를 취소하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '대기 취소', onPress: () => {
          // 대기자 목록에서 제거
          const waiterIndex = app.match.waitingList?.findIndex((w: any) => w.userId === user.id);
          if (waiterIndex !== undefined && waiterIndex > -1 && app.match.waitingList) {
            app.match.waitingList.splice(waiterIndex, 1);
            app.match.waitingApplicants = Math.max(0, (app.match.waitingApplicants || 0) - 1);
          }
          Alert.alert('대기 취소 완료', '대기자 신청이 취소되었습니다.');
        }}
      ]
    );
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
    app?.type === 'participant' && (app.participation?.status === 'payment_pending' || app.participation?.status === 'payment_submitted')
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
                        <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                          {statusInfo.text}
                        </Text>
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
                          참가비: {app.participation?.paymentAmount?.toLocaleString() || app.match.currentPrice.toLocaleString()}원
                        </Text>
                      </View>
                    )}
                    
                    {waitingPosition && (
                      <View style={styles.waitingInfo}>
                        <Text style={styles.waitingPosition}>대기 순서: {waitingPosition}번</Text>
                      </View>
                    )}
                  </View>

                  {app.type === 'waiting' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCancelWaiting(app);
                        }}
                      >
                        <Text style={styles.cancelButtonText}>대기 취소</Text>
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
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  summarySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
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
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicationDetails: {
    gap: 8,
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
  waitingInfo: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  waitingPosition: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  actionButtons: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomPadding: {
    height: 40,
  },
});