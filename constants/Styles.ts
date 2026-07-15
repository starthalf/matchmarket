import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export function useSafeStyles() {
  const insets = useSafeAreaInsets();

  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: '#f9fafb',
      paddingTop: insets.top,
    },
    safeHeader: {
      paddingTop: insets.top,
      backgroundColor: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    safeHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    safeContent: {
      flex: 1,
      backgroundColor: '#f9fafb',
    },
    safeBottomArea: {
      paddingBottom: insets.bottom,
      backgroundColor: '#ffffff',
    },
    // 추가 유틸리티 스타일
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
    },
    backButton: {
      padding: 4,
    },
    placeholder: {
      width: 32,
    },
  });
}