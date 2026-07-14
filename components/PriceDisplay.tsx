import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PricingFactors, PricingCalculator } from '../types/tennis';
import { Colors, Radius } from '../constants/theme';

interface PriceDisplayProps {
  currentPrice: number;
  basePrice: number;
  maxPrice: number;
  hoursUntilMatch: number;
  viewCount: number;
  applicationsCount: number;
  expectedParticipants: number;
  isClosed?: boolean;
  onPriceChange?: (price: number) => void;
}

/**
 * 히트 표시: 불꽃 이모지 나열 대신, 가격 위에 붙는 아주 작은 컬러 라벨.
 * 시선은 "가격"에 가야 한다. 배지가 가격보다 시끄러우면 안 된다.
 */
const HEAT_CONFIG = [
  { label: '', color: Colors.textTertiary },
  { label: '관심 상승', color: '#CA8A04' },
  { label: '신청 몰림', color: '#EA580C' },
  { label: '경쟁 치열', color: '#E11D48' },
  { label: '신청 폭주', color: '#BE123C' },
];

export function PriceDisplay({
  currentPrice,
  basePrice,
  maxPrice,
  hoursUntilMatch,
  viewCount,
  applicationsCount,
  expectedParticipants,
  isClosed = false,
  onPriceChange,
}: PriceDisplayProps) {
  const actualSlots = Math.max(1, expectedParticipants);

  const calculateDynamicPrice = () => {
    const factors: PricingFactors = {
      viewCount,
      applicationsCount,
      expectedApplicants: expectedParticipants * 5,
      hoursUntilMatch,
      basePrice,
      maxPrice,
    };
    return PricingCalculator.calculateDynamicPrice(factors);
  };

  const initialCalculatedPrice = calculateDynamicPrice();
  const [animatedPrice, setAnimatedPrice] = useState(initialCalculatedPrice);
  const [prevPrice, setPrevPrice] = useState(initialCalculatedPrice);

  const heatLevel = PricingCalculator.getHeatLevel(viewCount, applicationsCount, actualSlots);
  const heatInfo = HEAT_CONFIG[heatLevel];

  useEffect(() => {
    if (onPriceChange) onPriceChange(initialCalculatedPrice);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPrice(prevDisplayPrice => {
        const targetPrice = calculateDynamicPrice();
        const finalPrice = Math.min(maxPrice, Math.max(basePrice, targetPrice));
        const priceChange = Math.abs(finalPrice - prevPrice);
        const changePercentage = priceChange / basePrice;

        if (changePercentage < 0.03) return prevDisplayPrice;

        setPrevPrice(finalPrice);
        if (onPriceChange) onPriceChange(finalPrice);
        return finalPrice;
      });
    }, 120000);

    return () => clearInterval(interval);
  }, [
    basePrice,
    maxPrice,
    hoursUntilMatch,
    viewCount,
    applicationsCount,
    expectedParticipants,
    prevPrice,
  ]);

  const isUp = animatedPrice > basePrice;
  const changePct = Math.abs(((animatedPrice - basePrice) / basePrice) * 100).toFixed(0);

  return (
    <View style={styles.container}>
      {/* 위: 상태 라벨 (히트 or 인상률) */}
      {!isClosed && (heatLevel > 0 || isUp) && (
        <View style={styles.topLine}>
          {heatLevel > 0 && (
            <>
              <View style={[styles.dot, { backgroundColor: heatInfo.color }]} />
              <Text style={[styles.heatText, { color: heatInfo.color }]}>{heatInfo.label}</Text>
            </>
          )}
          {isUp && (
            <View style={styles.upTag}>
              <Text style={styles.upText}>▲ {changePct}%</Text>
            </View>
          )}
        </View>
      )}

      {/* 아래: 가격 (이 카드의 결론) */}
      <Text
        style={[
          styles.price,
          isUp && !isClosed && styles.priceUp,
          isClosed && styles.priceClosed,
        ]}
      >
        {animatedPrice.toLocaleString()}
        <Text style={styles.won}>원</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    gap: 2,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  heatText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  upTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    backgroundColor: Colors.accentSoft,
  },
  upText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Colors.accent,
  },

  price: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 25,
    color: Colors.text,
  },
  priceUp: {
    color: Colors.accent,
  },
  priceClosed: {
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  won: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: Colors.textSecondary,
  },
});
