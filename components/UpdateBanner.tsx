// components/UpdateBanner.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { RefreshCw, X } from 'lucide-react-native';

interface UpdateBannerProps {
  visible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ visible, onUpdate, onDismiss }) => {
  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <RefreshCw size={20} color="#ffffff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>새 버전이 있습니다</Text>
          <Text style={styles.description}>업데이트하시겠습니까?</Text>
        </View>
        <TouchableOpacity style={styles.updateButton} onPress={onUpdate}>
          <Text style={styles.updateButtonText}>업데이트</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
          <X size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ea4c89',
    zIndex: 9999,
    paddingTop: 'env(safe-area-inset-top)' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  description: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  updateButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  updateButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ea4c89',
  },
  closeButton: {
    padding: 4,
  },
});