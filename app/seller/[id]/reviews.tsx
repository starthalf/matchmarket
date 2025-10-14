import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, User } from 'lucide-react-native';
import { mockUsers, mockReviews } from '../../../data/mockData';
import { CertificationBadge } from '../../../components/CertificationBadge';
import { useSafeStyles } from '../../../constants/Styles';
import { supabase } from '../../../lib/supabase';
import { User } from '../../../types/tennis';

export default function SellerReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [seller, setSeller] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const reviews = mockReviews.filter(r => r.sellerId === id);
  const safeStyles = useSafeStyles();

  // 판매자 정보 로드
  React.useEffect(() => {
    const loadSeller = async () => {
      // 1. mockUsers에서 먼저 찾기
      let foundSeller = mockUsers.find(u => u.id === id);
      
      // 2. mockUsers에 없으면 Supabase에서 찾기
      if (!foundSeller && supabase) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
          
          if (data && !error) {
            // Supabase 데이터를 User 타입으로 변환
            foundSeller = {
              id: data.id,
              name: data.name,
              email: '',
              gender: data.gender,
              ageGroup: data.age_group,
              ntrp: data.ntrp,
              experience: data.experience,
              playStyle: data.play_style,
              careerType: data.career_type,
              certification: {
                ntrp: data.certification_ntrp,
                career: data.certification_career,
                youtube: data.certification_youtube,
                instagram: data.certification_instagram,
              },
              profileImage: data.profile_image,
              viewCount: data.view_count,
              likeCount: data.like_count,
              avgRating: data.avg_rating,
            };
          }
        } catch (error) {
          console.error('판매자 정보 로드 오류:', error);
        }
      }
      
      setSeller(foundSeller || null);
      setIsLoading(false);
    };

    loadSeller();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={safeStyles.safeContainer}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!seller) {
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
            <Text style={safeStyles.headerTitle}>리뷰</Text>
            <View style={safeStyles.placeholder} />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
            판매자를 찾을 수 없습니다.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={14}
        color="#f59e0b"
        fill={index < rating ? "#f59e0b" : "transparent"}
      />
    ));
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

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
          <Text style={safeStyles.headerTitle}>리뷰</Text>
          <View style={safeStyles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 판매자 정보 */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerInfo}>
            <View style={styles.profileImageContainer}>
              {seller.profileImage ? (
                <Image 
                  source={{ uri: seller.profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <User size={32} color="#9ca3af" />
                </View>
              )}
            </View>
            
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{seller.name}</Text>
                <CertificationBadge 
                  ntrpCert={seller.certification.ntrp}
                  careerCert={seller.certification.career}
                  size="medium"
                />
              </View>
              <Text style={styles.sellerMeta}>
                {seller.gender} · {seller.ageGroup} · NTRP {seller.ntrp} · {seller.careerType}
              </Text>
            </View>
          </View>
        </View>

        {/* 평점 요약 */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingOverview}>
            <View style={styles.ratingMain}>
              <Text style={styles.avgRating}>{seller.avgRating}</Text>
              <View style={styles.starsRow}>
                {renderStars(Math.round(seller.avgRating))}
              </View>
              <Text style={styles.reviewCount}>총 {reviews.length}개 리뷰</Text>
            </View>
            
            <View style={styles.ratingDistribution}>
              {ratingDistribution.map(({ star, count, percentage }) => (
                <View key={star} style={styles.distributionRow}>
                  <Text style={styles.starNumber}>{star}점</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${percentage}%` }]} 
                    />
                  </View>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 리뷰 목록 */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>리뷰 ({reviews.length})</Text>
          
          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>아직 리뷰가 없습니다.</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                    <View style={styles.reviewStars}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </Text>
                </View>
                
                <Text style={styles.reviewText}>{review.comment}</Text>
                
                {review.matchTitle && (
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchTitle}>매치: {review.matchTitle}</Text>
                  </View>
                )}
              </View>
            ))
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
  sellerCard: {
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
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  sellerMeta: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  ratingCard: {
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
  ratingOverview: {
    flexDirection: 'row',
    gap: 24,
  },
  ratingMain: {
    alignItems: 'center',
    flex: 1,
  },
  avgRating: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  ratingDistribution: {
    flex: 2,
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starNumber: {
    fontSize: 12,
    color: '#6b7280',
    width: 24,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
  },
  countText: {
    fontSize: 12,
    color: '#6b7280',
    width: 20,
    textAlign: 'right',
  },
  reviewsSection: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
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
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  matchInfo: {
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ec4899',
  },
  matchTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});