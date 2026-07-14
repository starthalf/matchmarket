// constants/Styles.ts
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { Colors, Type, Radius, Hairline } from './theme';

/**
 * ⚠️ 중요 변경점
 * 기존에는 <SafeAreaView>(safe-area-context, 기본 edges=all) 안에서
 * safeContainer.paddingTop = insets.top,
 * safeHeader.paddingTop  = insets.top
 * 을 또 줘서 상단 패딩이 2~3중으로 들어가 있었습니다.
 * (헤더가 애매하게 아래로 내려가 보이던 원인)
 *
 * SafeAreaView가 이미 top inset을 처리하므로 여기서는 더하지 않습니다.
 * 혹시 SafeAreaView 없이 쓰는 화면이 있으면 그 화면에서만
 * style={{ paddingTop: insets.top }} 을 직접 주세요.
 */
export function useSafeStyles() {
  const insets = useSafeAreaInsets();

  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    safeHeader: {
      backgroundColor: Colors.surface,
      borderBottomWidth: Hairline,
      borderBottomColor: Colors.border,
    },
    safeHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56,
    },
    safeContent: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    safeBottomArea: {
      paddingBottom: insets.bottom,
      backgroundColor: Colors.surface,
    },

    // ── 공통 유틸 ──
    headerTitle: {
      ...Type.h2,
      color: Colors.text,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -8,
    },
    placeholder: {
      width: 36,
    },
  });
}
