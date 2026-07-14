import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp } from 'lucide-react-native';
import { PricingFactors, PricingCalculator } from '../types/tennis';
import { Colors, Radius, Type } from '../constants/theme';

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
 * 히트 배지: 불꽃 이모지 2개 겹치기 같은 건 촌스럽다.
 * → 컬러 dot + 짧은 라벨. 레벨은 색으로만 구분.
 */
const HEAT_CONFIG = [
  { label: '', color: Colors.transparent, bg: Colors.transparent },
  { label: '관심 상승', color: '#CA8A04', bg: '#FEFCE8' },
  { label: '신청 몰림', color: '#EA580C', bg: '#FFF7ED' },
  { label: '경쟁 치열', color: '#E11D48', bg: '#FFF1F2' },
  { label: '신청 폭주', color: '#BE123C', bg: '#FFF1F2' },
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
  const [isIncreasing, setIsIncreasing] = useState(initialCalculatedPrice > basePrice);
  const [prevPrice, setPrevPrice] = useState(initialCalculatedPrice);

  const heatLevel = PricingCalculator.getHeatLevel(viewCount, applicationsCount, actualSlots);
  const heatInfo = HEAT_CONFIG[heatLevel];

  useEffect(() => {
    if (onPriceChange) {
      onPriceChange(initialCalculatedPrice);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPrice(prevDisplayPrice => {
        const targetPrice = calculateDynamicPrice();
        const finalPrice = Math.min(maxPrice, Math.max(basePrice, targetPrice));
        const priceChange = Math.abs(finalPrice - prevPrice);
        const changePercentage = priceChange / basePrice;

        if (changePercentage < 0.03) {
          return prevDisplayPrice;
        }

        setPrevPrice(finalPrice);
        setIsIncreasing(finalPrice > basePrice);

        if (onPriceChange) {
          onPriceChange(finalPrice);
        }

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

  const priceChangePercentage = Math.abs(
    ((animatedPrice - basePrice) / basePrice) * 100
  ).toFixed(0);
  const showChange = animatedPrice > basePrice;

  return (
    <View style={styles.container}>
      {heatLevel > 0 && !isClosed && (
        <View style={[styles.heatBadge, { backgroundColor: heatInfo.bg }]}>
          <View style={[styles.heatDot, { backgroundColor: heatInfo.color }]} />
          <Text style={[styles.heatText, { color: heatInfo.color }]}>{heatInfo.label}</Text>
        </View>
      )}

      <View style={styles.priceRow}>
        {showChange && !isClosed && (
          <View style={styles.changeIndicator}>
            <ArrowUp size={10} color={Colors.accent} strokeWidth={2.5} />
            <Text style={styles.changeText}>{priceChangePercentage}%</Text>
          </View>
        )}
        <Text
          style={[
            styles.price,
            isIncreasing && !isClosed && styles.increasing,
            isClosed && styles.closedPrice,
          ]}
        >
          {animatedPrice.toLocaleString()}
          <Text style={styles.won}>원</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    gap: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    ...Type.price,
    color: Colors.text,
  },
  won: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: Colors.textSecondary,
  },
  increasing: {
    color: Colors.accent,
  },
  closedPrice: {
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: Colors.accentSoft,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Colors.accent,
  },
  heatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  heatDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  heatText: {
    ...Type.micro,
    letterSpacing: -0.1,
  },
});
