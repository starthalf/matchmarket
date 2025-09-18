import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMatches } from '../../contexts/MatchContext';
import { useSafeStyles } from '../../constants/Styles';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { matches } = useMatches();
  const safeStyles = useSafeStyles();

  const match = matches.find(m => m.id === id);

  if (!match) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>매치를 찾을 수 없습니다.</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnMatch = match.sellerId === user?.id;

  return (
    <SafeAreaView style={safeStyles.safeContainer}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>매치 상세</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 매치 기본 정보 */}
        <View style={styles.matchInfoCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchTitle}>{match.title}</Text>
            <View style={styles.matchTypeBadge}>
              <Text style={styles.matchTypeText}>{match.matchType}</Text>
            </View>
          </View>

          <View style={styles.matchDetails}>
            <View style={styles.detailRow}>
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.detailText}>{match.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={16} color="#6b7280" />
              <Text style={styles.detailText}>{match.time} - {match.endTime}</Text>
            </View>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.detailText}>{match.court}</Text>
            </View>
            <View style={styles.detailRow}>
              <Users size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                총 {match.expectedParticipants?.total || 0}명 모집
              </Text>
            </View>
          </View>

          {match.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>매치 설명</Text>
              <Text style={styles.descriptionText}>{match.description}</Text>
            </View>
          )}
        </View>

        {/* 판매자 정보 */}
        <View style={styles.sellerCard}>
          <Text style={styles.sectionTitle}>판매자 정보</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerProfile}>
              <View style={styles.sellerAvatarPlaceholder}>
                <User size={20} color="#6b7280" />
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{match.seller?.name || '알 수 없음'}</Text>
                <Text style={styles.sellerMeta}>
                  {match.seller?.gender || ''} · NTRP {match.seller?.ntrp?.toFixed(1) || '0.0'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 가격 정보 */}
        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>매치 가격</Text>
          <View style={styles.priceInfo}>
            <Text style={styles.currentPrice}>
              {match.currentPrice.toLocaleString()}원
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 하단 고정 영역 */}
      <View style={styles.bottomBar}>
        <View style={styles.priceDisplay}>
          <Text style={styles.bottomPrice}>
            {match.currentPrice.toLocaleString()}원
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.applyButton,
            isOwnMatch && styles.applyButtonDisabled
          ]} 
          disabled={isOwnMatch}
        >
          <Text style={styles.applyButtonText}>
            {isOwnMatch ? '본인 매치' : '참여신청'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  matchInfoCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  matchTypeBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  matchTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  matchDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 24,
  },
  sellerCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sellerInfo: {
    gap: 16,
  },
  sellerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sellerAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sellerMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  priceCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  priceInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ec4899',
  },
  bottomPadding: {
    height: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 16,
  },
  priceDisplay: {
    flex: 1,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ec4899',
  },
  applyButton: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});