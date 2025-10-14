import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock,
  MapPin,
  UserRound,
  Eye,
  Users,
  Star,
  Shield
} from 'lucide-react-native';
import { Match } from '../types/tennis';
import { PriceDisplay } from './PriceDisplay';
import { CertificationBadge } from './CertificationBadge';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const { user } = useAuth();
  const currentTime = new Date();
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const hoursUntilMatch = Math.max(0, (matchDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
  
  // 안전한 기본값 설정
  const applications = match.applications || [];
  
  // 더미 매치인지 확인 (더미 매치는 seller.id가 dummy_로 시작)
  const isDummyMatch = match.seller.id.startsWith('dummy_') || match.seller.id.startsWith('seller_');
  
const handlePress = () => {
  if (!user) {
    router.push('/auth/login');
    return;
  }
  
  router.push(`/match/${match.id}`);
};

  const getRecruitmentStatus = () => {
    const { male, female, total } = match.expectedParticipants;
    
    if (male > 0 && female > 0) {
      return `남성 ${male}명, 여성 ${female}명 모집`;
    } else if (male > 0) {
      return `남성 ${male}명 모집`;
    } else if (female > 0) {
      return `여성 ${female}명 모집`;
    } else {
      return `${total}명 모집`;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* 상단 - 판매자 정보 */}
      <View style={styles.header}>
        <View style={styles.sellerInfo}>
          {match.seller.profileImage ? (
            <Image source={{ uri: match.seller.profileImage }} style={styles.sellerAvatar} />
          ) : (
            <View style={styles.sellerAvatarPlaceholder}>
              <UserRound size={20} color="#6b7280" />
            </View>
          )}
          <View style={styles.sellerDetails}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName}>{match.seller.name}</Text>
              <CertificationBadge 
                ntrpCert={match.seller.certification.ntrp}
                careerCert={match.seller.certification.career}
                youtubeCert={match.seller.certification.youtube}
                instagramCert={match.seller.certification.instagram}
                size="tiny"
              />
            </View>
            <View style={styles.sellerMeta}>
              <Text style={styles.sellerMetaText}>
                {match.seller.gender} · {match.seller.ageGroup} · {match.seller.careerType} · NTRP {match.seller.ntrp.toFixed(1)}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{match.seller.avgRating}</Text>
              {!isDummyMatch && (
                <TouchableOpacity 
                  onPress={() => router.push(`/seller/${match.seller.id}/reviews`)}
                  style={styles.reviewLink}
                >
                  <Text style={styles.reviewLinkText}>리뷰 보기</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* 매치 제목 및 타입 */}
      <View style={styles.titleSection}>
        <Text style={styles.title} numberOfLines={2}>{match.title}</Text>
        <View style={styles.matchTypeBadge}>
          <Text style={styles.matchTypeText}>{match.matchType}</Text>
        </View>
      </View>
      
      {/* 매치 기본 정보 */}
      <View style={styles.matchInfo}>
        <View style={styles.infoRow}>
          <Clock size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {match.date.slice(5)} {match.time}~{match.endTime}
          </Text>
          <Text style={styles.separator}>·</Text>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.infoText}>{match.court}</Text>
        </View>
      </View>

      {/* 모집 현황 - 새로운 형태 */}
      <View style={styles.recruitmentStatus}>
        <View style={styles.ntrpRequirement}>
          <Shield size={14} color="#6b7280" />
          <Text style={styles.ntrpText}>
            NTRP {match.ntrpRequirement.min.toFixed(1)}-{match.ntrpRequirement.max.toFixed(1)}
          </Text>
        </View>
        <View style={styles.recruitmentInfo}>
          <Users size={14} color="#6b7280" />
          <Text style={styles.recruitmentText}>
            {getRecruitmentStatus()}
          </Text>
        </View>
      </View>

      {/* 하단 - 가격 및 액션 */}
      <View style={styles.footer}>
        {/* 조회수 */}
        <View style={styles.viewCount}>
          <Eye size={12} color="#9ca3af" />
          <Text style={styles.viewText}>{match.seller.viewCount}</Text>
        </View>
        
        <View style={styles.priceSection}>
          <PriceDisplay
            currentPrice={match.currentPrice}
            basePrice={match.basePrice}
            initialPrice={match.initialPrice}
            expectedViews={match.expectedViews}
            maxPrice={match.maxPrice}
            hoursUntilMatch={hoursUntilMatch}
            viewCount={match.seller.viewCount}
            waitingApplicants={match.waitingApplicants}
            expectedWaitingApplicants={match.expectedWaitingApplicants}
            sellerGender={match.seller.gender}
            sellerNtrp={match.seller.ntrp}
            isClosed={match.isClosed}
          />
        </View>
      </View>
      
      {/* 마감 오버레이 */}
      {match.isClosed && (
        <View style={styles.closedOverlay}>
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>마감</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sellerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
    flex: 1,
    gap: 4,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerMetaText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  reviewLink: {
    marginLeft: 4,
  },
  reviewLinkText: {
    fontSize: 11,
    color: '#ec4899',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    lineHeight: 22,
  },
  matchTypeBadge: {
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  matchTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ec4899',
  },
  matchInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 2,
  },
  recruitmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ntrpRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ntrpText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  recruitmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recruitmentText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  applicationText: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closedBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});