import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp, Flame, TrendingUp, Eye } from 'lucide-react-native';
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
 * 히트 배지 (Lv0~4) — 원본 라벨/색상 그대로.
 * 레벨별 아이콘도 원본과 동일: Eye → TrendingUp → Flame×1 → Flame×2
 */
const HEAT_CONFIG = [
  { label: '', color: 'transparent', bg: 'transparent' },
  { label: '관심이 증가하고 있어요', color: '#f59e0b', bg: '#fffbeb' },
  { label: '신청자가 몰리고 있어요', color: '#f97316', bg: '#fff7ed' },
  { label: '신청 경쟁이 매우 치열해요', color: '#ef4444', bg: '#fef2f2' },
  { label: '신청자가 폭주하고 있어요', color: '#dc2626', bg: '#fef2f2' },
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
        setIsIncreasing(finalPrice > basePrice);
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

  const priceChangePercentage = Math.abs(
    ((animatedPrice - basePrice) / basePrice) * 100
  ).toFixed(0);
  const showChange = animatedPrice > basePrice;

  return (
    <View style={styles.container}>
      {/* 위: 히트 배지 (레벨별 아이콘) + 인상률.
          인상률은 마감에도 표시(원본 동작). 불꽃/히트 배지는 마감 시 숨김(원본 동작). */}
      {(heatLevel > 0 || showChange) && (
        <View style={styles.topLine}>
          {heatLevel > 0 && !isClosed && (
            <View style={[styles.heatBadge, { backgroundColor: heatInfo.bg }]}>
              {heatLevel === 4 ? (
                <View style={styles.heatIcons}>
                  <Flame size={11} color={heatInfo.color} fill={heatInfo.color} strokeWidth={0} />
                  <Flame
                    size={11}
                    color={heatInfo.color}
                    fill={heatInfo.color}
                    strokeWidth={0}
                    style={styles.flameOverlap}
                  />
                </View>
              ) : heatLevel === 3 ? (
                <Flame size={11} color={heatInfo.color} fill={heatInfo.color} strokeWidth={0} />
              ) : heatLevel === 2 ? (
                <TrendingUp size={11} color={heatInfo.color} strokeWidth={2.2} />
              ) : (
                <Eye size={11} color={heatInfo.color} strokeWidth={2} />
              )}
              <Text style={[styles.heatText, { color: heatInfo.color }]}>{heatInfo.label}</Text>
            </View>
          )}

          {showChange && (
            <View style={styles.upTag}>
              <ArrowUp size={10} color={Colors.accent} strokeWidth={2.6} />
              <Text style={styles.upText}>{priceChangePercentage}%</Text>
            </View>
          )}
        </View>
      )}

      {/* 아래: 가격 (원본대로 마감이어도 변동가 표시 + 취소선) */}
      <Text
        style={[
          styles.price,
          isIncreasing && !isClosed && styles.priceUp,
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
    gap: 3,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  heatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  heatIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameOverlap: {
    marginLeft: -3,
  },
  heatText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  upTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
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
