import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, Youtube, Instagram, Award } from 'lucide-react-native';

interface CertificationBadgeProps {
  ntrpCert: 'none' | 'pending' | 'verified';
  careerCert: 'none' | 'pending' | 'verified';
  youtubeCert?: 'none' | 'pending' | 'verified';
  instagramCert?: 'none' | 'pending' | 'verified';
  size?: 'tiny' | 'small' | 'medium' | 'large';
}

export function CertificationBadge({ 
  ntrpCert, 
  careerCert, 
  youtubeCert = 'none',
  instagramCert = 'none',
  size = 'medium' 
}: CertificationBadgeProps) {
  const iconSize = size === 'tiny' ? 8 : size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const badgeSize = size === 'tiny' ? 14 : size === 'small' ? 18 : size === 'medium' ? 24 : 30;

  const badges = [];

  // NTRP 인증 배지
  if (ntrpCert === 'verified') {
    badges.push(
      <View key="ntrp" style={[
        styles.badge, 
        styles.ntrpBadge,
        { width: badgeSize, height: badgeSize }
      ]}>
        <Check size={iconSize} color="#ffffff" strokeWidth={3} />
      </View>
    );
  }

  // 선수 인증 배지 (기존 careerCert)
  if (careerCert === 'verified') {
    badges.push(
      <View key="career" style={[
        styles.badge, 
        styles.careerBadge,
        { width: badgeSize, height: badgeSize }
      ]}>
        <Award size={iconSize} color="#ffffff" strokeWidth={2} />
      </View>
    );
  }

  // 유튜버 인증 배지
  if (youtubeCert === 'verified') {
    badges.push(
      <View key="youtube" style={[
        styles.badge, 
        styles.youtubeBadge,
        { width: badgeSize, height: badgeSize }
      ]}>
        <Youtube size={iconSize} color="#ffffff" strokeWidth={2} fill="#ffffff" />
      </View>
    );
  }

  // 인플루언서 인증 배지
  if (instagramCert === 'verified') {
    badges.push(
      <View key="instagram" style={[
        styles.badge, 
        styles.instagramBadge,
        { width: badgeSize, height: badgeSize }
      ]}>
        <Instagram size={iconSize} color="#ffffff" strokeWidth={2} />
      </View>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {badges}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  ntrpBadge: {
    backgroundColor: '#ec4899',
  },
  careerBadge: {
    backgroundColor: '#059669',
  },
  youtubeBadge: {
    backgroundColor: '#dc2626',
  },
  instagramBadge: {
    backgroundColor: '#e1306c',
  },
  pending: {
    backgroundColor: '#f59e0b',
  },
});