// constants/theme.ts
import { Platform } from 'react-native';

export const Colors = {
  // 브랜드 컬러 - 테니스 코트 딥그린 + 라임 액센트
  primary: '#0F3D2E',        // 딥 포레스트 그린 (메인)
  primaryLight: '#1B5E43',   // 호버/서브
  accent: '#D4FF4F',         // 라임 옐로우그린 (CTA, 강조)
  accentDark: '#A8CC2E',     // 라임 눌렀을 때
  
  // 기존 pink는 warning/heart용으로만 남김
  heart: '#FF4D6D',          // 좋아요 아이콘 등
  
  // 뉴트럴 (웜톤으로 바꿔서 프리미엄 느낌)
  bg: '#FAFAF7',             // 페이지 배경 (기존 #f9fafb 대체)
  surface: '#FFFFFF',        // 카드 배경
  surfaceAlt: '#F4F3EE',     // 서브 카드
  border: '#E8E6DE',         // 테두리 (기존 #e5e7eb 대체)
  borderStrong: '#D4D1C7',
  
  // 텍스트
  text: '#111511',           // 거의 검정이지만 살짝 녹색 띔
  textSecondary: '#5C6159',
  textTertiary: '#8E938A',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#0F3D2E',   // 라임 위엔 딥그린 텍스트
  
  // 시스템
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#F59E0B',
  info: '#2563EB',
};

export const Fonts = {
  // Pretendard는 웹에서 CDN, 모바일은 system fallback
  regular: Platform.select({
    web: "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif",
    ios: 'System',
    android: 'sans-serif',
  }),
  // 숫자/영문 강조용
  display: Platform.select({
    web: "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif",
    ios: 'System',
    android: 'sans-serif-medium',
  }),
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
  // 웹/모바일 공용 - 부드럽고 깊이감 있게
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