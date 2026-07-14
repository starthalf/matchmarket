// constants/theme.ts
import { Platform, StyleSheet, TextStyle } from 'react-native';

/**
 * MatchMarket Design System
 * ------------------------------------------------------------------
 * 원칙
 * 1. 색은 여기서만 정의한다. 화면에서 hex 하드코딩 금지.
 * 2. 중성 회색은 zinc 계열(뉴트럴)만 쓴다. tailwind gray(=blue-tinted) 금지.
 * 3. 카드는 border 또는 shadow 둘 중 하나만. 동시 사용 금지.
 * 4. borderRadius는 Radius 토큰만 사용 (8 / 12 / 16 / 20 / full).
 * 5. 한글 텍스트는 letterSpacing 음수(-0.2 ~ -0.6)가 기본이다.
 * 6. fontWeight 700은 "숫자/제목"에만. 본문은 400~500.
 *
 * 브랜드 컬러 하나만 바꾸고 싶으면 Colors.accent 만 수정하면 전체가 따라온다.
 */

export const Colors = {
  // ── 브랜드 액센트 (앱 전체에서 유일한 유채색 강조) ──
  accent: '#EC4899',
  accentPress: '#DB2777',
  accentSoft: '#FDF2F8',
  accentBorder: '#FBCFE8',

  // ── 잉크 (기본 UI 강조색 — 버튼/활성칩/탭) ──
  ink: '#18181B',
  inkSoft: '#27272A',
  inkOverlay: 'rgba(24, 24, 27, 0.88)',

  // ── 서피스 ──
  bg: '#FAFAFA', // 페이지 배경
  surface: '#FFFFFF', // 카드
  surfaceAlt: '#F4F4F5', // 인풋/서브 pill
  surfaceHover: '#EFEFF1',

  // ── 라인 ──
  border: '#E4E4E7',
  borderStrong: '#D4D4D8',
  divider: '#F1F1F2',

  // ── 텍스트 (zinc: 뉴트럴, 파란 기 없음) ──
  text: '#18181B',
  textSecondary: '#52525B',
  textTertiary: '#A1A1AA',
  textPlaceholder: '#A1A1AA',
  textOnInk: '#FFFFFF',
  textOnAccent: '#FFFFFF',

  // ── 시맨틱 ──
  success: '#16A34A',
  successSoft: '#F0FDF4',
  successBorder: '#BBF7D0',

  danger: '#E11D48',
  dangerSoft: '#FFF1F2',
  dangerBorder: '#FECDD3',

  warning: '#D97706',
  warningSoft: '#FFFBEB',
  warningBorder: '#FDE68A',

  info: '#2563EB',
  infoSoft: '#EFF6FF',
  infoBorder: '#BFDBFE',

  star: '#F59E0B',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

/**
 * 기존 하드코딩 hex → 신규 토큰 매핑표.
 * Bolt 전체 찾아바꾸기(Ctrl+Shift+H)로 다른 화면들 정리할 때 이 표를 쓰세요.
 *
 *  '#111827' → '#18181B'   (text)
 *  '#0d0c22' → '#18181B'   (ink)
 *  '#374151' → '#3F3F46'
 *  '#6b7280' → '#52525B'   (textSecondary)
 *  '#9ca3af' → '#A1A1AA'   (textTertiary)
 *  '#6e6d7a' → '#71717A'
 *  '#d1d5db' → '#D4D4D8'   (borderStrong)
 *  '#e5e7eb' → '#E4E4E7'   (border)
 *  '#f3f4f6' → '#F4F4F5'   (surfaceAlt)
 *  '#f9fafb' → '#FAFAFA'   (bg)
 *  '#f8f7f4' → '#FAFAFA'   (bg — 베이지 제거)
 *  '#ea4c89' → '#EC4899'   (accent 통일)
 *  '#ef4444' → '#E11D48'   (danger 통일)
 *  '#dc2626' → '#E11D48'
 */

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Hairline = StyleSheet.hairlineWidth;

/**
 * 그림자.
 * 웹(Bolt/PWA)에서는 shadow* 프로퍼티가 무시되고 경고가 뜨므로 boxShadow로 분기.
 * card 계열은 shadow 대신 border 1px을 쓰고, 떠 있는 요소(모달/FAB)만 shadow를 씁니다.
 */
export const Shadow = {
  none: Platform.select({
    web: { boxShadow: 'none' } as any,
    default: {},
  }),
  xs: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(24,24,27,0.04)' } as any,
    default: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
  }),
  sm: Platform.select({
    web: { boxShadow: '0 2px 6px rgba(24,24,27,0.06)' } as any,
    default: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: { boxShadow: '0 6px 16px rgba(24,24,27,0.08), 0 2px 4px rgba(24,24,27,0.04)' } as any,
    default: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 5,
    },
  }),
  lg: Platform.select({
    web: { boxShadow: '0 16px 40px rgba(24,24,27,0.14), 0 4px 10px rgba(24,24,27,0.06)' } as any,
    default: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 32,
      elevation: 12,
    },
  }),
};

export const Fonts = {
  regular: Platform.select({
    web: "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif",
    ios: 'System',
    android: 'sans-serif',
  }) as string,
};

/**
 * 타이포 스케일.
 * 한글은 letterSpacing 음수가 기본이다. 이거 하나로 "요즘 앱" 느낌의 절반이 나온다.
 * 사용법: <Text style={[Type.h2, { color: Colors.text }]}>
 */
export const Type = {
  display: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 30,
  } as TextStyle,
  h1: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 27,
  } as TextStyle,
  h2: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 23,
  } as TextStyle,
  h3: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 21,
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 21,
  } as TextStyle,
  bodyStrong: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.25,
    lineHeight: 21,
  } as TextStyle,
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.15,
    lineHeight: 18,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 16,
  } as TextStyle,
  micro: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 14,
  } as TextStyle,
  /** 금액 전용 — 숫자는 트래킹을 더 조인다 */
  price: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 24,
  } as TextStyle,
  priceSm: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 20,
  } as TextStyle,
} as const;

/** lucide 아이콘 기본 굵기. 2는 뭉툭해서 촌스럽다. */
export const IconStroke = 1.75;

/** 자주 쓰는 조합 프리셋 */
export const Layer = StyleSheet.create({
  /** 기본 카드: border만. shadow 얹지 말 것. */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  /** 서브 pill (NTRP, 모집 등 메타 정보) */
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
  },
  hairlineTop: {
    borderTopWidth: Hairline,
    borderTopColor: Colors.divider,
  },
  hairlineBottom: {
    borderBottomWidth: Hairline,
    borderBottomColor: Colors.border,
  },
});
