import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
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
  onPriceChange?: (price: number) => void;
}

export function PriceDisplay({
  currentPrice,
  basePrice,
  maxPrice,
  hoursUntilMatch,
  viewCount,
  applicationsCount,
  expectedParticipants,
  isClosed = false,
  onPriceChange
}: PriceDisplayProps) {
  // 동적 가격 계산 함수
  const calculateDynamicPrice = () => {
    const factors: PricingFactors = {
      viewCount,
      applicationsCount,
      expectedApplicants: expectedParticipants * 5, // 모집인원의 5배
      hoursUntilMatch,
      basePrice,
      maxPrice
    };

    return PricingCalculator.calculateDynamicPrice(factors);
  };

  // 🔥 초기 가격을 동적 계산된 가격으로 설정
  const initialCalculatedPrice = calculateDynamicPrice();
  const [animatedPrice, setAnimatedPrice] = useState(initialCalculatedPrice);
  const [isIncreasing, setIsIncreasing] = useState(initialCalculatedPrice > basePrice);
  const [prevPrice, setPrevPrice] = useState(initialCalculatedPrice);

  // 🔥 초기 렌더링 시에도 부모에게 가격 알림
  useEffect(() => {
    if (onPriceChange) {
      onPriceChange(initialCalculatedPrice);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPrice(prevDisplayPrice => {
        const targetPrice = calculateDynamicPrice();
        
        // 최종 가격 제한
        const finalPrice = Math.min(
          maxPrice,
          Math.max(basePrice, targetPrice)
        );

        // 3% 임계값 체크 - basePrice 대비 변동이 3% 미만이면 업데이트 스킵
        const priceChange = Math.abs(finalPrice - prevPrice);
        const changePercentage = priceChange / basePrice;

        if (changePercentage < 0.03) {
          return prevDisplayPrice; // 이전 가격 유지
        }

        // 3% 이상 변동 시에만 업데이트
        setPrevPrice(finalPrice);
        setIsIncreasing(finalPrice > basePrice);

        // 부모 컴포넌트에 가격 변경 알림
        if (onPriceChange) {
          onPriceChange(finalPrice);
        }

        return finalPrice;
      });
    }, 120000); // 2분 (120000ms)

    return () => clearInterval(interval);
  }, [basePrice, maxPrice, hoursUntilMatch, viewCount, applicationsCount, expectedParticipants, prevPrice]);

  const priceChangePercentage = Math.abs(((animatedPrice - basePrice) / basePrice * 100)).toFixed(0);
  const showChange = Math.abs(parseInt(priceChangePercentage)) > 0;

  // 🔥 가격 변동 사유 메시지 생성
  const getPriceReasonText = () => {
    if (!isIncreasing || !showChange || isClosed) return null;
    return '🔥 신청자가 폭증하고 있어요';
  };

  const priceReasonText = getPriceReasonText();

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
            {isIncreasing ? (
              <ArrowUp size={12} color="#dc2626" />
            ) : (
              <ArrowDown size={12} color="#16a34a" />
            )}
            <Text style={[
              styles.changeText,
              isIncreasing ? styles.upText : styles.downText
            ]}>
              {priceChangePercentage}%
            </Text>
          </View>
        )}
      </View>
      {priceReasonText && (
        <Text style={styles.priceReason}>{priceReasonText}</Text>
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
  priceReason: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 4,
  },
});