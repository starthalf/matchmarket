import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { 
  Clock, 
  MapPin, 
  UserRound, 
  Eye, 
  Zap, 
  Shield,
  Users
} from 'lucide-react-native';
import { Match } from '../types/tennis';
import { PriceDisplay } from './PriceDisplay';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const currentTime = new Date();
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const hoursUntilMatch = Math.max(0, (matchDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
  
  // 핫 매치 조건: 조회수가 예상의 150% 이상이거나 참여신청자가 많은 경우
  const isHotMatch = match.seller.viewCount > match.expectedViews * 1.5 || 
                     (match.applications?.length || 0) > match.expectedParticipants.total * 2;
  
  const handlePress = () => {
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
            <Text style={styles.sellerName}>{match.seller.name}</Text>
            <View style={styles.sellerMeta}>
              <Text style={styles.sellerMetaText}>
                {match.seller.gender} · NTRP {match.seller.ntrp.toFixed(1)}
              </Text>
              {match.seller.certification.ntrp === 'verified' && (
                <Shield size={12} color="#10b981" />
              )}
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {match.adEnabled && (
            <View style={styles.adBadge}>
              <Text style={styles.adText}>AD</Text>
            </View>
          )}
        </View>

        {/* 핫 매치 배지 */}
        {isHotMatch && (
          <View style={styles.hotBadge}>
            <Zap size={12} color="#ffffff" fill="#ffffff" />
            <Text style={styles.hotText}>HOT</Text>
          </View>
        )}
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
          <Text style={styles.ntrpText}>
            NTRP {match.ntrpRequirement.min.toFixed(1)}-{match.ntrpRequirement.max.toFixed(1)}
          </Text>
        </View>
        <View style={styles.recruitmentInfo}>
          <Users size={14} color="#6b7280" />
          <Text style={styles.recruitmentText}>
            {getRecruitmentStatus()}
          </Text>
          {(match.applications?.length || 0) > 0 && (
            <>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.applicationText}>
                신청 {match.applications?.length || 0}건
              </Text>
            </>
          )}
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
            maxPrice={match.maxPrice}
            hoursUntilMatch={hoursUntilMatch}
            viewCount={match.seller.viewCount}
            applicationsCount={match.applications?.length || 0}
            expectedParticipants={match.expectedParticipants.total}
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
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  sellerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sellerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  adBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  hotBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  hotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
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
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  matchTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ntrpRequirement: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ntrpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
  },
  recruitmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  recruitmentText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
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