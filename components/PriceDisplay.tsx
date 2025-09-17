
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Clock } from 'lucide-react-native';
import { PricingFactors, PricingCalculator } from '../types/tennis';

interface PriceDisplayProps {
  currentPrice: number;
  basePrice: number;
  maxPrice: number;
  hoursUntilMatch: number;
  viewCount: number;
  applicationsCount: number; // 참여신청자 수
  expectedParticipants: number; // 모집인원 총합
  isClosed?: boolean;
}

export function PriceDisplay({ 
  currentPrice, 
  basePrice, 
  maxPrice, 
  hoursUntilMatch,
  viewCount,
  applicationsCount,
  expectedParticipants,
  isClosed = false
}: PriceDisplayProps) {
  const [animatedPrice, setAnimatedPrice] = useState(currentPrice);
  const [isIncreasing, setIsIncreasing] = useState(false);

  // 동적 가격 계산
  const calculateDynamicPrice = () => {
    const factors: PricingFactors = {
      viewCount,
      applicationsCount,
      expectedApplicants: expectedParticipants * 10, // 모집인원의 10배
      hoursUntilMatch,
      basePrice,
      maxPrice
    };
    
    return PricingCalculator.calculateDynamicPrice(factors);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPrice(prevPrice => {
        const targetPrice = calculateDynamicPrice();
        
        // 실시간 미세 변동 (±1% 범위에서 목표가격으로 수렴)
        const variation = (Math.random() - 0.5) * 0.02; // -1% ~ +1%
        const newPrice = targetPrice * (1 + variation);
        
        // 최종 가격 제한
        const finalPrice = Math.min(
          maxPrice,
          Math.max(basePrice, newPrice)
        );
        
        setIsIncreasing(finalPrice > prevPrice);
        return Math.round(finalPrice / 1000) * 1000;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [basePrice, maxPrice, hoursUntilMatch, viewCount, applicationsCount, expectedParticipants]);

  const priceChangePercentage = ((animatedPrice - basePrice) / basePrice * 100).toFixed(0);
  const showChange = Math.abs(parseInt(priceChangePercentage)) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        <Text style={[
          styles.price, 
          isIncreasing && styles.increasing,
          isClosed && styles.closedPrice
        ]}>
          {animatedPrice.toLocaleString()}원
        </Text>
        {showChange && !isClosed && (
          <View style={[
            styles.changeIndicator, 
            isIncreasing ? styles.upTrend : styles.downTrend
          ]}>
            <TrendingUp size={12} color={isIncreasing ? '#dc2626' : '#16a34a'} />
            <Text style={[
              styles.changeText,
              isIncreasing ? styles.upText : styles.downText
            ]}>
              {priceChangePercentage}%
            </Text>
          </View>
        )}
      </View>
      
      {/* 가격 변동 요인 표시 */}
      {!isClosed && (
        <View style={styles.factorsContainer}>
          {viewCount >= 500 && (
            <View style={styles.factorBadge}>
              <Text style={styles.factorText}>조회↑</Text>
            </View>
          )}
          {applicationsCount >= expectedParticipants * 10 && (
            <View style={styles.factorBadge}>
              <Text style={styles.factorText}>신청↑</Text>
            </View>
          )}
          {hoursUntilMatch <= 10 && hoursUntilMatch >= 0 && (
            <View style={[styles.factorBadge, styles.discountBadge]}>
              <Clock size={10} color="#dc2626" />
              <Text style={[styles.factorText, styles.discountText]}>시간할인</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  increasing: {
    color: '#dc2626',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  upTrend: {
    backgroundColor: '#fee2e2',
  },
  downTrend: {
    backgroundColor: '#fdf2f8',
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  upText: {
    color: '#dc2626',
  },
  downText: {
    color: '#16a34a',
  },
  closedPrice: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  factorsContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  factorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  discountBadge: {
    backgroundColor: '#fee2e2',
  },
  factorText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#92400e',
  },
  discountText: {
    color: '#dc2626',
  },
});