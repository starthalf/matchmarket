import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { MapPin, Clock, Eye, Crown, Zap, User, Users, UserCheck, Star, UserRound } from 'lucide-react-native';
import { Match } from '../types/tennis';
import { CertificationBadge } from './CertificationBadge';
import { PriceDisplay } from './PriceDisplay';
import { useAuth } from '../contexts/AuthContext';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const { user } = useAuth();
  const hoursUntilMatch = Math.max(0, 
    (new Date(`${match.date}T${match.time}`).getTime() - new Date().getTime()) / (1000 * 60 * 60)
  );
  
  const { expectedParticipants, currentApplicants } = match;
  const isCompleted = currentApplicants.total >= expectedParticipants.total;

  const handlePress = () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    router.push(`/match/${match.id}`);
  };

  // 성별 아이콘 및 스타일
  const getGenderStyle = (gender: string) => {
    return gender === '여성' ? styles.femaleIcon : styles.maleIcon;
  };

  // 나이대 아이콘
  const getAgeIcon = (ageGroup: string) => {
    const ageMap: { [key: string]: string } = {
      '20대': '2️⃣',
      '30대': '3️⃣', 
      '40대': '4️⃣',
      '50대+': '5️⃣'
    };
    return ageMap[ageGroup] || '🎾';
  };

  // 모집 진행률 계산
  const isHotMatch = match.waitingApplicants > 5;
  const isPremiumSeller = match.seller.certification.ntrp === 'verified' || match.seller.certification.career === 'verified';

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isPremiumSeller && styles.premiumCard,
        match.isClosed && styles.closedCard
      ]} 
      onPress={match.isClosed ? undefined : handlePress}
      disabled={match.isClosed}
    >
      {/* 상단 헤더 - 판매자 정보 */}
      <View style={styles.header}>
        <View style={styles.sellerSection}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {match.seller.profileImage ? (
                <Image 
                  source={{ uri: match.seller.profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <User size={24} color="#9ca3af" />
                </View>
              )}
            </View>
            
            <View style={styles.sellerMainInfo}>
              <View style={styles.sellerNameRow}>
                <CertificationBadge 
                  ntrpCert={match.seller.certification.ntrp}
                  careerCert={match.seller.certification.career}
                  youtubeCert={match.seller.certification.youtube}
                  instagramCert={match.seller.certification.instagram}
                  size="tiny"
                />
                <Text style={styles.sellerName} numberOfLines={1} ellipsizeMode="tail">
                  {match.seller.name}
                </Text>
                <Text style={styles.ntrpBadge}>{match.seller.ntrp.toFixed(1)}</Text>
              </View>
              
              <View style={styles.sellerStats}>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerDetailText}>
                    {match.seller.gender} · {match.seller.ageGroup} · {match.seller.careerType}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.ratingText}>{match.seller.avgRating}</Text>
                    <TouchableOpacity 
                      onPress={() => router.push(`/seller/${match.seller.id}/reviews`)}
                      style={styles.reviewLink}
                    >
                      <Text style={styles.reviewLinkText}>리뷰 보기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
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
      
      {/* 매치 기본 정보 - 두 줄로 구성 */}
      <View style={styles.matchInfo}>
        {/* 첫 번째 줄: 시간과 테니스 코트 */}
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

      {/* 모집 현황 */}
      <View style={styles.recruitmentStatus}>
        <View style={styles.ntrpRequirement}>
          <Text style={styles.ntrpText}>
            NTRP {match.ntrpRequirement.min.toFixed(1)}-{match.ntrpRequirement.max.toFixed(1)}
          </Text>
        </View>
        <View style={styles.recruitmentInfo}>
          <Text style={styles.genderText}>
            {match.expectedParticipants.male > 0 && (
              <View style={styles.genderItem}>
                <UserRound size={14} color="#3b82f6" />
                <Text style={styles.genderCount}>{match.currentApplicants.male}/{match.expectedParticipants.male}</Text>
              </View>
            )}
            {match.expectedParticipants.male > 0 && match.expectedParticipants.female > 0 && (
              <Text style={styles.genderSeparator}>·</Text>
            )}
            {match.expectedParticipants.female > 0 && (
              <View style={styles.genderItem}>
                <UserRound size={14} color="#ec4899" />
                <Text style={styles.genderCount}>{match.currentApplicants.female}/{match.expectedParticipants.female}</Text>
              </View>
            )}
            {match.waitingApplicants > 0 && ` · 대기 ${match.waitingApplicants}명`}
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
  premiumCard: {
    borderColor: '#d1d5db',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  sellerSection: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  profileImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d1d5db',
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
  sellerMainInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sellerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  ntrpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sellerTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  femaleIcon: {
    backgroundColor: '#fdf2f8',
    borderColor: '#ec4899',
  },
  maleIcon: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  ageTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageIcon: {
    fontSize: 12,
  },
  sellerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerDetailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
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
  careerType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ec4899',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
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
  matchType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ec4899',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
    overflow: 'hidden',
  },
  matchInfo: {
    gap: 6,
    marginBottom: 8,
  },
  separator: {
    fontSize: 12,
    color: '#d1d5db',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  recruitmentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ntrpRequirement: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  ntrpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recruitmentInfo: {
    alignItems: 'flex-end',
  },
  genderText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genderCount: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  genderSeparator: {
    fontSize: 12,
    color: '#9ca3af',
    marginHorizontal: 4,
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  footer: {
    backgroundColor: '#fafafa',
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceSection: {
    flex: 1,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  closedCard: {
    opacity: 0.7,
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closedBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
});