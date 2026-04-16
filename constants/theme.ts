// constants/theme.ts
import { Platform } from 'react-native';

export const Colors = {
  // 브랜드 - 테니스 코트 딥그린 + 라임 액센트
  primary: '#0F3D2E',        // 딥 포레스트 그린 (메인)
  primaryLight: '#1B5E43',   // 호버/서브
  primarySoft: '#E8F0EB',    // 연한 그린 배경 (selected state 등)
  accent: '#D4FF4F',         // 라임 (CTA, 강조)
  accentDark: '#A8CC2E',     // 라임 눌렀을 때
  accentSoft: '#F4FFD4',     // 연한 라임 배경

  // 하트/좋아요 (기존 pink 대체)
  heart: '#FF4D6D',
  heartSoft: '#FFE8EC',

  // 뉴트럴 (웜톤 - 프리미엄 느낌)
  bg: '#FAFAF7',             // 페이지 배경
  surface: '#FFFFFF',        // 카드 배경
  surfaceAlt: '#F4F3EE',     // 서브 카드 / 입력필드 배경
  border: '#E8E6DE',         // 일반 테두리
  borderStrong: '#D4D1C7',   // 강조 테두리

  // 텍스트 (살짝 그린 틴트로 브랜드 통일성)
  text: '#111511',
  textSecondary: '#5C6159',
  textTertiary: '#8E938A',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#0F3D2E',

  // 시스템
  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
};

export const Fonts = {
  regular: Platform.select({
    web: "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif",
    ios: 'System',
    android: 'sans-serif',
  }) as string,
  display: Platform.select({
    web: "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif",
    ios: 'System',
    android: 'sans-serif-medium',
  }) as string,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const Shadow = {
  sm: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(15, 61, 46, 0.04), 0 1px 3px rgba(15, 61, 46, 0.06)' } as any,
    default: {
      shadowColor: '#0F3D2E',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: { boxShadow: '0 4px 12px rgba(15, 61, 46, 0.06), 0 2px 4px rgba(15, 61, 46, 0.04)' } as any,
    default: {
      shadowColor: '#0F3D2E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  }),
  lg: Platform.select({
    web: { boxShadow: '0 12px 32px rgba(15, 61, 46, 0.10), 0 4px 8px rgba(15, 61, 46, 0.06)' } as any,
    default: {
      shadowColor: '#0F3D2E',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  }),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};