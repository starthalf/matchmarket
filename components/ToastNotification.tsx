import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function ToastNotification() {
  const router = useRouter();
  const { user } = useAuth();
  const [notification, setNotification] = useState<any>(null);
  const [slideAnim] = useState(new Animated.Value(-150));
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setHasCheckedInitial(false);
      return;
    }

    // 1. 로그인/새로고침 시 안 읽은 알림 확인 (1회)
    if (!hasCheckedInitial) {
      checkUnreadNotifications();
      setHasCheckedInitial(true);
    }

    // 2. 실시간 알림 구독
    const subscription = supabase
      .channel('toast_notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        showToast(payload.new);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, hasCheckedInitial]);

  // 안 읽은 알림 중 가장 최근 것 확인
const checkUnreadNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(1);  // ✅ .single() 제거

    if (data && data.length > 0 && !error) {
      showToast(data[0]);  // ✅ 배열의 첫 번째 요소
    }
  } catch (error) {
    // 안 읽은 알림 없음
  }
};

  const showToast = (data: any) => {
    setNotification(data);
    
    // 슬라이드 다운
    Animated.timing(slideAnim, {
      toValue: 50,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 5초 후 자동 숨김
    setTimeout(() => {
      hideToast();
    }, 5000);
  };

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null);
    });
  };

  const handlePress = async () => {
    // 알림 읽음 처리
    if (notification?.id) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
    }

    if (notification?.match_id) {
      router.push(`/match/${notification.match_id}`);
    }
    hideToast();
  };

  const handleClose = async () => {
    // 닫기 버튼 눌러도 읽음 처리
    if (notification?.id) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
    }
    hideToast();
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <Bell size={20} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={1}>
            {notification.message}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <X size={18} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ea4c89',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  closeBtn: {
    padding: 4,
  },
});