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
  applicationsCount: number;
  expectedParticipants: number;
  isClosed?: boolean;
  onPriceChange: (price: number) => void;
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
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [lastSignificantPrice, setLastSignificantPrice] = useState(currentPrice);

  // 동적 가격 계산
  const calculateDynamicPrice = () => {
    const factors: PricingFactors = {
      viewCount,
      applicationsCount,
      expectedApplicants: expectedParticipants * 5, // 모집인원의 5배로 변경
      hoursUntilMatch,
      basePrice,
      maxPrice
    };
    
    return PricingCalculator.calculateDynamicPrice(factors);
  };

  useEffect(() => {
    const updatePrice = () => {
      const targetPrice = calculateDynamicPrice();
      const newPrice = Math.min(maxPrice, Math.max(basePrice, targetPrice));

      const priceChangeRatio = Math.abs(newPrice - lastSignificantPrice) / basePrice;

      if (priceChangeRatio >= 0.03 || lastSignificantPrice === currentPrice) {
        setLastSignificantPrice(newPrice);
        setIsIncreasing(newPrice > basePrice);
        onPriceChange(newPrice);
      }
    };

    updatePrice();

    const interval = setInterval(() => {
      updatePrice();
    }, 120000);

    return () => clearInterval(interval);
  }, [basePrice, maxPrice, hoursUntilMatch, viewCount, applicationsCount, expectedParticipants, currentPrice]);

  const priceChangePercentage = Math.abs(((currentPrice - basePrice) / basePrice * 100)).toFixed(0);
  const showChange = Math.abs(parseInt(priceChangePercentage)) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.priceRow}>
        <Text style={[
          styles.price,
          isIncreasing && styles.increasing,
          isClosed && styles.closedPrice
        ]}>
          {currentPrice.toLocaleString()}원
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
});