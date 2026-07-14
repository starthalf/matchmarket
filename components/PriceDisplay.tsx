import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
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
 * 히트 배지 (Lv0~4)
 * 불꽃 아이콘 개수 + 색상으로 열기를 표현.
 * 단, 가격보다 시끄러우면 안 되므로 아이콘은 11px로 작게 유지.
 */
const HEAT_CONFIG = [
  { label: '', color: Colors.textTertiary, bg: 'transparent', flames: 0 },
  { label: '관심 상승', color: '#CA8A04', bg: '#FEFCE8', flames: 1 },
  { label: '신청 몰림', color: '#EA580C', bg: '#FFF7ED', flames: 2 },
  { label: '경쟁 치열', color: '#E11D48', bg: '#FFF1F2', flames: 3 },
  { label: '신청 폭주', color: '#BE123C', bg: '#FFE4E6', flames: 3 },
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
      {/* 위: 히트 배지(🔥) + 인상률 */}
      {!isClosed && (heatLevel > 0 || isUp) && (
        <View style={styles.topLine}>
          {heatLevel > 0 && (
            <View style={[styles.heatBadge, { backgroundColor: heatInfo.bg }]}>
              <View style={styles.flames}>
                {Array.from({ length: heatInfo.flames }).map((_, i) => (
                  <Flame
                    key={i}
                    size={11}
                    color={heatInfo.color}
                    fill={heatInfo.color}
                    strokeWidth={0}
                    style={i > 0 ? styles.flameOverlap : undefined}
                  />
                ))}
              </View>
              <Text style={[styles.heatText, { color: heatInfo.color }]}>{heatInfo.label}</Text>
            </View>
          )}

          {isUp && (
            <View style={styles.upTag}>
              <Text style={styles.upText}>▲ {changePct}%</Text>
            </View>
          )}
        </View>
      )}

      {/* 아래: 가격 */}
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
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  flames: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameOverlap: {
    marginLeft: -3, // 불꽃을 살짝 겹쳐서 "덩어리"로 보이게
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