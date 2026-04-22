// components/AppToast.tsx - 앱 내 커스텀 토스트
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';
import { toast } from '../utils/toast';

export function AppToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('success');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    toast.setListener((msg, t = 'success') => {
      // 이전 타이머 클리어
      if (timerRef.current) clearTimeout(timerRef.current);

      setMessage(msg);
      setType(t);
      setVisible(true);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 3500);
    });

    return () => toast.removeListener();
  }, []);

  if (!visible) return null;

  const colors = {
    success: { bg: '#10b981', icon: CheckCircle },
    error: { bg: '#ef4444', icon: XCircle },
    info: { bg: '#3b82f6', icon: Info },
  };

  const { bg, icon: Icon } = colors[type];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: bg }]}>
      <Icon size={20} color="#fff" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    zIndex: 9998,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});