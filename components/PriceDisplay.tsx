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

  useEffect(() => {
    if (onPriceChange) {
      onPriceChange(initialCalculatedPrice);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPrice(prevDisplayPrice => {
        const targetPrice = calculateDynamicPrice();
        
        const finalPrice = Math.min(
          maxPrice,
          Math.max(basePrice, targetPrice)
        );

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
  const showChange = Math.abs(parseInt(priceChangePercentage)) > 0;

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
        {showChange && (
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