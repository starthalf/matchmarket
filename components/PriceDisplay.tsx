import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Clock } from 'lucide-react-native';

interface PriceDisplayProps {
  currentPrice: number;
  basePrice: number;
  initialPrice: number;
  expectedViews: number;
  maxPrice: number;
  hoursUntilMatch: number;
  viewCount: number;
  waitingApplicants: number;
  expectedWaitingApplicants: number;
  sellerGender: string;
  sellerNtrp: number;
  isClosed?: boolean;
}

export function PriceDisplay({ 
  currentPrice, 
  basePrice, 
  initialPrice,
  expectedViews,
  maxPrice, 
  hoursUntilMatch,
  viewCount,
  waitingApplicants,
  expectedWaitingApplicants,
  sellerGender,
  sellerNtrp,
  isClosed = false
}: PriceDisplayProps) {
  const [animatedPrice, setAnimatedPrice] = useState(currentPrice);
  const [isIncreasing, setIsIncreasing] = useState(false);

  // 초기 가격 계산 함수 (매치 등록 시)
  const calculateInitialPrice = (basePrice: number, sellerGender: string, sellerNtrp: number, hoursUntilMatch: number) => {
    let initialPrice = basePrice;
    
    // 1. 기본 할증 (성별 + 실력)
    let basePremium = 0;
    
    // 성별 할증
    if (sellerGender === '여성') {
      basePremium += 0.10; // 여성 10% 할증
    } else if (sellerGender === '남성' && sellerNtrp >= 4.0) {
      basePremium += 0.05; // 남성 고수 5% 할증
    }
    
    initialPrice *= (1 + basePremium);
    
    // 2. 황금시간대 할증 (저녁 6-9시)
    const matchHour = new Date(Date.now() + hoursUntilMatch * 60 * 60 * 1000).getHours();
    if (matchHour >= 18 && matchHour <= 21 && 
        (sellerGender === '여성' || sellerNtrp >= 4.0)) {
      initialPrice *= 1.07; // 황금시간대 7% 할증
    }
    
    // 3. 예상 조회수 기반 할증
    let expectedViewPremium = 0;
    if (expectedViews >= 1000) expectedViewPremium = 0.2; // 20%
    else if (expectedViews >= 500) expectedViewPremium = 0.15; // 15%
    else if (expectedViews >= 200) expectedViewPremium = 0.08; // 8%
    
    initialPrice *= (1 + expectedViewPremium);
    
    return Math.round(initialPrice / 1000) * 1000;
  };

  // 동적 가격 조정 함수 (실시간)
  const calculateDynamicPrice = () => {
    let dynamicPrice = initialPrice;
    
    // 특별 조건: 모집인원이 남성만이고 판매자 NTRP가 3.7 이하인 경우 할증 조건 2배
    const isMaleOnlyLowNtrp = sellerGender === '남성' && sellerNtrp <= 3.7;
    const conditionMultiplier = isMaleOnlyLowNtrp ? 2 : 1;
    
    // 1. 실제 vs 예상 조회수 비교 조정
    const viewRatio = viewCount / Math.max(expectedViews, 1);
    let viewAdjustment = 0;
    
    if (viewRatio > (1.5 * conditionMultiplier)) viewAdjustment = 0.3; // 특별조건시 3.0배 이상 많아야 30% 할증
    else if (viewRatio > (1.2 * conditionMultiplier)) viewAdjustment = 0.2; // 특별조건시 2.4배 이상 많아야 20% 할증
    else if (viewRatio > (1.0 * conditionMultiplier)) viewAdjustment = 0.1; // 특별조건시 2.0배 이상 많아야 10% 할증
    else if (viewRatio < (0.5 / conditionMultiplier)) viewAdjustment = -0.2; // 특별조건시 25% 이하면 20% 할인
    else if (viewRatio < (0.8 / conditionMultiplier)) viewAdjustment = -0.1; // 특별조건시 40% 이하면 10% 할인
    
    dynamicPrice *= (1 + viewAdjustment);
    
    // 2. 실제 vs 예상 대기자 수 비교 조정
    const waitingRatio = waitingApplicants / Math.max(expectedWaitingApplicants, 1);
    let waitingAdjustment = 0;
    
    if (waitingRatio > (2.0 * conditionMultiplier)) waitingAdjustment = 0.35; // 특별조건시 4.0배 이상 많아야 35% 할증
    else if (waitingRatio > (1.5 * conditionMultiplier)) waitingAdjustment = 0.25; // 특별조건시 3.0배 이상 많아야 25% 할증
    else if (waitingRatio > (1.0 * conditionMultiplier)) waitingAdjustment = 0.15; // 특별조건시 2.0배 이상 많아야 15% 할증
    else if (waitingRatio < (0.5 / conditionMultiplier)) waitingAdjustment = -0.12; // 특별조건시 25% 이하면 12% 할인
    
    dynamicPrice *= (1 + waitingAdjustment);
    
    // 3. 추가 실시간 조회수 할증 (기본 예상치 외 추가 할증)
    if (viewCount > expectedViews) {
      const extraViews = viewCount - expectedViews;
      const extraViewPremium = Math.min(0.3, (extraViews / (100 * conditionMultiplier)) * 0.02); // 특별조건시 추가 조회수 200당 2%, 최대 30%
      dynamicPrice *= (1 + extraViewPremium);
    }
    
    // 4. 시간 할인 (24시간 전부터 할인 시작)
    if (hoursUntilMatch <= 24 && hoursUntilMatch >= 0) {
      // 24시간 전부터: 시간당 2% 할인 (최대 48% 할인)
      const timeDiscount = Math.min(0.48, (24 - hoursUntilMatch) * 0.02);
      dynamicPrice *= (1 - timeDiscount);
    }
    
    // 5. 최소/최대 가격 제한
    dynamicPrice = Math.max(basePrice, dynamicPrice); // 최소: 기본가격
    dynamicPrice = Math.min(maxPrice, dynamicPrice); // 최대: 최대가격
    
    return Math.round(dynamicPrice / 1000) * 1000; // 1000원 단위로 반올림
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPrice(prevPrice => {
        // 실시간 동적 가격 계산
        const targetPrice = calculateDynamicPrice();
        
        // 실시간 미세 변동 (±2% 범위에서 목표가격으로 수렴)
        const variation = (Math.random() - 0.5) * 0.04; // -2% ~ +2%
        const newPrice = targetPrice * (1 + variation);
        
        // 최종 가격 제한
        const finalPrice = Math.min(
          maxPrice,
          Math.max(basePrice, newPrice) // 기본가격 이하로는 절대 하락 안함
        );
        
        setIsIncreasing(newPrice > prevPrice);
        return Math.round(finalPrice / 1000) * 1000;
      });
    }, 5000);

    return () => clearInterval(interval);
}, [basePrice, initialPrice, maxPrice, hoursUntilMatch, viewCount, waitingApplicants, expectedViews, expectedWaitingApplicants]);

  const priceChangePercentage = ((animatedPrice - initialPrice) / initialPrice * 100).toFixed(0);

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
      </View>
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
    color: '#ec4899',
  },
  closedPrice: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
});