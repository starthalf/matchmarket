import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp, Flame, TrendingUp, Eye } from 'lucide-react-native';
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
  onPriceChange?: (price: number) => void;
}

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
  onPriceChange
}: PriceDisplayProps) {
  const actualSlots = Math.max(1, expectedParticipants);

  const calculateDynamicPrice = () => {
    const factors: PricingFactors = {
      viewCount,
      applicationsCount,
      expectedApplicants: expectedParticipants * 5,
      hoursUntilMatch,
      basePrice,
      maxPrice
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
  }, [basePrice, maxPrice, hoursUntilMatch, viewCount, applicationsCount, expectedParticipants, prevPrice]);

  const priceChangePercentage = Math.abs(((animatedPrice - basePrice) / basePrice * 100)).toFixed(0);
  const showChange = animatedPrice > basePrice;

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
        {showChange && (
          <View style={[styles.changeIndicator, styles.upTrend]}>
            <ArrowUp size={12} color="#dc2626" />
            <Text style={[styles.changeText, styles.upText]}>
              {priceChangePercentage}%
            </Text>
          </View>
        )}
      </View>

     {heatLevel > 0 && !isClosed && (
        <View style={[styles.heatBadge, { backgroundColor: heatInfo.bg }]}>
          {heatLevel === 4 ? (
            <>
              <Flame size={12} color={heatInfo.color} />
              <Flame size={12} color={heatInfo.color} />
            </>
          ) : heatLevel === 3 ? (
            <Flame size={12} color={heatInfo.color} />
          ) : heatLevel === 2 ? (
            <TrendingUp size={12} color={heatInfo.color} />
          ) : (
            <Eye size={12} color={heatInfo.color} />
          )}
          <Text style={[styles.heatText, { color: heatInfo.color }]}>
            {heatInfo.label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  increasing: {
    color: '#dc2626',
  },
  closedPrice: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
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
  changeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  upText: {
    color: '#dc2626',
  },
  heatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heatText: {
    fontSize: 11,
    fontWeight: '600',
  },
});